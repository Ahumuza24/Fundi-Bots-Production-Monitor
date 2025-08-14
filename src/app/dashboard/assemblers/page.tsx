
"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Worker, Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

function getProjectProgress(project: Project) {
  if (!project.components || project.components.length === 0) return 0;
  const total = project.components.reduce((sum, c) => sum + (c.quantityRequired || 0), 0);
  if (total === 0) return 0;
  const completed = project.components.reduce((sum, c) => sum + (c.quantityCompleted || 0), 0);
  return (completed / total);
}

function formatTime(seconds: number = 0) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
};

export default function AssemblersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(() => {
    setLoading(true);
    
    const workersUnsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(workersData);
    }, (error) => {
      console.error("Error fetching workers: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch worker data.",
      });
    });

    const projectsUnsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
    }, (error) => {
      console.error("Error fetching projects: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch project data.",
      });
    });
    
    // This is a bit of a hack to wait for both snapshots to load initially
    Promise.all([
      new Promise(resolve => onSnapshot(collection(db, "workers"), () => resolve(true))),
      new Promise(resolve => onSnapshot(collection(db, "projects"), () => resolve(true)))
    ]).then(() => setLoading(false));

    return () => {
      workersUnsubscribe();
      projectsUnsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, [fetchData]);

  // This logic is a placeholder. In a real app, assignments would be stored in the database.
  const getAssignedProject = (workerId: string): Project | undefined => {
      return projects.find(p => p.assignedWorkerIds?.includes(workerId));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assemblers</CardTitle>
        <CardDescription>
          An overview of all assemblers, their assigned projects, and progress.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assembler</TableHead>
              <TableHead>Active Project</TableHead>
              <TableHead className="hidden md:table-cell">Progress</TableHead>
              <TableHead className="hidden sm:table-cell">Time Logged</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : (
              workers.map((worker) => {
                const assignedProject = getAssignedProject(worker.id);
                const progress = assignedProject ? getProjectProgress(assignedProject) * 100 : 0;
                
                return (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={worker.avatarUrl} alt={worker.name} />
                          <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{worker.name}</div>
                          <div className="text-sm text-muted-foreground">{worker.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignedProject ? assignedProject.name : <span className="text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                       {assignedProject ? (
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatTime(worker.timeLoggedSeconds)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
