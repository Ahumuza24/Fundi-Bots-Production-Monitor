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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Worker, Project, WorkSession } from "@/lib/types";
import { subDays, format } from "date-fns";

interface PerformanceData {
  workerId: string;
  workerName: string;
  efficiency: number;
  productivity: number;
  qualityScore: number;
  timeLogged: number;
  timeLoggedSeconds: number;
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
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);

  useEffect(() => {
    if (open) {
      const workersUnsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
        const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
        setWorkers(workersData);
      });

      const projectsUnsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        setProjects(projectsData);
      });

      const workSessionsUnsubscribe = onSnapshot(collection(db, "workSessions"), (snapshot) => {
        const sessionsData = snapshot.docs.map(doc => {
          const d = doc.data() as any;
          const startTime: Date = d.startTime instanceof Timestamp ? d.startTime.toDate() : new Date(d.startTime);
          const endTime: Date | undefined = d.endTime ? (d.endTime instanceof Timestamp ? d.endTime.toDate() : new Date(d.endTime)) : undefined;
          return {
            id: doc.id,
            workerId: d.workerId,
            projectId: d.projectId,
            componentId: d.componentId,
            process: d.process,
            startTime,
            endTime,
            completedComponents: Array.isArray(d.completedComponents) ? d.completedComponents : [],
            qualityRating: d.qualityRating,
            notes: d.notes,
            breakTimeSeconds: typeof d.breakTimeSeconds === 'number' ? d.breakTimeSeconds : 0,
          } as WorkSession;
        });
        setWorkSessions(sessionsData);
      });

      return () => {
        workersUnsubscribe();
        projectsUnsubscribe();
        workSessionsUnsubscribe();
      };
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (workers.length >= 0 && projects.length >= 0 && workSessions.length >= 0) {
        setLoading(false);
      }
    }
  }, [open, workers.length, projects.length, workSessions.length]);

  const calculatePerformanceData = (): PerformanceData[] => {
    const DEFAULT_STD_MIN = 5; // fallback standard time (minutes) per unit when not specified
    const getStdMinutes = (projectId: string, componentId?: string): number | null => {
      if (!componentId) return null;
      const proj = projects.find(p => p.id === projectId);
      const comp = proj?.components?.find(c => c.id === componentId);
      return comp?.estimatedTimePerUnit ?? DEFAULT_STD_MIN; // minutes per unit (fallback)
    };

    const lastNDays = 30; // analysis window
    const fromDate = subDays(new Date(), lastNDays);

    return workers.map(worker => {
      const workerProjects = projects.filter(p => p.assignedWorkerIds?.includes(worker.id));
      const sessions = workSessions.filter(s => s.workerId === worker.id && s.startTime >= fromDate);

      let activeMinutes = 0; // end-start minus breaks
      let totalMinutes = 0;  // end-start including breaks
      let expectedMinutes = 0; // sum(quantity * std minutes)
      let totalCompletedUnits = 0;
      let qualityWeighted = 0;
      let qualityWeight = 0;

      const qualityMap: Record<string, number> = { Good: 100, 'Needs Rework': 80, Defective: 40 };

      sessions.forEach(s => {
        const start = s.startTime.getTime();
        const end = (s.endTime ? s.endTime : new Date()).getTime();
        const durationMin = Math.max(0, (end - start) / 60000);
        const breakMin = (s.breakTimeSeconds || 0) / 60;
        totalMinutes += durationMin;
        activeMinutes += Math.max(0, durationMin - breakMin);

        // expected minutes and completed units
        const unitsInSession = Array.isArray(s.completedComponents)
          ? s.completedComponents.reduce((acc, cc) => acc + (cc?.quantity || 0), 0)
          : 0;
        totalCompletedUnits += unitsInSession;

        if (Array.isArray(s.completedComponents)) {
          s.completedComponents.forEach(cc => {
            const stdMin = getStdMinutes(s.projectId, cc.componentId);
            if ((stdMin ?? null) && cc.quantity) expectedMinutes += stdMin * cc.quantity;
          });
        }

        // quality score weighting
        const sessionQuality = s.qualityRating ? (qualityMap[s.qualityRating] ?? 80) : 80;
        const weight = unitsInSession > 0 ? unitsInSession : 1; // weight by output if present
        qualityWeighted += sessionQuality * weight;
        qualityWeight += weight;
      });

      const efficiency = activeMinutes > 0 && expectedMinutes > 0
        ? Math.min(150, (expectedMinutes / activeMinutes) * 100) // cap at 150%
        : 0;

      const productivity = totalMinutes > 0
        ? Math.max(0, Math.min(100, (activeMinutes / totalMinutes) * 100))
        : 0;

      const qualityScore = qualityWeight > 0 ? (qualityWeighted / qualityWeight) : 0;

      const timeLogged = activeMinutes / 60;
      const timeLoggedSeconds = Math.round(activeMinutes * 60);

      const averageTaskTime = totalCompletedUnits > 0 ? (activeMinutes / 60) / totalCompletedUnits : 0; // hours per unit

      // 7-day overall trend: change in average of (efficiency, productivity, quality) from first to last day
      const last7 = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
      const dailyScores: { eff: number; prod: number; qual: number; overall: number }[] = last7.map(day => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        let dayActive = 0;
        let dayTotal = 0;
        let dayExpected = 0;
        let dayQualityWeighted = 0;
        let dayQualityWeight = 0;
        sessions.forEach(s => {
          const sStart = s.startTime;
          const sEnd = s.endTime ?? new Date();
          if (sEnd < dayStart || sStart > dayEnd) return;
          const start = Math.max(sStart.getTime(), dayStart.getTime());
          const end = Math.min(sEnd.getTime(), dayEnd.getTime());
          const durationMin = Math.max(0, (end - start) / 60000);
          const breakMin = (s.breakTimeSeconds || 0) / 60; // approximate within-day break
          dayTotal += durationMin;
          const activeMin = Math.max(0, durationMin - Math.min(breakMin, durationMin));
          dayActive += activeMin;
          if (Array.isArray(s.completedComponents)) {
            s.completedComponents.forEach(cc => {
              const stdMin = getStdMinutes(s.projectId, cc.componentId);
              if ((stdMin ?? null) && cc.quantity) dayExpected += stdMin * cc.quantity;
            });
          }
          const q = s.qualityRating ? (qualityMap[s.qualityRating] ?? 80) : 80;
          const w = (Array.isArray(s.completedComponents) && s.completedComponents.reduce((a, c) => a + (c?.quantity || 0), 0)) || 1;
          dayQualityWeighted += q * w;
          dayQualityWeight += w;
        });
        const eff = dayActive > 0 && dayExpected > 0 ? Math.min(150, (dayExpected / dayActive) * 100) : 0;
        const prod = dayTotal > 0 ? Math.max(0, Math.min(100, (dayActive / dayTotal) * 100)) : 0;
        const qual = dayQualityWeight > 0 ? (dayQualityWeighted / dayQualityWeight) : 0;
        const overall = (eff + prod + qual) / 3;
        return { eff, prod, qual, overall };
      });
      const improvementTrend = dailyScores.length > 1 ? (dailyScores[dailyScores.length - 1].overall - dailyScores[0].overall) : 0;

      return {
        workerId: worker.id,
        workerName: worker.name,
        efficiency,
        productivity,
        qualityScore,
        timeLogged,
        timeLoggedSeconds,
        projectsCompleted: projects.filter(p => p.status === 'Completed').length,
        averageTaskTime,
        improvementTrend,
      };
    });
  };

  const performanceData = calculatePerformanceData();

  const generateTrendData = (workerId: string) => {
    const sessions = workSessions.filter(s => s.workerId === workerId);
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    const getStdMinutes = (projectId: string, componentId?: string): number | null => {
      if (!componentId) return null;
      const proj = projects.find(p => p.id === projectId);
      const comp = proj?.components?.find(c => c.id === componentId);
      const DEFAULT_STD_MIN = 5;
      return comp?.estimatedTimePerUnit ?? DEFAULT_STD_MIN;
    };

    return days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      let activeMin = 0;
      let totalMin = 0;
      let expectedMin = 0;
      let qualityWeighted = 0;
      let qualityWeight = 0;
      let units = 0;

      const qualityMap: Record<string, number> = { Good: 100, 'Needs Rework': 80, Defective: 40 };

      sessions.forEach(s => {
        const sStart = s.startTime;
        const sEnd = s.endTime ?? new Date();
        if (sEnd < dayStart || sStart > dayEnd) return;
        const start = Math.max(sStart.getTime(), dayStart.getTime());
        const end = Math.min(sEnd.getTime(), dayEnd.getTime());
        const durationMin = Math.max(0, (end - start) / 60000);
        const breakMin = (s.breakTimeSeconds || 0) / 60;
        totalMin += durationMin;
        activeMin += Math.max(0, durationMin - Math.min(breakMin, durationMin));

        if (Array.isArray(s.completedComponents)) {
          s.completedComponents.forEach(cc => {
            const stdMin = getStdMinutes(s.projectId, cc.componentId);
            if ((stdMin ?? null) && cc.quantity) expectedMin += stdMin * cc.quantity;
            units += cc?.quantity || 0;
          });
        }

        const q = s.qualityRating ? (qualityMap[s.qualityRating] ?? 80) : 80;
        const w = (Array.isArray(s.completedComponents) && s.completedComponents.reduce((a, c) => a + (c?.quantity || 0), 0)) || 1;
        qualityWeighted += q * w;
        qualityWeight += w;
      });

      const efficiency = activeMin > 0 && expectedMin > 0 ? Math.min(150, (expectedMin / activeMin) * 100) : 0;
      const productivity = totalMin > 0 ? Math.max(0, Math.min(100, (activeMin / totalMin) * 100)) : 0;
      const quality = qualityWeight > 0 ? (qualityWeighted / qualityWeight) : 0;

      return {
        date: format(date, 'MMM dd'),
        efficiency,
        productivity,
        quality,
      };
    });
  };

  const selectedWorkerData = selectedWorker ? performanceData.find(p => p.workerId === selectedWorker) : null;
  const trendData = selectedWorker ? generateTrendData(selectedWorker) : [];

  const radarData = selectedWorkerData ? [
    { metric: 'Efficiency', value: selectedWorkerData.efficiency, fullMark: 100 },
    { metric: 'Productivity', value: selectedWorkerData.productivity, fullMark: 100 },
    { metric: 'Quality', value: selectedWorkerData.qualityScore, fullMark: 100 },
    { metric: 'Consistency', value: Math.max(100 - Math.abs(selectedWorkerData.improvementTrend * 5), 60), fullMark: 100 },
    { metric: 'Speed', value: Math.max(100 - selectedWorkerData.averageTaskTime * 10, 60), fullMark: 100 },
  ] : [];

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
    return <div className="h-4 w-4" />;
  };

  const formatDuration = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    const sStr = secs.toString().padStart(2, '0');
    return `${hrs}h ${mins}m ${sStr}s`;
  };

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
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Average</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceData.length > 0 ? (performanceData.reduce((sum, p) => sum + p.efficiency, 0) / performanceData.length).toFixed(1) : "0.0"}%
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
                      {performanceData.length > 0 ? performanceData.slice().sort((a, b) => b.efficiency - a.efficiency)[0]?.workerName.split(' ')[0] : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performanceData.length > 0 ? performanceData.slice().sort((a, b) => b.efficiency - a.efficiency)[0]?.efficiency.toFixed(1) : '0.0'}% efficiency
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
                      {performanceData.length > 0
                        ? formatDuration(
                            performanceData.reduce(
                              (sum, p) => sum + (p.timeLoggedSeconds ?? Math.round((p.timeLogged || 0) * 3600)),
                              0
                            )
                          )
                        : '0h 00m 00s'}
                    </div>
                    <p className="text-xs text-muted-foreground">This period</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projects Worked On</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceData.length > 0 ? performanceData.reduce((sum, p) => sum + p.projectsCompleted, 0) : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Distinct projects with activity</p>
                  </CardContent>
                </Card>
              </div>

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
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border-2 border-fundibots-yellow/20">
                                <AvatarFallback className="bg-gradient-to-br from-fundibots-yellow to-fundibots-secondary text-white font-semibold text-xs">
                                  {(() => {
                                    const names = worker.workerName.trim().split(' ').filter(n => n.length > 0);
                                    if (names.length === 0) return "W";
                                    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
                                    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                                  })()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium text-gray-900">{worker.workerName}</div>
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
                          <TableCell>{formatDuration(worker.timeLoggedSeconds)}</TableCell>
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-fundibots-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-fundibots-primary to-fundibots-cyan text-white font-semibold text-xs">
                            {(() => {
                              const names = selectedWorkerData.workerName.trim().split(' ').filter(n => n.length > 0);
                              if (names.length === 0) return "W";
                              if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
                              return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                            })()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-900">{selectedWorkerData.workerName}</span>
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
                          <p className="text-xs text-muted-foreground">Projects Worked On</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{formatDuration(selectedWorkerData.timeLoggedSeconds)}</div>
                          <p className="text-xs text-muted-foreground">Hours Logged</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{selectedWorkerData.averageTaskTime.toFixed(1)}h</div>
                          <p className="text-xs text-muted-foreground">Avg Task Time</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

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