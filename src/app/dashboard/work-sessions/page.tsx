"use client"
import React, { useState, useEffect, useMemo } from 'react'
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
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Play, Pause, Square, Plus, Minus } from "lucide-react"
import { projects } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import type { Project, ComponentSpec } from "@/lib/types"

export default function WorkSessionsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0].id);
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [logQuantities, setLogQuantities] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId]);
  
  // Use a local state for project data to simulate real-time updates
  const [projectData, setProjectData] = useState<Project | null>(selectedProject);

  useEffect(() => {
    setProjectData(projects.find(p => p.id === selectedProjectId) || null);
    setLogQuantities({});
  }, [selectedProjectId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (sessionActive) {
      interval = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!sessionActive && elapsedTime !== 0) {
      clearInterval(interval!);
    }
    return () => clearInterval(interval!);
  }, [sessionActive, elapsedTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleLogComponent = (componentId: string) => {
    const quantity = logQuantities[componentId] || 0;
    if (quantity <= 0 || !projectData) return;

    const component = projectData.components.find(c => c.id === componentId);
    if (!component) return;

    const newCompleted = Math.min(component.quantityCompleted + quantity, component.quantityRequired);

    setProjectData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        components: prevData.components.map(c => 
          c.id === componentId ? { ...c, quantityCompleted: newCompleted } : c
        )
      };
    });

    toast({
      title: "Work Logged",
      description: `Logged ${quantity} of ${component.name}.`,
    });

    setLogQuantities(prev => ({...prev, [componentId]: 0}));
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

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Select a Project</CardTitle>
            <CardDescription>Choose the project you are currently working on to start a session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedProjectId} defaultValue={selectedProjectId || undefined}>
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
          </CardContent>
        </Card>

        {projectData && (
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
              <div className="grid gap-6">
                <h3 className="font-semibold">Components</h3>
                {projectData.components.map((component: ComponentSpec) => {
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
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(component.id, (logQuantities[component.id] || 0) - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            id={`log-${component.id}`}
                            type="number"
                            value={logQuantities[component.id] || 0}
                            onChange={(e) => handleQuantityChange(component.id, parseInt(e.target.value, 10))}
                            className="w-16 text-center"
                          />
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(component.id, (logQuantities[component.id] || 0) + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button onClick={() => handleLogComponent(component.id)} disabled={!logQuantities[component.id] || logQuantities[component.id] === 0}>
                          Log Work
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
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
              <Button onClick={() => setSessionActive(true)} disabled={!selectedProject}>
                <Play className="mr-2 h-4 w-4" /> Start Session
              </Button>
            ) : (
              <Button onClick={() => setSessionActive(false)} variant="outline">
                <Pause className="mr-2 h-4 w-4" /> Pause Session
              </Button>
            )}
            <Button
              onClick={() => {
                setSessionActive(false);
                setElapsedTime(0);
              }}
              variant="destructive"
              disabled={elapsedTime === 0}
            >
              <Square className="mr-2 h-4 w-4" /> End Session
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
