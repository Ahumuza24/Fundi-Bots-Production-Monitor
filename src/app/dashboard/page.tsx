
"use client"
import React, { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, CheckCircle, Package, Users, Hourglass, GanttChartSquare, Database } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    
    const projectsUnsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
    }, (error) => {
      console.error("Error fetching projects: ", error);
       toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch projects from Firestore.",
        });
    });

    const workersUnsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(workersData);
    }, (error) => {
      console.error("Error fetching workers: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch workers from Firestore.",
      });
    });

    // Set loading to false once both have been fetched at least once
    // A more robust solution might use Promise.all with getDocs for initial load
    setLoading(false);

    return () => {
      projectsUnsubscribe();
      workersUnsubscribe();
    }
  }, [toast]);
  
  const handleSeedData = async () => {
    try {
      const batch = writeBatch(db);

      mockProjects.forEach(project => {
        const projectRef = doc(db, "projects", project.id);
        batch.set(projectRef, project);
      });
      
      mockWorkers.forEach(worker => {
        const workerRef = doc(db, "workers", worker.id);
        batch.set(workerRef, worker);
      });
      
      await batch.commit();
      
      toast({
        title: "Success",
        description: "Mock data has been seeded to Firestore.",
      });
      // Data will refresh via onSnapshot listeners
      
    } catch (error) {
      console.error("Error seeding data: ", error);
      toast({
        variant: "destructive",
        title: "Error Seeding Data",
        description: "Could not write mock data to Firestore.",
      });
    }
  };


  const chartData = projects.map(p => ({
    name: p.name.split(' ')[0],
    total: p.components.reduce((acc, c) => acc + c.quantityRequired, 0),
    completed: p.components.reduce((acc, c) => acc + c.quantityCompleted, 0),
  }));

  const projectsInProgress = projects.filter(p => p.status === 'In Progress').length;
  const totalUnitsCompleted = projects.flatMap(p => p.components).reduce((sum, c) => sum + c.quantityCompleted, 0);
  const totalUnits = projects.flatMap(p => p.components).reduce((sum, c) => sum + c.quantityRequired, 0);
  const teamProductivity = totalUnits > 0 ? ((totalUnitsCompleted / totalUnits) * 100).toFixed(0) : 0;
  
  const recentAssemblers = workers.slice(0, 4);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projects In Progress
            </CardTitle>
            <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsInProgress}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Units
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnitsCompleted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              out of {totalUnits.toLocaleString()} total units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamProductivity}%</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Deadlines</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
                  <Button onClick={handleSeedData}>
                      <Database className="mr-2 h-4 w-4" />
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
                  <TableHead>Skills</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAssemblers.map((worker) => (
                    <TableRow key={worker.id}>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={worker.avatarUrl} alt="Avatar" />
                            <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{worker.name}</div>
                        </div>
                    </TableCell>
                    <TableCell>
                        {worker.skills.join(', ')}
                    </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
             ) : <p>No assembler data available.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
