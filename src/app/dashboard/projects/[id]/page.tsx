"use client"
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from "next/image";
import { ArrowLeft, Calendar, Users, Package, FileText, MessageSquare, Paperclip } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Project, Worker } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectComments } from '@/components/dashboard/project-comments';
import { AddProcessDialog } from '@/components/dashboard/add-process-dialog';

function getProjectProgress(project: Project) {
  if (!project.components || project.components.length === 0) return 0;
  const total = project.components.reduce((sum, c) => sum + (c.quantityRequired || 0), 0);
  if (total === 0) return 0;
  const completed = project.components.reduce((sum, c) => sum + (c.quantityCompleted || 0), 0);
  return (completed / total) * 100;
}

function formatSafeDate(dateValue: string | Date | undefined, formatString: string = 'MMM dd, yyyy'): string {
  if (!dateValue) return 'N/A';
  
  try {
    const date = new Date(dateValue);
    if (isValid(date)) {
      return format(date, formatString);
    }
    return 'N/A';
  } catch (error) {
    console.warn('Invalid date value:', dateValue);
    return 'N/A';
  }
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const projectId = params.id as string;

  useEffect(() => {
    if (!projectId) return;

    const projectUnsubscribe = onSnapshot(doc(db, "projects", projectId), (doc) => {
      if (doc.exists()) {
        setProject({ id: doc.id, ...doc.data() } as Project);
      } else {
        toast({
          variant: "destructive",
          title: "Project Not Found",
          description: "The requested project could not be found.",
        });
        router.push('/dashboard/projects');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching project: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch project details.",
      });
      setLoading(false);
    });

    const workersUnsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(workersData);
    });

    return () => {
      projectUnsubscribe();
      workersUnsubscribe();
    };
  }, [projectId, toast, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Project Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested project could not be found.</p>
        <Button onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const assignedWorkers = workers.filter(w => project.assignedWorkerIds?.includes(w.id));
  const progress = getProjectProgress(project);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      case 'Archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getPriorityColor(project.priority)}>
            {project.priority}
          </Badge>
          <Badge variant="outline" className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Image
                  alt={project.name}
                  className="rounded-lg object-cover"
                  height="200"
                  src={project.imageUrl}
                  width="300"
                />
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Progress</h3>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="flex-1" />
                      <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Quantity</div>
                      <div className="font-medium">{project.quantity.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Deadline</div>
                      <div className="font-medium">{formatSafeDate(project.deadline)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Created</div>
                      <div className="font-medium">{formatSafeDate(project.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Last Updated</div>
                      <div className="font-medium">{formatSafeDate(project.updatedAt)}</div>
                    </div>
                  </div>
                  {project.documentationUrl && (
                    <div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={project.documentationUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View Documentation
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Components */}
          <Card>
            <CardHeader>
              <CardTitle>Components & Progress</CardTitle>
              <CardDescription>Detailed breakdown of project components</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Available Processes</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.components.map((component) => {
                    const componentProgress = component.quantityRequired > 0 
                      ? (component.quantityCompleted / component.quantityRequired) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">{component.name}</TableCell>
                        <TableCell>
                          {component.availableProcesses && component.availableProcesses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {component.availableProcesses.map((process: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {process}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No processes defined</span>
                          )}
                        </TableCell>
                        <TableCell>{component.quantityRequired.toLocaleString()}</TableCell>
                        <TableCell>{component.quantityCompleted.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={componentProgress} className="h-2 w-20" />
                            <span className="text-sm">{componentProgress.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <AddProcessDialog 
                            projectId={project.id}
                            component={component}
                            onProcessAdded={() => {
                              // Refresh project data
                              window.location.reload();
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <ProjectComments project={project} onCommentAdded={() => {}} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Days Remaining</div>
                  <div className="text-2xl font-bold">
                    {Math.max(0, Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Total Parts</div>
                  <div className="text-2xl font-bold">
                    {project.components.reduce((sum, c) => sum + c.quantityCompleted, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    of {project.components.reduce((sum, c) => sum + c.quantityRequired, 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Assigned Workers</div>
                  <div className="text-2xl font-bold">{assignedWorkers.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Workers */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Workers</CardTitle>
              <CardDescription>Team members working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedWorkers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No workers assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedWorkers.map((worker) => (
                    <div key={worker.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={worker.avatarUrl} alt={worker.name} />
                        <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{worker.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {worker.skills.slice(0, 2).join(', ')}
                          {worker.skills.length > 2 && ` +${worker.skills.length - 2} more`}
                        </div>
                      </div>
                      <Badge 
                        variant={worker.status === 'Active' ? 'default' : 'secondary'}
                        className={worker.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {worker.status || 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Process Sequence */}
          {project.processSequence && project.processSequence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Process Sequence</CardTitle>
                <CardDescription>Required order of manufacturing processes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.processSequence.map((process, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm">{process}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {project.attachments && project.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{attachment.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Uploaded by {attachment.uploadedBy}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}