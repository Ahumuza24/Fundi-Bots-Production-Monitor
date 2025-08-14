"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, Award, Clock, Target, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Worker, Project } from "@/lib/types";
import { subDays, format } from "date-fns";

interface PerformanceData {
  workerId: string;
  workerName: string;
  efficiency: number;
  productivity: number;
  qualityScore: number;
  timeLogged: number;
  projectsCompleted: number;
  averageTaskTime: number;
  improvementTrend: number;
}

interface PerformanceMonitorProps {
  onClose?: () => void;
}

export function PerformanceMonitor({ onClose }: PerformanceMonitorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const workersUnsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
        const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
        setWorkers(workersData);
        setLoading(false);
      });

      const projectsUnsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        setProjects(projectsData);
        setLoading(false);
      });

      return () => {
        workersUnsubscribe();
        projectsUnsubscribe();
      };
    }
  }, [open]);

  const calculatePerformanceData = (): PerformanceData[] => {
    return workers.map(worker => {
      const workerProjects = projects.filter(p => p.assignedWorkerIds?.includes(worker.id));
      const completedProjects = workerProjects.filter(p => p.status === 'Completed');
      
      // Mock calculations - in a real app, these would come from actual work session data
      const efficiency = (worker.pastPerformance || 0) * 100;
      const productivity = Math.min(efficiency + Math.random() * 20 - 10, 100);
      const qualityScore = Math.max(efficiency - Math.random() * 15, 60);
      const timeLogged = (worker.timeLoggedSeconds || 0) / 3600;
      const averageTaskTime = timeLogged > 0 ? timeLogged / Math.max(completedProjects.length, 1) : 0;
      const improvementTrend = Math.random() * 20 - 10; // -10 to +10

      return {
        workerId: worker.id,
        workerName: worker.name,
        efficiency,
        productivity,
        qualityScore,
        timeLogged,
        projectsCompleted: completedProjects.length,
        averageTaskTime,
        improvementTrend,
      };
    });
  };

  const performanceData = calculatePerformanceData();
  
  // Generate mock trend data for the selected worker
  const generateTrendData = (workerId: string) => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const basePerformance = performanceData.find(p => p.workerId === workerId)?.efficiency || 80;
      return {
        date: format(date, 'MMM dd'),
        efficiency: Math.max(basePerformance + Math.random() * 20 - 10, 50),
        productivity: Math.max(basePerformance + Math.random() * 15 - 7, 60),
        quality: Math.max(basePerformance + Math.random() * 10 - 5, 70),
      };
    });
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-yellow-100 text-yellow-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < -5) return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
    return <div className="h-4 w-4" />; // neutral
  };

  const selectedWorkerData = selectedWorker ? performanceData.find(p => p.workerId === selectedWorker) : null;
  const trendData = selectedWorker ? generateTrendData(selectedWorker) : [];

  // Radar chart data for selected worker
  const radarData = selectedWorkerData ? [
    { metric: 'Efficiency', value: selectedWorkerData.efficiency, fullMark: 100 },
    { metric: 'Productivity', value: selectedWorkerData.productivity, fullMark: 100 },
    { metric: 'Quality', value: selectedWorkerData.qualityScore, fullMark: 100 },
    { metric: 'Consistency', value: Math.max(100 - Math.abs(selectedWorkerData.improvementTrend * 5), 60), fullMark: 100 },
    { metric: 'Speed', value: Math.max(100 - selectedWorkerData.averageTaskTime * 10, 60), fullMark: 100 },
  ] : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Award className="h-4 w-4 mr-2" />
          Performance Monitor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Performance Monitor</DialogTitle>
          <DialogDescription>
            Track individual and team performance metrics across all projects.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Team Overview</TabsTrigger>
              <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
              <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Performance Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Average</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(performanceData.reduce((sum, p) => sum + p.efficiency, 0) / performanceData.length).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Overall efficiency</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceData.sort((a, b) => b.efficiency - a.efficiency)[0]?.workerName.split(' ')[0] || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performanceData.sort((a, b) => b.efficiency - a.efficiency)[0]?.efficiency.toFixed(1)}% efficiency
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceData.reduce((sum, p) => sum + p.timeLogged, 0).toFixed(0)}h
                    </div>
                    <p className="text-xs text-muted-foreground">This period</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projects Done</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceData.reduce((sum, p) => sum + p.projectsCompleted, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Completed projects</p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Individual Performance Metrics</CardTitle>
                  <CardDescription>Detailed performance breakdown for each team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker</TableHead>
                        <TableHead>Efficiency</TableHead>
                        <TableHead>Productivity</TableHead>
                        <TableHead>Quality Score</TableHead>
                        <TableHead>Hours Logged</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead>Overall</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceData.map((worker) => (
                        <TableRow 
                          key={worker.workerId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedWorker(worker.workerId)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={workers.find(w => w.id === worker.workerId)?.avatarUrl} 
                                  alt={worker.workerName} 
                                />
                                <AvatarFallback>{worker.workerName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{worker.workerName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={worker.efficiency} className="h-2 w-16" />
                              <span className="text-sm">{worker.efficiency.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={worker.productivity} className="h-2 w-16" />
                              <span className="text-sm">{worker.productivity.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={worker.qualityScore} className="h-2 w-16" />
                              <span className="text-sm">{worker.qualityScore.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{worker.timeLogged.toFixed(1)}h</TableCell>
                          <TableCell>{worker.projectsCompleted}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(worker.improvementTrend)}
                              <span className="text-sm">{worker.improvementTrend.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={getPerformanceColor((worker.efficiency + worker.productivity + worker.qualityScore) / 3)}
                            >
                              {getPerformanceLabel((worker.efficiency + worker.productivity + worker.qualityScore) / 3)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="individual" className="space-y-6">
              {selectedWorkerData ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Worker Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={workers.find(w => w.id === selectedWorkerData.workerId)?.avatarUrl} 
                            alt={selectedWorkerData.workerName} 
                          />
                          <AvatarFallback>{selectedWorkerData.workerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {selectedWorkerData.workerName}
                      </CardTitle>
                      <CardDescription>Individual performance analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold">{selectedWorkerData.efficiency.toFixed(1)}%</div>
                          <p className="text-xs text-muted-foreground">Efficiency Rating</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{selectedWorkerData.projectsCompleted}</div>
                          <p className="text-xs text-muted-foreground">Projects Completed</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{selectedWorkerData.timeLogged.toFixed(0)}h</div>
                          <p className="text-xs text-muted-foreground">Hours Logged</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{selectedWorkerData.averageTaskTime.toFixed(1)}h</div>
                          <p className="text-xs text-muted-foreground">Avg Task Time</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Radar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Radar</CardTitle>
                      <CardDescription>Multi-dimensional performance view</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar
                            name="Performance"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Worker</h3>
                    <p className="text-muted-foreground text-center">
                      Click on a worker from the Team Overview tab to see detailed individual analysis.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="trends" className="space-y-6">
              {selectedWorkerData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends - {selectedWorkerData.workerName}</CardTitle>
                    <CardDescription>7-day performance trend analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="efficiency" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Efficiency"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="productivity" 
                          stroke="#ff7300" 
                          strokeWidth={2}
                          name="Productivity"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="quality" 
                          stroke="#00C49F" 
                          strokeWidth={2}
                          name="Quality"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Worker</h3>
                    <p className="text-muted-foreground text-center">
                      Choose a worker to view their performance trends over time.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}