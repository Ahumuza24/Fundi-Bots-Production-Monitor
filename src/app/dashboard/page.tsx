
"use client"
import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Activity, ArrowUpRight, CheckCircle, Package, Users, Hourglass, GanttChartSquare, Database, Play } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import Link from "next/link"
import { collection, getDocs, writeBatch, doc, onSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { projects as mockProjects, workers as mockWorkers } from '@/lib/mock-data';
import type { Project, Worker } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { PageLoader, CardLoader } from '@/components/ui/loading-spinner';
import { Loader2 } from 'lucide-react';
import { WorkTimeCard } from '@/components/dashboard/work-time-display';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    let projectsLoaded = false;
    let workersLoaded = false;
    
    const checkLoadingComplete = () => {
      if (projectsLoaded && workersLoaded) {
        setLoading(false);
      }
    };
    
    const projectsUnsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      projectsLoaded = true;
      checkLoadingComplete();
    }, (error) => {
      console.error("Error fetching projects: ", error);
      projectsLoaded = true;
      checkLoadingComplete();
    });

    const workersUnsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(workersData);
      workersLoaded = true;
      checkLoadingComplete();
    }, (error) => {
      console.error("Error fetching workers: ", error);
      workersLoaded = true;
      checkLoadingComplete();
    });

    return () => {
      projectsUnsubscribe();
      workersUnsubscribe();
    }
  }, [user]);
  
  const handleSeedData = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);

      // Clear existing data (optional, but good for a clean seed)
      const existingProjects = await getDocs(collection(db, "projects"));
      existingProjects.forEach(doc => batch.delete(doc.ref));
      const existingWorkers = await getDocs(collection(db, "workers"));
      existingWorkers.forEach(doc => batch.delete(doc.ref));

      mockProjects.forEach(project => {
        const projectRef = doc(collection(db, "projects"));
        batch.set(projectRef, { ...project, id: projectRef.id });
      });
      
      mockWorkers.forEach(worker => {
        const workerRef = doc(collection(db, "workers"));
        batch.set(workerRef, { ...worker, id: workerRef.id });
      });
      
      await batch.commit();
      
      toast({
        title: "Success",
        description: "Sample data has been seeded to Firestore.",
      });
      // Data will refresh via onSnapshot listeners
      
    } catch (error) {
      console.error("Error seeding data: ", error);
      toast({
        variant: "destructive",
        title: "Error Seeding Data",
        description: "Could not write mock data to Firestore.",
      });
    } finally {
        setLoading(false);
    }
  };


  // Memoize expensive calculations
  const chartData = useMemo(() => 
    projects.map(p => ({
      name: p.name.split(' ')[0],
      total: p.components.reduce((acc, c) => acc + c.quantityRequired, 0),
      completed: p.components.reduce((acc, c) => acc + c.quantityCompleted, 0),
    })), [projects]
  );

  const dashboardStats = useMemo(() => {
    const projectsInProgress = projects.filter(p => p.status === 'In Progress').length;
    const totalUnitsCompleted = projects.flatMap(p => p.components).reduce((sum, c) => sum + c.quantityCompleted, 0);
    const totalUnits = projects.flatMap(p => p.components).reduce((sum, c) => sum + c.quantityRequired, 0);
    const teamProductivity = totalUnits > 0 ? ((totalUnitsCompleted / totalUnits) * 100).toFixed(0) : 0;
    
    return {
      projectsInProgress,
      totalUnitsCompleted,
      totalUnits,
      teamProductivity
    };
  }, [projects]);
  
  const recentAssemblers = useMemo(() => {
    // Show workers who have logged time, sorted by most time logged, limited to 4
    return workers
      .filter(worker => worker.timeLoggedSeconds > 0)
      .sort((a, b) => b.timeLoggedSeconds - a.timeLoggedSeconds)
      .slice(0, 4);
  }, [workers]);
  
  // Assembler-specific data
  const currentWorker = useMemo(() => {
    if (user?.role === 'assembler' && user.uid) {
      return workers.find(w => w.id === user.uid);
    }
    return null;
  }, [user, workers]);
  
  const activeProject = useMemo(() => {
    if (currentWorker?.activeProjectId) {
      return projects.find(p => p.id === currentWorker.activeProjectId);
    }
    return null;
  }, [currentWorker, projects]);

  if (loading && projects.length === 0 && workers.length === 0) {
    return <PageLoader />;
  }

  // Show assembler-specific dashboard
  if (user?.role === 'assembler') {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <WorkTimeCard 
            timeLoggedSeconds={currentWorker?.timeLoggedSeconds || 0} 
            title="Your Total Work Time"
          />
          <Card className="card-hover-gradient border-l-4 border-l-fundibots-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Project</CardTitle>
              <div className="p-2 bg-fundibots-green/10 rounded-lg">
                <Package className="h-4 w-4 text-fundibots-green" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-fundibots-green">
                {activeProject ? activeProject.name : 'No Active Project'}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeProject ? `Due: ${new Date(activeProject.deadline).toLocaleDateString()}` : 'Select a project to start working'}
              </p>
            </CardContent>
          </Card>
          <Card className="card-hover-gradient border-l-4 border-l-fundibots-cyan">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
              <div className="p-2 bg-fundibots-cyan/10 rounded-lg">
                <Activity className="h-4 w-4 text-fundibots-cyan" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fundibots-cyan">
                {activeProject ? (() => {
                  const total = activeProject.components.reduce((sum, c) => sum + c.quantityRequired, 0);
                  const completed = activeProject.components.reduce((sum, c) => sum + c.quantityCompleted, 0);
                  return total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%';
                })() : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeProject ? 'Current project completion' : 'No active project'}
              </p>
            </CardContent>
          </Card>
          <Card className="card-hover-gradient border-l-4 border-l-fundibots-yellow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Projects</CardTitle>
              <div className="p-2 bg-fundibots-yellow/10 rounded-lg">
                <GanttChartSquare className="h-4 w-4 text-fundibots-yellow" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fundibots-yellow">
                {projects.filter(p => p.status !== 'Completed' && p.status !== 'Archived').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Projects available to work on
              </p>
            </CardContent>
          </Card>
        </div>
        
        {activeProject && (
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Your Active Project: {activeProject.name}</CardTitle>
                <CardDescription>
                  {activeProject.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeProject.components.map((component) => {
                    const progress = (component.quantityCompleted / component.quantityRequired) * 100;
                    return (
                      <div key={component.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{component.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {component.quantityCompleted} / {component.quantityRequired}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-fundibots-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex gap-2">
                  <Button asChild>
                    <Link href="/dashboard/work-sessions">
                      Start Working
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/work-sessions">
                    <Play className="mr-2 h-4 w-4" />
                    Start Work Session
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/projects">
                    <Package className="mr-2 h-4 w-4" />
                    View All Projects
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/announcements">
                    <Activity className="mr-2 h-4 w-4" />
                    View Announcements
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {!activeProject && (
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                You don't have an active project yet. Choose a project to start working on.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/work-sessions">
                  <Package className="mr-2 h-4 w-4" />
                  Select a Project
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  // Admin/Project Lead dashboard
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="card-hover-gradient border-l-4 border-l-fundibots-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projects In Progress
            </CardTitle>
            <div className="p-2 bg-fundibots-primary/10 rounded-lg">
              <GanttChartSquare className="h-4 w-4 text-fundibots-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fundibots-primary">{dashboardStats.projectsInProgress}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover-gradient border-l-4 border-l-fundibots-green">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Units
            </CardTitle>
            <div className="p-2 bg-fundibots-green/10 rounded-lg">
              <CheckCircle className="h-4 w-4 text-fundibots-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fundibots-green">{dashboardStats.totalUnitsCompleted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              out of {dashboardStats.totalUnits.toLocaleString()} total units
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover-gradient border-l-4 border-l-fundibots-cyan">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <div className="p-2 bg-fundibots-cyan/10 rounded-lg">
              <Users className="h-4 w-4 text-fundibots-cyan" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fundibots-cyan">{dashboardStats.teamProductivity}%</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        <Card className="card-hover-gradient border-l-4 border-l-fundibots-yellow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Deadlines</CardTitle>
            <div className="p-2 bg-fundibots-yellow/10 rounded-lg">
              <Hourglass className="h-4 w-4 text-fundibots-yellow" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fundibots-yellow">
              {projects.filter(p => new Date(p.deadline).getTime() < new Date().getTime() + 7 * 24 * 60 * 60 * 1000).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Projects due within 7 days
            </p>
          </CardContent>
        </Card>
      </div>
       {user?.role === 'admin' && projects.length === 0 && workers.length === 0 && (
          <Card>
              <CardHeader>
                  <CardTitle>Welcome to FundiFlow!</CardTitle>
                  <CardDescription>
                      It looks like there's no data in your database. You can seed the application with some sample data to get started.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Button onClick={handleSeedData} disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                      Seed Sample Data
                  </Button>
              </CardContent>
          </Card>
        )}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Project Completion Progress</CardTitle>
            <CardDescription>
              An overview of units completed vs. total units required for each project.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{fill: 'hsl(var(--muted))'}}
                  contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}}
                />
                <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="hsl(var(--primary))" fillOpacity={0.2} name="Total" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Assembler Activity</CardTitle>
              <CardDescription>
                Updates on the latest work sessions.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/assemblers">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
             {recentAssemblers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assembler</TableHead>
                  <TableHead>Time Logged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAssemblers.map((worker) => (
                    <TableRow key={worker.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-fundibots-primary/20">
                            <AvatarFallback className="bg-gradient-to-br from-fundibots-primary to-fundibots-secondary text-white font-semibold text-xs">
                              {(() => {
                                const names = worker.name.trim().split(' ').filter(n => n.length > 0);
                                if (names.length === 0) return "W";
                                if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
                                return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                              })()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-gray-900">{worker.name}</div>
                        </div>
                    </TableCell>
                    <TableCell>
                        {(() => {
                          const hours = Math.floor(worker.timeLoggedSeconds / 3600);
                          const minutes = Math.floor((worker.timeLoggedSeconds % 3600) / 60);
                          const seconds = worker.timeLoggedSeconds % 60;
                          
                          if (hours === 0 && minutes === 0) {
                            return `${seconds}s`;
                          }
                          if (hours === 0) {
                            return `${minutes}m ${seconds}s`;
                          }
                          return `${hours}h ${minutes}m ${seconds}s`;
                        })()}
                    </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
             ) : <p className="text-sm text-muted-foreground">No assembler data available. Seed data or add assemblers manually.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

    