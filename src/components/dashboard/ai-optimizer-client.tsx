
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { collection, onSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Project, Worker } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lightbulb, UserCheck, AlertCircle } from 'lucide-react';
import { suggestProjectPriority, ProjectPriorityOutput } from '@/ai/flows/project-priority-suggestions';
import { matchWorkerToProject, MatchWorkerToProjectOutput } from '@/ai/flows/worker-project-matching';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '../ui/skeleton';

function useFirestoreCollection<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      const collectionData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setData(collectionData);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching ${collectionName}: `, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not fetch ${collectionName} data.`,
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, toast]);

  return { data, loading };
}


export function ProjectPrioritizer() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ProjectPriorityOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { data: projects, loading: projectsLoading } = useFirestoreCollection<Project>('projects');
  const { data: workers, loading: workersLoading } = useFirestoreCollection<Worker>('workers');

  const handleSuggestPriority = () => {
    if (!projects.length || !workers.length) {
      toast({
        variant: 'destructive',
        title: 'Not Enough Data',
        description: 'There must be at least one project and one worker to generate suggestions.',
      });
      return;
    }
    startTransition(async () => {
      setError(null);
      setResult(null);
      try {
        const input = {
          projects: projects.map(p => ({
            name: p.name,
            deadline: p.deadline,
            description: p.description,
            workers: workers.map(w => w.name)
          })),
          workers: workers.map(w => `${w.name} (Skills: ${w.skills.join(', ')})`),
        };
        const suggestion = await suggestProjectPriority(input);
        setResult(suggestion);
        toast({
          title: "AI Suggestion Ready",
          description: "Project priority order has been generated.",
        });
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error Generating Suggestion",
          description: errorMessage,
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Priority Suggestion</CardTitle>
        <CardDescription>
          Let AI analyze project deadlines and worker availability to suggest the optimal project order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={handleSuggestPriority} disabled={isPending || projectsLoading || workersLoading}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Suggest Priority Order"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>AI-Suggested Priority Order</AlertTitle>
              <AlertDescription className="space-y-4">
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  {result.priorityOrder.map((projectName, index) => (
                    <li key={index}>
                      <strong>{projectName}</strong>
                    </li>
                  ))}
                </ol>
                <div>
                  <h4 className="font-semibold mt-4">Reasoning:</h4>
                  <p className="text-sm">{result.reasoning}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkerMatcher() {
  const [isPending, startTransition] = useTransition();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [result, setResult] = useState<MatchWorkerToProjectOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { data: projects, loading: projectsLoading } = useFirestoreCollection<Project>('projects');
  const { data: workers, loading: workersLoading } = useFirestoreCollection<Worker>('workers');

  const handleMatchWorker = () => {
    if (!selectedProjectId) {
      toast({
        variant: 'destructive',
        title: "No Project Selected",
        description: "Please select a project to find a worker for.",
      });
      return;
    }
     if (!workers.length) {
      toast({
        variant: 'destructive',
        title: 'No Workers Available',
        description: 'There are no workers in the database to match.',
      });
      return;
    }

    startTransition(async () => {
      setError(null);
      setResult(null);
      try {
        const project = projects.find(p => p.id === selectedProjectId);
        if (!project) throw new Error("Project not found");

        // Simple skill extraction from description, can be improved.
        const requiredSkills = project.description.toLowerCase().includes("solder") ? ['Soldering'] : ['Final Assembly'];

        const input = {
          projectId: project.id,
          projectDescription: project.description,
          projectDeadline: project.deadline,
          skillsRequired: requiredSkills,
          workerPool: workers.map(w => ({
            workerId: w.id,
            skills: w.skills,
            availability: w.availability,
            pastPerformance: w.pastPerformance,
          })),
        };
        const match = await matchWorkerToProject(input);
        setResult(match);
        toast({
          title: "AI Match Found",
          description: "A suitable worker has been suggested.",
        });
      } catch (e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error Finding Match",
          description: errorMessage,
        });
      }
    });
  };

  const matchedWorker = result ? workers.find(w => w.id === result.workerId) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Worker Matching</CardTitle>
        <CardDescription>
          Select a project and let AI find the most suitable worker based on skills, availability, and performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projectsLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <div className="flex gap-2">
              <Select onValueChange={setSelectedProjectId} value={selectedProjectId} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleMatchWorker} disabled={isPending || !selectedProjectId || workersLoading}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Matching...
                  </>
                ) : (
                  "Find Best Worker"
                )}
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && matchedWorker && (
            <Alert>
              <UserCheck className="h-4 w-4" />
              <AlertTitle>Recommended Worker: {matchedWorker.name}</AlertTitle>
              <AlertDescription className="space-y-2">
                <div>
                  <h4 className="font-semibold mt-2">Reasoning:</h4>
                  <p className="text-sm">{result.reasoning}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

    