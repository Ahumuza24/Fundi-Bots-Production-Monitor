
"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, onSnapshot, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Play, Pause, Square, Plus, Minus, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Project, ComponentSpec, Worker } from "@/lib/types"
import { cn } from '@/lib/utils';
import { isBefore, addDays } from 'date-fns';

export default function WorkSessionsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [logQuantities, setLogQuantities] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to create a default worker profile
  const createDefaultWorker = useCallback((userId: string, status: 'Active' | 'Inactive', projectId?: string | null, timeLogged: number = 0): Worker => {
    return {
      id: userId,
      name: user?.displayName || user?.email || 'Unknown Worker',
      email: user?.email || '',
      skills: [], // Can be updated later by admin
      availability: '40 hours/week',
      pastPerformance: 0.85, // Default performance rating
      timeLoggedSeconds: timeLogged,
      status: status,
      activeProjectId: projectId ?? null
    };
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      if (projectsData.length > 0 && !selectedProjectId) {
        // Find a project assigned to the current user if possible
        const assignedProject = projectsData.find(p => user && p.assignedWorkerIds?.includes(user.uid));
        setSelectedProjectId(assignedProject ? assignedProject.id : projectsData[0].id);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch projects.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast, selectedProjectId, user]);

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  const [projectData, setProjectData] = useState<Project | null>(selectedProject);

  useEffect(() => {
    const currentProject = projects.find(p => p.id === selectedProjectId) || null;
    setProjectData(currentProject);
    setLogQuantities({});
  }, [selectedProjectId, projects]);

  const updateWorkerStatus = useCallback(async (status: 'Active' | 'Inactive', projectId?: string | null) => {
      if (user?.uid && user.role === 'assembler') {
          const workerRef = doc(db, 'workers', user.uid);
          try {
              // First check if the worker document exists
              const workerDoc = await getDoc(workerRef);
              
              if (!workerDoc.exists()) {
                  // Create the worker document if it doesn't exist
                  const newWorker = createDefaultWorker(user.uid, status, projectId);
                  await setDoc(workerRef, newWorker);
                  
                  toast({
                      title: "Worker Profile Created",
                      description: "Your worker profile has been created automatically.",
                  });
              } else {
                  // Update existing worker document
                  await updateDoc(workerRef, { 
                      status: status,
                      activeProjectId: projectId ?? null
                  });
              }
          } catch (error) {
              console.error("Error updating worker status: ", error);
              toast({ 
                  variant: 'destructive', 
                  title: "Error", 
                  description: "Could not update your status. Please try again."
              });
          }
      }
  }, [user, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (sessionActive) {
      interval = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!sessionActive && elapsedTime !== 0) {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive, elapsedTime]);
  
  const startSession = () => {
    setSessionActive(true);
    updateWorkerStatus('Active', selectedProjectId);
  }

  const pauseSession = () => {
    setSessionActive(false);
    updateWorkerStatus('Inactive', null);
  }

  const endSession = async () => {
      if(!user || !projectData) return;
      
      const workerRef = doc(db, 'workers', user.uid);
      
      try {
        // Fetch the latest worker data to get the current time logged
        const workerDoc = await getDoc(workerRef);
        
        if (!workerDoc.exists()) {
            // Create worker document if it doesn't exist
            const newWorker = createDefaultWorker(user.uid, 'Inactive', null, elapsedTime);
            await setDoc(workerRef, newWorker);
        } else {
            const workerData = workerDoc.data() as Worker;
            const newTimeLogged = (workerData.timeLoggedSeconds || 0) + elapsedTime;

            await updateDoc(workerRef, { 
                timeLoggedSeconds: newTimeLogged,
                status: 'Inactive',
                activeProjectId: null
            });
        }

        setSessionActive(false);
        setElapsedTime(0);
        
        toast({ 
            title: "Session Ended", 
            description: `Total time: ${formatTime(elapsedTime)}` 
        });
      } catch (error) {
          console.error("Error ending session: ", error);
          toast({ 
              variant: 'destructive', 
              title: "Error", 
              description: "Could not save session data. Please try again."
          });
      }
  };


  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleLogComponent = async (componentId: string) => {
    const quantity = logQuantities[componentId] || 0;
    if (quantity <= 0 || !projectData) return;

    const component = projectData.components.find(c => c.id === componentId);
    if (!component) return;

    const newCompleted = Math.min(component.quantityCompleted + quantity, component.quantityRequired);
    
    const projectRef = doc(db, 'projects', projectData.id);
    const updatedComponents = projectData.components.map(c => 
        c.id === componentId ? { ...c, quantityCompleted: newCompleted } : c
    );

    try {
        await updateDoc(projectRef, { components: updatedComponents });
        toast({
            title: "Work Logged",
            description: `Logged ${quantity} of ${component.name}.`,
        });
        setLogQuantities(prev => ({...prev, [componentId]: 0}));
    } catch (error) {
        console.error("Error logging work: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not log work. Please try again.",
        });
    }
  };

  const handleQuantityChange = (componentId: string, value: number) => {
    const component = projectData?.components.find(c => c.id === componentId);
    if (!component) return;
    const maxQuantity = component.quantityRequired - component.quantityCompleted;
    setLogQuantities(prev => ({...prev, [componentId]: Math.max(0, Math.min(value, maxQuantity)) }));
  }

  const projectProgress = useMemo(() => {
    if (!projectData) return 0;
    const total = projectData.components.reduce((sum, c) => sum + c.quantityRequired, 0);
    if (total === 0) return 0;
    const completed = projectData.components.reduce((sum, c) => sum + c.quantityCompleted, 0);
    return (completed / total) * 100;
  }, [projectData]);

  const isProjectUrgent = (project: Project) => {
    const sevenDaysFromNow = addDays(new Date(), 7);
    return isBefore(new Date(project.deadline), sevenDaysFromNow);
  }

  const componentsByProcess = useMemo(() => {
    if (!projectData) return {};
    return projectData.components.reduce((acc, component) => {
        const process = component.process || 'Uncategorized';
        if (!acc[process]) {
            acc[process] = [];
        }
        acc[process].push(component);
        return acc;
    }, {} as Record<string, ComponentSpec[]>);
  }, [projectData]);


  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Select a Project</CardTitle>
            <CardDescription>Choose the project you are currently working on to start a session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedProjectId} value={selectedProjectId || ''} disabled={sessionActive}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      {isProjectUrgent(project) && <AlertCircle className="h-4 w-4 text-destructive" />}
                      <span>{project.name}</span>
                      {isProjectUrgent(project) && <span className="text-xs text-destructive">(Urgent)</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {projectData ? (
          <Card>
            <CardHeader>
              <CardTitle>{projectData.name}</CardTitle>
              <CardDescription>{projectData.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>Overall Project Progress</Label>
                <div className="flex items-center gap-2">
                  <Progress value={projectProgress} className="h-4" />
                  <span>{projectProgress.toFixed(0)}%</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className={cn(!sessionActive && "opacity-50 pointer-events-none")}>
                <Accordion type="single" collapsible className="w-full" defaultValue={Object.keys(componentsByProcess)[0]}>
                    {Object.entries(componentsByProcess).map(([processName, components]) => (
                        <AccordionItem value={processName} key={processName}>
                            <AccordionTrigger className="text-base font-semibold">{processName}</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid gap-6">
                                    {components.map((component: ComponentSpec) => {
                                    const componentProgress = (component.quantityCompleted / component.quantityRequired) * 100;
                                    return (
                                        <div key={component.id} className="grid gap-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                            <Label htmlFor={`log-${component.id}`}>{component.name}</Label>
                                            <span className="text-sm text-muted-foreground">{component.quantityCompleted} / {component.quantityRequired}</span>
                                            </div>
                                            <Progress value={componentProgress} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(component.id, (logQuantities[component.id] || 0) - 1)} disabled={!sessionActive}>
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input
                                                id={`log-${component.id}`}
                                                type="number"
                                                value={logQuantities[component.id] || 0}
                                                onChange={(e) => handleQuantityChange(component.id, parseInt(e.target.value, 10))}
                                                className="w-16 text-center"
                                                disabled={!sessionActive}
                                            />
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(component.id, (logQuantities[component.id] || 0) + 1)} disabled={!sessionActive}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                            </div>
                                            <Button onClick={() => handleLogComponent(component.id)} disabled={!sessionActive || !logQuantities[component.id] || logQuantities[component.id] === 0}>
                                            Log Work
                                            </Button>
                                        </div>
                                        </div>
                                    )
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <p className="py-4 text-muted-foreground">Select a project to begin, or ask your Project Lead to create one.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Session Timer</CardTitle>
            <CardDescription>Track your work time for the selected project.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-center p-6 bg-muted rounded-lg">
              {formatTime(elapsedTime)}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-2">
            {!sessionActive ? (
              <Button onClick={startSession} disabled={!selectedProject}>
                <Play className="mr-2 h-4 w-4" /> Start Session
              </Button>
            ) : (
              <Button onClick={pauseSession} variant="outline">
                <Pause className="mr-2 h-4 w-4" /> Pause Session
              </Button>
            )}
            <Button
              onClick={endSession}
              variant="destructive"
              disabled={elapsedTime === 0 && !sessionActive}
            >
              <Square className="mr-2 h-4 w-4" /> End Session
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
