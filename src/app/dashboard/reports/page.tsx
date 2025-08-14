"use client"
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp, Users, Package, Clock } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { collection, onSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Project, Worker } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from "react-day-picker";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ReportData {
  projectsCompleted: number;
  totalPartsProduced: number;
  averageEfficiency: number;
  totalWorkHours: number;
  projectsByStatus: { name: string; value: number; color: string }[];
  productionTrend: { date: string; parts: number; efficiency: number }[];
  workerPerformance: { name: string; efficiency: number; hours: number; parts: number }[];
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date()),
  });
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

  useEffect(() => {
    const now = new Date();
    switch (reportType) {
      case 'daily':
        setDateRange({ from: now, to: now });
        break;
      case 'weekly':
        setDateRange({ from: startOfWeek(now), to: endOfWeek(now) });
        break;
      case 'monthly':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
    }
  }, [reportType]);

  const generateReportData = (): ReportData => {
    const completedProjects = projects.filter(p => p.status === 'Completed');
    const totalParts = projects.reduce((sum, p) => 
      sum + p.components.reduce((compSum, c) => compSum + c.quantityCompleted, 0), 0
    );
    
    const totalWorkHours = workers.reduce((sum, w) => sum + (w.timeLoggedSeconds || 0), 0) / 3600;
    const averageEfficiency = workers.length > 0 
      ? workers.reduce((sum, w) => sum + (w.pastPerformance || 0), 0) / workers.length * 100
      : 0;

    const projectsByStatus = [
      { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: '#00C49F' },
      { name: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, color: '#0088FE' },
      { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length, color: '#FFBB28' },
      { name: 'Not Started', value: projects.filter(p => p.status === 'Not Started').length, color: '#FF8042' },
    ];

    // Mock production trend data
    const productionTrend = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM dd'),
        parts: Math.floor(Math.random() * 100) + 50,
        efficiency: Math.floor(Math.random() * 20) + 80,
      };
    });

    const workerPerformance = workers.map(worker => ({
      name: worker.name,
      efficiency: (worker.pastPerformance || 0) * 100,
      hours: (worker.timeLoggedSeconds || 0) / 3600,
      parts: Math.floor(Math.random() * 50) + 10, // Mock data
    }));

    return {
      projectsCompleted: completedProjects.length,
      totalPartsProduced: totalParts,
      averageEfficiency,
      totalWorkHours,
      projectsByStatus,
      productionTrend,
      workerPerformance,
    };
  };

  const reportData = generateReportData();

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    // Mock export functionality
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} report...`,
    });
    
    // In a real implementation, this would generate and download the actual file
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `Report exported as ${format.toUpperCase()} successfully.`,
      });
    }, 2000);
  };

  const getReportTitle = () => {
    if (!dateRange?.from) return 'Custom Report';
    
    const from = format(dateRange.from, 'MMM dd, yyyy');
    const to = dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : from;
    
    return `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report: ${from}${to !== from ? ` - ${to}` : ''}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate comprehensive production reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate comprehensive production reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Configure your report parameters</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {reportType === 'custom' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          )}
          
          <Badge variant="outline" className="ml-auto">
            {getReportTitle()}
          </Badge>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.projectsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parts Produced</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalPartsProduced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.averageEfficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Team performance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalWorkHours.toFixed(0)}h</div>
            <p className="text-xs text-muted-foreground">
              Logged time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Production Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Production Trend</CardTitle>
            <CardDescription>Daily parts production and efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.productionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="parts" fill="hsl(var(--primary))" name="Parts Produced" />
                <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#ff7300" name="Efficiency %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current status of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.projectsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.projectsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Worker Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Performance Summary</CardTitle>
          <CardDescription>Individual worker metrics and productivity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Efficiency</TableHead>
                <TableHead>Hours Worked</TableHead>
                <TableHead>Parts Completed</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.workerPerformance.map((worker, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{worker.efficiency.toFixed(1)}%</TableCell>
                  <TableCell>{worker.hours.toFixed(1)}h</TableCell>
                  <TableCell>{worker.parts}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={worker.efficiency >= 90 ? "default" : worker.efficiency >= 75 ? "secondary" : "destructive"}
                      className={
                        worker.efficiency >= 90 ? "bg-green-100 text-green-800" :
                        worker.efficiency >= 75 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }
                    >
                      {worker.efficiency >= 90 ? "Excellent" : worker.efficiency >= 75 ? "Good" : "Needs Improvement"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Project Report */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Comprehensive project status and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Assigned Workers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      project.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                      project.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                      project.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {project.priority || 'Medium'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {((project.components.reduce((sum, c) => sum + c.quantityCompleted, 0) / 
                      project.components.reduce((sum, c) => sum + c.quantityRequired, 0)) * 100 || 0).toFixed(0)}%
                  </TableCell>
                  <TableCell>{format(new Date(project.deadline), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{project.assignedWorkerIds?.length || 0} workers</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}