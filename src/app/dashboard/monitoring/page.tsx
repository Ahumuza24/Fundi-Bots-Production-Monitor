"use client"
import React, { useEffect, useState } from 'react';
import { Activity, Users, Clock, AlertTriangle, TrendingUp, Zap } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { collection, onSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Project, Worker, MachineUtilization } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data for machine utilization
const mockMachineData: MachineUtilization[] = [
  { machineId: 'CNC-001', machineName: 'CNC Mill #1', type: 'CNC', utilizationPercentage: 85, activeTime: 6.8, downTime: 1.2 },
  { machineId: 'LASER-001', machineName: 'Laser Cutter #1', type: 'Laser', utilizationPercentage: 92, activeTime: 7.4, downTime: 0.6 },
  { machineId: 'ASM-001', machineName: 'Assembly Station #1', type: 'Assembly Station', utilizationPercentage: 78, activeTime: 6.2, downTime: 1.8 },
  { machineId: 'ASM-002', machineName: 'Assembly Station #2', type: 'Assembly Station', utilizationPercentage: 65, activeTime: 5.2, downTime: 2.8 },
];

// Mock production rate data
const productionRateData = [
  { time: '08:00', rate: 45 },
  { time: '09:00', rate: 52 },
  { time: '10:00', rate: 48 },
  { time: '11:00', rate: 55 },
  { time: '12:00', rate: 30 }, // lunch break
  { time: '13:00', rate: 58 },
  { time: '14:00', rate: 62 },
  { time: '15:00', rate: 59 },
  { time: '16:00', rate: 54 },
  { time: '17:00', rate: 48 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function getProjectProgress(project: Project) {
  if (!project.components || project.components.length === 0) return 0;
  const total = project.components.reduce((sum, c) => sum + (c.quantityRequired || 0), 0);
  if (total === 0) return 0;
  const completed = project.components.reduce((sum, c) => sum + (c.quantityCompleted || 0), 0);
  return (completed / total) * 100;
}

function formatTime(seconds: number = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function MonitoringPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const projectsUnsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      setLoading(false);
    });

    const workersUnsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(workersData);
      setLoading(false);
    });

    return () => {
      projectsUnsubscribe();
      workersUnsubscribe();
    };
  }, []);

  const activeProjects = projects.filter(p => p.status === 'In Progress');
  const activeWorkers = workers.filter(w => w.status === 'Active');
  const urgentProjects = projects.filter(p => {
    const deadline = new Date(p.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 3 && p.status !== 'Completed';
  });

  const bottlenecks = projects.filter(p => {
    const progress = getProjectProgress(p);
    const deadline = new Date(p.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.max(0, 100 - (daysUntilDeadline * 10)); // rough calculation
    return progress < expectedProgress && p.status === 'In Progress';
  });

  const totalPartsToday = projects.reduce((sum, p) => 
    sum + p.components.reduce((compSum, c) => compSum + c.quantityCompleted, 0), 0
  );

  const averageEfficiency = workers.length > 0 
    ? workers.reduce((sum, w) => sum + (w.pastPerformance || 0), 0) / workers.length * 100
    : 0;

  const machineUtilizationData = mockMachineData.map(machine => ({
    name: machine.machineName,
    utilization: machine.utilizationPercentage,
    type: machine.type,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Real-time Monitoring</h1>
          <p className="text-muted-foreground">Live production metrics and performance tracking</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Real-time Monitoring</h1>
        <p className="text-muted-foreground">Live production metrics and performance tracking</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkers.length}</div>
            <p className="text-xs text-muted-foreground">
              {workers.length} total workers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parts Completed Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Deadlines</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Due within 3 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Production Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Production Rate (Parts/Hour)</CardTitle>
            <CardDescription>Real-time production rate throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={productionRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Machine Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Machine Utilization</CardTitle>
            <CardDescription>Current utilization rates across all machines</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={machineUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="utilization" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Work Sessions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Work Sessions</CardTitle>
            <CardDescription>Workers currently active on projects</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeWorkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No active work sessions
                    </TableCell>
                  </TableRow>
                ) : (
                  activeWorkers.map((worker) => {
                    const activeProject = projects.find(p => p.id === worker.activeProjectId);
                    return (
                      <TableRow key={worker.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={worker.avatarUrl} alt={worker.name} />
                              <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{worker.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activeProject ? activeProject.name : 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(worker.timeLoggedSeconds)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                              Active
                            </div>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bottlenecks & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Bottlenecks & Alerts</CardTitle>
            <CardDescription>Projects requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bottlenecks.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>All projects on track!</p>
              </div>
            ) : (
              bottlenecks.map((project) => (
                <div key={project.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Behind schedule - {getProjectProgress(project).toFixed(0)}% complete
                    </div>
                    <Progress value={getProjectProgress(project)} className="mt-2 h-2" />
                  </div>
                </div>
              ))
            )}
            
            {urgentProjects.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-red-600 mb-2">Urgent Deadlines</h4>
                {urgentProjects.map((project) => (
                  <div key={project.id} className="flex items-center gap-2 text-sm mb-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full" />
                    <span>{project.name}</span>
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Machine Details */}
      <Card>
        <CardHeader>
          <CardTitle>Machine Status Details</CardTitle>
          <CardDescription>Detailed view of all production machines</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Active Time</TableHead>
                <TableHead>Down Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMachineData.map((machine) => (
                <TableRow key={machine.machineId}>
                  <TableCell className="font-medium">{machine.machineName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{machine.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={machine.utilizationPercentage} className="h-2 w-20" />
                      <span className="text-sm">{machine.utilizationPercentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{machine.activeTime}h</TableCell>
                  <TableCell>{machine.downTime}h</TableCell>
                  <TableCell>
                    <Badge 
                      variant={machine.utilizationPercentage > 80 ? "default" : "secondary"}
                      className={machine.utilizationPercentage > 80 ? "bg-green-100 text-green-800" : ""}
                    >
                      {machine.utilizationPercentage > 80 ? "Optimal" : "Underutilized"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}