
"use client"
import React, { useEffect, useState, useCallback } from 'react';
import Image from "next/image"
import { MoreHorizontal } from "lucide-react"
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { ProjectTemplatesDialog } from "@/components/dashboard/project-templates-dialog";
import { CSVImportDialog } from "@/components/dashboard/csv-import-dialog";
import { EditProjectDialog } from "@/components/dashboard/edit-project-dialog";
import { CloneProjectDialog } from "@/components/dashboard/clone-project-dialog";
import { format } from "date-fns"
import { Skeleton } from '@/components/ui/skeleton';
import Link from "next/link";
import { useAuth } from '@/hooks/use-auth';

function getProjectProgress(project: Project) {
  if (!project.components || project.components.length === 0) return 0;
  const total = project.components.reduce((sum, c) => sum + (c.quantityRequired || 0), 0);
  if (total === 0) return 0;
  const completed = project.components.reduce((sum, c) => sum + (c.quantityCompleted || 0), 0);
  return (completed / total) * 100;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  
  const isAssembler = user?.role === 'assembler';

  const fetchProjects = useCallback(() => {
    setLoading(true);
    const projectsCollection = collection(db, "projects");
    const unsubscribe = onSnapshot(projectsCollection, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch projects from Firestore.",
      });
      setLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchProjects();
    return () => unsubscribe();
  }, [fetchProjects]);

  const handleStatusChange = async (projectId: string, status: Project['status']) => {
    const projectRef = doc(db, 'projects', projectId);
    try {
      await updateDoc(projectRef, { status });
      toast({
        title: "Status Updated",
        description: `Project status changed to ${status}.`,
      });
    } catch (error) {
      console.error("Error updating status: ", error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Could not update project status.",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const projectRef = doc(db, 'projects', projectId);
    try {
      await deleteDoc(projectRef);
      toast({
        title: "Project Deleted",
        description: "The project has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting project: ", error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Could not delete project.",
      });
    }
  };
  
  const filteredProjects = projects.filter(project => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in-progress') return project.status === 'In Progress';
    if (activeTab === 'completed') return project.status === 'Completed';
    if (activeTab === 'on-hold') return project.status === 'On Hold';
    if (activeTab === 'not-started') return project.status === 'Not Started';
    if (activeTab === 'archived') return project.status === 'Archived';
    return false;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <Tabs defaultValue="all" onValueChange={setActiveTab} value={activeTab}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="not-started">Not Started</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="on-hold" className="hidden sm:flex">
            On Hold
          </TabsTrigger>
          <TabsTrigger value="archived" className="hidden lg:flex">
            Archived
          </TabsTrigger>
        </TabsList>
        {!isAssembler && (
          <div className="ml-auto flex items-center gap-2">
            <CSVImportDialog onProjectsImported={() => {}} />
            <ProjectTemplatesDialog onTemplateSelected={(template) => {
              toast({
                title: "Template Selected",
                description: `Template "${template.name}" is ready to use.`,
              });
            }} />
            <CreateProjectDialog onProjectCreated={() => {}} />
          </div>
        )}
      </div>
      <TabsContent value={activeTab}>
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              {isAssembler 
                ? "View available projects and their progress. Click on a project name to see details."
                : "Manage your projects and view their progress. Updates are shown in real-time."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Due Date
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">{isAssembler ? 'View' : 'Actions'}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="aspect-square rounded-md h-[64px] w-[64px]" />
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="hidden sm:table-cell">
                        <Image
                          alt={project.name}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={project.imageUrl}
                          width="64"
                          data-ai-hint="circuit board"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={project.status === "Completed" ? "default" : "outline"} className={
                          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          project.status === 'Not Started' ? 'bg-gray-100 text-gray-800' : ''
                        }>{project.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          project.priority === 'Critical' ? 'bg-red-100 text-red-800 border-red-200' :
                          project.priority === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          project.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }>{project.priority || 'Medium'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={getProjectProgress(project)} aria-label={`${getProjectProgress(project).toFixed(0)}% complete`} />
                          <span className="text-muted-foreground text-xs">{getProjectProgress(project).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                         {format(new Date(project.deadline), "PPP")}
                      </TableCell>
                      <TableCell>
                        {!isAssembler ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <EditProjectDialog 
                                project={project} 
                                onProjectUpdated={() => {}}
                              >
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Edit Project
                                </DropdownMenuItem>
                              </EditProjectDialog>
                              <CloneProjectDialog 
                                project={project} 
                                onProjectCloned={() => {}}
                              >
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  Clone Project
                                </DropdownMenuItem>
                              </CloneProjectDialog>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onSelect={() => handleStatusChange(project.id, 'Not Started')}>Not Started</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleStatusChange(project.id, 'In Progress')}>In Progress</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleStatusChange(project.id, 'On Hold')}>On Hold</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleStatusChange(project.id, 'Completed')}>Completed</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleStatusChange(project.id, 'Archived')}>Archive</DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                               <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the project "{project.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive hover:bg-destructive/90"
                                      onClick={() => handleDeleteProject(project.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/projects/${project.id}`}>
                              View Details
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{filteredProjects.length}</strong> of <strong>{projects.length}</strong>{" "}
              projects
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
