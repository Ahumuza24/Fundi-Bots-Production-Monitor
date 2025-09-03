
"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { collection, onSnapshot, doc, updateDoc, getDoc, setDoc, addDoc } from "firebase/firestore";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Play, Pause, Square, Loader2, AlertCircle, CheckCircle, Clock, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Project, ComponentSpec, Worker, WorkSession } from "@/lib/types"
import { cn } from '@/lib/utils';
import { isBefore, addDays } from 'date-fns';
import { WorkTimeCard } from '@/components/dashboard/work-time-display';

type WorkflowStep = 'project' | 'component' | 'process' | 'session' | 'complete';

interface SessionData {
  projectId: string;
  componentIds: string[];
  process: string;
  startTime: Date;
  notes?: string;
}

export default function WorkSessionsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [customProcess, setCustomProcess] = useState<string>('');
  const [defaultProcesses, setDefaultProcesses] = useState<string[]>([]);
  
  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // End session state
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [completedQuantities, setCompletedQuantities] = useState<Record<string, number>>({});
  const [sessionNotes, setSessionNotes] = useState<string>('');
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to create a default worker profile
  const createDefaultWorker = useCallback((userId: string, projectId?: string | null, timeLogged: number = 0): Worker => {
    return {
      id: userId,
      name: user?.displayName || user?.email || 'Unknown Worker',
      email: user?.email || '',
      skills: [], // Can be updated later by admin
      availability: '40 hours/week',
      pastPerformance: 0.85, // Default performance rating
      timeLoggedSeconds: timeLogged,
      activeProjectId: projectId ?? null
    };
  }, [user]);

  // Get selected project
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  // Get selected components
  const selectedComponents = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.components.filter(c => selectedComponentIds.includes(c.id));
  }, [selectedProject, selectedComponentIds]);

  // Clean and merge defaults + component processes for selector
  const cleanedDefaults = useMemo(() => {
    return Array.from(
      new Set(
        (defaultProcesses || [])
          .map(p => (typeof p === 'string' ? p.trim() : ''))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [defaultProcesses]);

  const availableProcesses = useMemo(() => {
    const componentProcesses = selectedComponents.length === 0
      ? []
      : selectedComponents
          .flatMap(c => c.availableProcesses || [])
          .map(p => (typeof p === 'string' ? p.trim() : ''))
          .filter(Boolean);
    const merged = new Set<string>([...cleanedDefaults, ...componentProcesses]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
  }, [selectedComponents, cleanedDefaults]);

  useEffect(() => {
    if (!user?.uid) return;
    
    setLoading(true);
    
    const projectsUnsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
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

    // Listen to current worker data
    const workerUnsubscribe = onSnapshot(doc(db, "workers", user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentWorker({ id: snapshot.id, ...snapshot.data() } as Worker);
      }
    }, (error) => {
      console.error("Error fetching worker data: ", error);
    });

    // Listen to default processes configured by project lead
    const processesUnsubscribe = onSnapshot(doc(db, 'settings', 'processes'), (snapshot) => {
      const data = snapshot.data() as { defaultProcesses?: string[] } | undefined;
      const list = Array.isArray(data?.defaultProcesses) ? data!.defaultProcesses : [];
      setDefaultProcesses(list);
    }, (error) => {
      console.error('Error fetching default processes: ', error);
    });

    return () => {
      projectsUnsubscribe();
      workerUnsubscribe();
      processesUnsubscribe();
    };
  }, [toast, user]);

  // Update or create worker doc with active project
  const updateWorkerActiveProject = useCallback(async (projectId?: string | null) => {
    if (!user?.uid) return;
    const workerRef = doc(db, 'workers', user.uid);
    try {
      const workerDoc = await getDoc(workerRef);
      if (!workerDoc.exists()) {
        const newWorker = createDefaultWorker(user.uid, projectId ?? null);
        await setDoc(workerRef, newWorker);
        toast({
          title: 'Worker Profile Created',
          description: 'Your worker profile has been created automatically.',
        });
      } else {
        await updateDoc(workerRef, {
          activeProjectId: projectId ?? null,
        });
      }
    } catch (error) {
      console.error('Error updating worker active project: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update your active project. Please try again.',
      });
    }
  }, [user, toast, createDefaultWorker]);

  // Timer effect
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

  // Workflow navigation functions
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    updateWorkerActiveProject(projectId);
    setCurrentStep('component');
  };

  const handleComponentSelect = (componentId: string, checked: boolean) => {
    if (checked) {
      setSelectedComponentIds(prev => [...prev, componentId]);
    } else {
      setSelectedComponentIds(prev => prev.filter(id => id !== componentId));
    }
  };

  const handleProcessSelect = () => {
    const finalProcess = selectedProcess === 'custom' ? customProcess : selectedProcess;
    if (!finalProcess.trim()) {
      toast({
        variant: "destructive",
        title: "Process Required",
        description: "Please select or enter a process.",
      });
      return;
    }
    setCurrentStep('session');
  };

  const resetWorkflow = () => {
    setCurrentStep('project');
    setSelectedProjectId(null);
    setSelectedComponentIds([]);
    setSelectedProcess('');
    setCustomProcess('');
    setSessionData(null);
    setElapsedTime(0);
    setSessionActive(false);
    setCompletedQuantities({});
    setSessionNotes('');
  };
  
  const startSession = () => {
    const finalProcess = selectedProcess === 'custom' ? customProcess : selectedProcess;
    const newSessionData: SessionData = {
      projectId: selectedProjectId!,
      componentIds: selectedComponentIds,
      process: finalProcess,
      startTime: new Date(),
    };
    
    setSessionData(newSessionData);
    setSessionActive(true);
    setElapsedTime(0);
    
    toast({
      title: "Session Started",
      description: `Working on ${selectedComponents.length} component(s) - ${finalProcess}`,
    });
  };

  const pauseSession = () => {
    setSessionActive(false);
    toast({
      title: "Session Paused",
      description: "You can resume or end your session.",
    });
  };

  const resumeSession = () => {
    setSessionActive(true);
    toast({
      title: "Session Resumed",
      description: "Timer is now running.",
    });
  };

  const handleEndSession = () => {
    setSessionActive(false);
    // Initialize completed quantities to 0 for all selected components
    const initialQuantities: Record<string, number> = {};
    selectedComponentIds.forEach(id => {
      initialQuantities[id] = 0;
    });
    setCompletedQuantities(initialQuantities);
    setShowEndDialog(true);
  };


  const completeSession = async () => {
    if (!user || !sessionData) return;

    try {
      const finalProcess = selectedProcess === 'custom' ? customProcess : selectedProcess;
      
      // Create work session record
      const workSession: Omit<WorkSession, 'id'> = {
        workerId: user.uid,
        projectId: sessionData.projectId,
        startTime: sessionData.startTime,
        endTime: new Date(),
        completedComponents: selectedComponentIds.map(id => ({
          componentId: id,
          quantity: completedQuantities[id] || 0
        })),
        process: finalProcess,
        notes: sessionNotes,
      };

      // Save work session
      await addDoc(collection(db, 'workSessions'), workSession);

      // Update worker's total time
      const workerRef = doc(db, 'workers', user.uid);
      const workerDoc = await getDoc(workerRef);
      
      if (!workerDoc.exists()) {
        const newWorker = createDefaultWorker(user.uid, selectedProjectId, elapsedTime);
        await setDoc(workerRef, newWorker);
      } else {
        const workerData = workerDoc.data() as Worker;
        const newTimeLogged = (workerData.timeLoggedSeconds || 0) + elapsedTime;
        await updateDoc(workerRef, { 
          timeLoggedSeconds: newTimeLogged,
        });
      }

      // Update project component quantities
      if (selectedProject) {
        const projectRef = doc(db, 'projects', selectedProject.id);
        const updatedComponents = selectedProject.components.map(component => {
          const completedQty = completedQuantities[component.id] || 0;
          if (completedQty > 0) {
            return {
              ...component,
              quantityCompleted: Math.min(
                component.quantityCompleted + completedQty,
                component.quantityRequired
              )
            };
          }
          return component;
        });

        await updateDoc(projectRef, { components: updatedComponents });
      }

      toast({
        title: "Session Completed",
        description: `Work session saved successfully. Time: ${formatTime(elapsedTime)}`,
      });

      // Reset everything
      setShowEndDialog(false);
      resetWorkflow();

    } catch (error) {
      console.error("Error completing session: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save session data. Please try again.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const isProjectUrgent = (project: Project) => {
    const sevenDaysFromNow = addDays(new Date(), 7);
    return isBefore(new Date(project.deadline), sevenDaysFromNow);
  };


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
        
        {/* Step 1: Project Selection */}
        {currentStep === 'project' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select a Project</CardTitle>
              <CardDescription>Choose the project you want to work on.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleProjectSelect(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {isProjectUrgent(project) && <AlertCircle className="h-4 w-4 text-destructive" />}
                          <h3 className="font-medium">{project.name}</h3>
                          {isProjectUrgent(project) && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(project.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{project.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Component Selection */}
        {currentStep === 'component' && selectedProject && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Select Components</CardTitle>
              <CardDescription>Choose which components you'll be working on for {selectedProject.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedProject.components.map((component) => {
                  const progress = (component.quantityCompleted / component.quantityRequired) * 100;
                  const isSelected = selectedComponentIds.includes(component.id);
                  
                  return (
                    <div key={component.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={component.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleComponentSelect(component.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <Label htmlFor={component.id} className="font-medium">{component.name}</Label>
                          <span className="text-sm text-muted-foreground">
                            {component.quantityCompleted} / {component.quantityRequired}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex gap-1 mt-2">
                          {component.availableProcesses?.map((process) => (
                            <Badge key={process} variant="secondary" className="text-xs">
                              {process}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('project')}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep('process')} 
                disabled={selectedComponentIds.length === 0}
              >
                Next: Select Process
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Process Selection */}
        {currentStep === 'process' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Select Process</CardTitle>
              <CardDescription>What process will you be performing on the selected components?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Available Processes</Label>
                  <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a process" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProcesses.map((process) => (
                        <SelectItem key={process} value={process}>
                          {process}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Process...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedProcess === 'custom' && (
                  <div>
                    <Label htmlFor="custom-process" className="text-sm font-medium">Custom Process</Label>
                    <Input
                      id="custom-process"
                      placeholder="Enter custom process (e.g., CNC Machining, Painting, etc.)"
                      value={customProcess}
                      onChange={(e) => setCustomProcess(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Selected Components:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedComponents.map((component) => (
                      <Badge key={component.id} variant="outline">
                        {component.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('component')}>
                Back
              </Button>
              <Button onClick={handleProcessSelect}>
                Start Work Session
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Active Session */}
        {currentStep === 'session' && (
          <Card>
            <CardHeader>
              <CardTitle>Active Work Session</CardTitle>
              <CardDescription>
                Working on {selectedComponents.length} component(s) - {selectedProcess === 'custom' ? customProcess : selectedProcess}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">Project: {selectedProject?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Process: {selectedProcess === 'custom' ? customProcess : selectedProcess}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Components: {selectedComponents.map(c => c.name).join(', ')}</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-mono font-bold p-6 bg-muted rounded-lg">
                    {formatTime(elapsedTime)}
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  {!sessionActive ? (
                    <>
                      <Button onClick={startSession}>
                        <Play className="mr-2 h-4 w-4" /> Start Session
                      </Button>
                      <Button variant="outline" onClick={resetWorkflow}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={pauseSession} variant="outline">
                        <Pause className="mr-2 h-4 w-4" /> Pause
                      </Button>
                      <Button onClick={handleEndSession} variant="destructive">
                        <Square className="mr-2 h-4 w-4" /> End Session
                      </Button>
                    </>
                  )}
                </div>

                {!sessionActive && elapsedTime > 0 && (
                  <div className="text-center">
                    <Button onClick={resumeSession}>
                      <Play className="mr-2 h-4 w-4" /> Resume Session
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <WorkTimeCard 
          timeLoggedSeconds={currentWorker?.timeLoggedSeconds || 0} 
          title="Total Work Time"
        />
        
        {currentStep !== 'project' && (
          <Card>
            <CardHeader>
              <CardTitle>Session Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">
                    Project Selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={cn("h-4 w-4", ['process', 'session'].includes(currentStep) ? "text-green-500" : "text-muted-foreground")} />
                  <span className={cn("text-sm", ['process', 'session'].includes(currentStep) ? "text-green-700" : "text-muted-foreground")}>
                    Components Selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className={cn("h-4 w-4", currentStep === 'session' ? "text-green-500" : "text-muted-foreground")} />
                  <span className={cn("text-sm", currentStep === 'session' ? "text-green-700" : "text-muted-foreground")}>
                    Process Defined
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Work Session</DialogTitle>
            <DialogDescription>
              Enter the quantity of components you completed during this session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedComponents.map((component) => (
              <div key={component.id} className="space-y-2">
                <Label htmlFor={`qty-${component.id}`}>{component.name}</Label>
                <Input
                  id={`qty-${component.id}`}
                  type="number"
                  min="0"
                  max={component.quantityRequired - component.quantityCompleted}
                  value={completedQuantities[component.id] || 0}
                  onChange={(e) => setCompletedQuantities(prev => ({
                    ...prev,
                    [component.id]: parseInt(e.target.value) || 0
                  }))}
                  placeholder="Quantity completed"
                />
                <p className="text-xs text-muted-foreground">
                  Remaining: {component.quantityRequired - component.quantityCompleted}
                </p>
              </div>
            ))}
            
            <div className="space-y-2">
              <Label htmlFor="session-notes">Session Notes (Optional)</Label>
              <Textarea
                id="session-notes"
                placeholder="Add any notes about this work session..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Cancel
            </Button>
            <Button onClick={completeSession}>
              Complete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
