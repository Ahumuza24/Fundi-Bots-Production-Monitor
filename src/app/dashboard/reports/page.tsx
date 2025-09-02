"use client"
import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Activity, AlertTriangle, Zap } from "lucide-react"
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
import type { Project, Worker, MachineUtilization } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from "react-day-picker";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Machine utilization data - will be calculated from actual work sessions
const machineData: MachineUtilization[] = [];

// Production rate data - will be calculated from actual work sessions
const productionRateData = [
  { time: '17:00', rate: 48 },
];

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
  const s = seconds % 60;
  
  if (h === 0 && m === 0) {
    return `${s}s`;
  }
  
  if (h === 0) {
    return `${m}m ${s}s`;
  }
  
  return `${h}h ${m}m ${s}s`;
}

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
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom' | 'monitoring'>('weekly');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date()),
  });
  const [isExporting, setIsExporting] = useState(false);
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

    let projectsByStatus = [
      { name: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: '#9fcc3b' },
      { name: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, color: '#15bddc' },
      { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length, color: '#fedb00' },
      { name: 'Not Started', value: projects.filter(p => p.status === 'Not Started').length, color: '#ef5824' },
    ].filter(item => item.value > 0); // Filter out empty categories
    
    // Add mock data if no projects exist
    if (projectsByStatus.length === 0) {
      projectsByStatus = [
        { name: 'Completed', value: 3, color: '#9fcc3b' },
        { name: 'In Progress', value: 5, color: '#15bddc' },
        { name: 'On Hold', value: 1, color: '#fedb00' },
        { name: 'Not Started', value: 2, color: '#ef5824' },
      ];
    }

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

  const reportData = useMemo(() => generateReportData(), [projects, workers, reportType]);

  const exportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    if (isExporting) return;
    
    setIsExporting(true);
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} report...`,
    });
    
    try {
      const data = generateReportData();
      const reportTitle = getReportTitle();
      
      // Validate data before export
      if (!data || (format === 'pdf' && (!projects.length && !workers.length))) {
        throw new Error('No data available for export');
      }
      
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (format === 'csv' || format === 'excel') {
        exportToCSV(data, reportTitle, format);
      } else if (format === 'pdf') {
        await exportToPDF(data, reportTitle);
      }
      
      toast({
        title: "Export Complete",
        description: `Report downloaded as ${format.toUpperCase()} successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: `Failed to export ${format.toUpperCase()} report. Please try again.`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = (data: any, title: string, format: 'csv' | 'excel') => {
    try {
      // Create CSV content
      const csvContent = [
        [title],
        ['Generated on:', new Date().toLocaleString()],
        [], // Empty row
        ['Summary Statistics'],
        ['Metric', 'Value'],
        ['Projects Completed', data.projectsCompleted || 0],
        ['Total Parts Produced', data.totalPartsProduced || 0],
        ['Average Efficiency', `${(data.averageEfficiency || 0).toFixed(1)}%`],
        ['Total Work Hours', formatTime(Math.round((data.totalWorkHours || 0) * 3600))],
        [], // Empty row
      ];

    // Add project data if available
    if (projects.length > 0) {
      csvContent.push(
        ['Project Metrics'],
        ['Project Name', 'Status', 'Progress (%)', 'Total Components', 'Completed Components', 'Deadline'],
        ...projects.map(project => {
          const progress = project.components.length > 0 
            ? ((project.components.reduce((sum, c) => sum + c.quantityCompleted, 0) / 
                project.components.reduce((sum, c) => sum + c.quantityRequired, 0)) * 100).toFixed(1)
            : '0';
          return [
            project.name,
            project.status,
            progress,
            project.components.reduce((sum, c) => sum + c.quantityRequired, 0),
            project.components.reduce((sum, c) => sum + c.quantityCompleted, 0),
            new Date(project.deadline).toLocaleDateString()
          ];
        }),
        [] // Empty row
      );
    }

    // Add worker data if available
    if (workers.length > 0) {
      csvContent.push(
        ['Worker Performance'],
        ['Worker Name', 'Skills', 'Availability', 'Performance', 'Time Logged', 'Status'],
        ...workers.map(worker => [
          worker.name,
          worker.skills.join('; '),
          worker.availability,
          `${(worker.pastPerformance * 100).toFixed(1)}%`,
          formatTime(worker.timeLoggedSeconds || 0),
          worker.activeProjectId ? 'Active' : 'Inactive'
        ]),
        [] // Empty row
      );
    }

    // Add machine data for monitoring reports
    if (reportType === 'monitoring') {
      csvContent.push(
        ['Machine Utilization'],
        ['Machine Name', 'Type', 'Utilization (%)', 'Active Time (h)', 'Down Time (h)', 'Status'],
        ...machineData.map(machine => [
          machine.machineName,
          machine.type,
          machine.utilizationPercentage,
          machine.activeTime,
          machine.downTime,
          machine.utilizationPercentage > 80 ? 'Optimal' : 'Underutilized'
        ])
      );
    }

      // Convert to CSV string
      const csvString = csvContent.map(row => 
        row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to generate CSV report');
    }
  };

  const exportToPDF = async (data: any, title: string) => {
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(title, 20, 20);
      
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
      
      let yPosition = 50;
      
      // Summary Statistics
      doc.setFontSize(14);
      doc.text('Summary Statistics', 20, yPosition);
      yPosition += 15;
      
      // Add summary data as text
      doc.setFontSize(10);
      doc.text(`Projects Completed: ${data.projectsCompleted || 0}`, 25, yPosition);
      yPosition += 10;
      doc.text(`Total Parts Produced: ${(data.totalPartsProduced || 0).toLocaleString()}`, 25, yPosition);
      yPosition += 10;
      doc.text(`Average Efficiency: ${(data.averageEfficiency || 0).toFixed(1)}%`, 25, yPosition);
      yPosition += 10;
      doc.text(`Total Work Hours: ${formatTime(Math.round((data.totalWorkHours || 0) * 3600))}`, 25, yPosition);
      yPosition += 20;
    
      // Project Details as text
      if (projects.length > 0) {
        doc.setFontSize(14);
        doc.text('Project Details', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(10);
        projects.slice(0, 10).forEach((project, index) => { // Limit to first 10 projects
          const progress = project.components.length > 0 
            ? ((project.components.reduce((sum, c) => sum + c.quantityCompleted, 0) / 
                project.components.reduce((sum, c) => sum + c.quantityRequired, 0)) * 100).toFixed(1)
            : '0';
          
          doc.text(`${index + 1}. ${project.name} - ${project.status} (${progress}% complete)`, 25, yPosition);
          yPosition += 8;
          
          if (yPosition > 270) { // Add new page if needed
            doc.addPage();
            yPosition = 20;
          }
        });
        
        yPosition += 10;
      }
      
      // Worker Performance as text
      if (workers.length > 0) {
        if (yPosition > 200) { // Add new page if needed
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Worker Performance', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(10);
        workers.slice(0, 10).forEach((worker, index) => { // Limit to first 10 workers
          doc.text(`${index + 1}. ${worker.name} - ${(worker.pastPerformance * 100).toFixed(1)}% efficiency`, 25, yPosition);
          yPosition += 8;
          
          if (yPosition > 270) { // Add new page if needed
            doc.addPage();
            yPosition = 20;
          }
        });
      }
    
      // Machine Utilization (for monitoring reports)
      if (reportType === 'monitoring') {
        if (yPosition > 200) { // Add new page if needed
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Machine Utilization', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(10);
        machineData.forEach((machine, index) => {
          const status = machine.utilizationPercentage > 80 ? 'Optimal' : 'Underutilized';
          doc.text(`${index + 1}. ${machine.machineName} (${machine.type}) - ${machine.utilizationPercentage}% - ${status}`, 25, yPosition);
          yPosition += 8;
          
          if (yPosition > 270) { // Add new page if needed
            doc.addPage();
            yPosition = 20;
          }
        });
      }
      
      // Save the PDF
      doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF report');
    }
  };

  const getReportTitle = () => {
    if (!dateRange?.from) return 'Custom Report';
    
    const from = format(dateRange.from, 'MMM dd, yyyy');
    const to = dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : from;
    
    return `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report: ${from}${to !== from ? ` - ${to}` : ''}`;
  };

  const exportChartData = (chartData: any[], chartName: string, format: 'csv' | 'json') => {
    try {
      if (format === 'csv') {
        const headers = Object.keys(chartData[0] || {});
        const csvContent = [
          [chartName],
          ['Generated on:', new Date().toLocaleString()],
          [],
          headers,
          ...chartData.map(row => headers.map(header => row[header]))
        ];
        
        const csvString = csvContent.map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${chartName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const jsonData = {
          chartName,
          generatedOn: new Date().toISOString(),
          data: chartData
        };
        
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${chartName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Chart Data Exported",
        description: `${chartName} data exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Chart export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: `Failed to export chart data.`,
      });
    }
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

  // Monitoring calculations
  const activeProjects = projects.filter(p => p.status === 'In Progress');
  const activeWorkers = workers.filter(w => w.activeProjectId);
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

  const machineUtilizationData = machineData.map(machine => ({
    name: machine.machineName,
    utilization: machine.utilizationPercentage,
    type: machine.type,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate comprehensive production reports and live monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => exportReport('csv')} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'CSV'}
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Excel'}
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'PDF'}
          </Button>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={(value: any) => setReportType(value)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          {/* Daily Reports Content */}

      {/* Report Controls */}
      <Card className="card-hover-gradient">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Configure your report parameters</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-fundibots-primary" />
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
              <Calendar className="h-4 w-4 text-fundibots-cyan" />
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          )}
          
          <Badge variant="outline" className="ml-auto border-fundibots-primary text-fundibots-primary">
            {getReportTitle()}
          </Badge>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover-gradient border-l-4 border-l-fundibots-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
            <div className="p-2 bg-fundibots-primary/10 rounded-lg">
              <Package className="h-4 w-4 text-fundibots-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fundibots-primary">{reportData.projectsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover-gradient border-l-4 border-l-fundibots-green">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parts Produced</CardTitle>
            <div className="p-2 bg-fundibots-green/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-fundibots-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fundibots-green">{reportData.totalPartsProduced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover-gradient border-l-4 border-l-fundibots-cyan">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
            <div className="p-2 bg-fundibots-cyan/10 rounded-lg">
              <Users className="h-4 w-4 text-fundibots-cyan" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fundibots-cyan">{reportData.averageEfficiency.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Team performance
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover-gradient border-l-4 border-l-fundibots-yellow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Hours</CardTitle>
            <div className="p-2 bg-fundibots-yellow/10 rounded-lg">
              <Clock className="h-4 w-4 text-fundibots-yellow" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-fundibots-yellow">{formatTime(Math.round(reportData.totalWorkHours * 3600))}</div>
            <p className="text-xs text-muted-foreground">
              Logged time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Production Trend */}
        <Card className="card-hover-gradient">
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
                <Bar yAxisId="left" dataKey="parts" fill="#ef5824" name="Parts Produced" />
                <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#15bddc" name="Efficiency %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Distribution */}
        <Card className="card-hover-gradient">
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
            <CardDescription>Current status of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.projectsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.projectsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {reportData.projectsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={() => ''}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No project data available</p>
                </div>
              </div>
            )}
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
              {reportData.workerPerformance.map((worker, index) => {
                const actualWorker = workers.find(w => w.name === worker.name);
                return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{worker.efficiency.toFixed(1)}%</TableCell>
                  <TableCell>{formatTime(actualWorker?.timeLoggedSeconds || 0)}</TableCell>
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
                );
              })}
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
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          {/* Weekly Reports Content - same as daily */}
          {reportType === 'weekly' && (
            <>
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
                  
                  {(reportType as string) === 'custom' && (
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
                <Card className="card-hover-gradient border-l-4 border-l-fundibots-primary">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
                    <div className="p-2 bg-fundibots-primary/10 rounded-lg">
                      <Package className="h-4 w-4 text-fundibots-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-fundibots-primary">{reportData.projectsCompleted}</div>
                    <p className="text-xs text-muted-foreground">
                      {projects.length} total projects
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-hover-gradient border-l-4 border-l-fundibots-green">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Parts Produced</CardTitle>
                    <div className="p-2 bg-fundibots-green/10 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-fundibots-green" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-fundibots-green">{reportData.totalPartsProduced.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Across all projects
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-hover-gradient border-l-4 border-l-fundibots-cyan">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
                    <div className="p-2 bg-fundibots-cyan/10 rounded-lg">
                      <Users className="h-4 w-4 text-fundibots-cyan" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-fundibots-cyan">{reportData.averageEfficiency.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Team performance
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="card-hover-gradient border-l-4 border-l-fundibots-yellow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Work Hours</CardTitle>
                    <div className="p-2 bg-fundibots-yellow/10 rounded-lg">
                      <Clock className="h-4 w-4 text-fundibots-yellow" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-fundibots-yellow">{formatTime(Math.round(reportData.totalWorkHours * 3600))}</div>
                    <p className="text-xs text-muted-foreground">
                      Logged time
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Production Trend */}
                <Card className="card-hover-gradient">
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
                        <Bar yAxisId="left" dataKey="parts" fill="#ef5824" name="Parts Produced" />
                        <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#15bddc" name="Efficiency %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Project Status Distribution */}
                <Card className="card-hover-gradient">
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
            </>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          {/* Monthly Reports Content */}
          
          {/* Report Controls */}
          <Card className="card-hover-gradient">
            <CardHeader>
              <CardTitle>Monthly Report Configuration</CardTitle>
              <CardDescription>Configure your monthly report parameters</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-fundibots-secondary" />
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
              
              <Badge variant="outline" className="ml-auto border-fundibots-secondary text-fundibots-secondary">
                {getReportTitle()}
              </Badge>
            </CardContent>
          </Card>

          {/* Monthly Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Projects</CardTitle>
                <div className="p-2 bg-fundibots-secondary/10 rounded-lg">
                  <Package className="h-4 w-4 text-fundibots-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-secondary">{reportData.projectsCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  Completed this month
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-yellow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Production</CardTitle>
                <div className="p-2 bg-fundibots-yellow/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-fundibots-yellow" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-yellow">{(reportData.totalPartsProduced * 4).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Parts produced this month
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-green">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Efficiency</CardTitle>
                <div className="p-2 bg-fundibots-green/10 rounded-lg">
                  <Users className="h-4 w-4 text-fundibots-green" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-green">{(reportData.averageEfficiency + 2).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average monthly efficiency
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-cyan">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Hours</CardTitle>
                <div className="p-2 bg-fundibots-cyan/10 rounded-lg">
                  <Clock className="h-4 w-4 text-fundibots-cyan" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-cyan">{(reportData.totalWorkHours * 4).toFixed(0)}h</div>
                <p className="text-xs text-muted-foreground">
                  Total monthly hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="card-hover-gradient">
              <CardHeader>
                <CardTitle>Monthly Production Trend</CardTitle>
                <CardDescription>Weekly production breakdown for the month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { week: 'Week 1', parts: 1200, efficiency: 88 },
                    { week: 'Week 2', parts: 1350, efficiency: 92 },
                    { week: 'Week 3', parts: 1180, efficiency: 85 },
                    { week: 'Week 4', parts: 1420, efficiency: 94 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="parts" fill="#f58220" name="Parts Produced" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-hover-gradient">
              <CardHeader>
                <CardTitle>Monthly Team Performance</CardTitle>
                <CardDescription>Team efficiency trends throughout the month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { week: 'Week 1', efficiency: 88, productivity: 85 },
                    { week: 'Week 2', efficiency: 92, productivity: 90 },
                    { week: 'Week 3', efficiency: 85, productivity: 82 },
                    { week: 'Week 4', efficiency: 94, productivity: 96 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="efficiency" stroke="#9fcc3b" name="Efficiency %" />
                    <Line type="monotone" dataKey="productivity" stroke="#15bddc" name="Productivity %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Summary Table */}
          <Card className="card-hover-gradient">
            <CardHeader>
              <CardTitle>Monthly Project Summary</CardTitle>
              <CardDescription>Detailed breakdown of monthly project performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Monthly Progress</TableHead>
                    <TableHead>Parts Completed</TableHead>
                    <TableHead>Team Efficiency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.slice(0, 5).map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          project.status === 'Completed' ? 'bg-fundibots-green/10 text-fundibots-green border-fundibots-green' :
                          project.status === 'In Progress' ? 'bg-fundibots-cyan/10 text-fundibots-cyan border-fundibots-cyan' :
                          project.status === 'On Hold' ? 'bg-fundibots-yellow/10 text-fundibots-yellow border-fundibots-yellow' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={getProjectProgress(project)} className="h-2 w-20" />
                          <span className="text-sm">{getProjectProgress(project).toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.components.reduce((sum, c) => sum + c.quantityCompleted, 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-fundibots-primary/10 text-fundibots-primary border-fundibots-primary">
                          {(Math.random() * 20 + 80).toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          {/* Custom Reports Content */}
          
          {/* Report Controls */}
          <Card className="card-hover-gradient">
            <CardHeader>
              <CardTitle>Custom Date Range Report</CardTitle>
              <CardDescription>Configure your custom date range and filters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-fundibots-primary" />
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
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-fundibots-cyan" />
                  <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                </div>
                
                <Badge variant="outline" className="ml-auto border-fundibots-primary text-fundibots-primary">
                  {getReportTitle()}
                </Badge>
              </div>
              
              {/* Additional Filters */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Project Status:</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Priority:</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Range Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Range Projects</CardTitle>
                <div className="p-2 bg-fundibots-primary/10 rounded-lg">
                  <Package className="h-4 w-4 text-fundibots-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-primary">{reportData.projectsCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  Projects in date range
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-secondary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Range Production</CardTitle>
                <div className="p-2 bg-fundibots-secondary/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-fundibots-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-secondary">{reportData.totalPartsProduced.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Parts in date range
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-green">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Range Efficiency</CardTitle>
                <div className="p-2 bg-fundibots-green/10 rounded-lg">
                  <Users className="h-4 w-4 text-fundibots-green" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-green">{reportData.averageEfficiency.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average efficiency
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-yellow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Range Hours</CardTitle>
                <div className="p-2 bg-fundibots-yellow/10 rounded-lg">
                  <Clock className="h-4 w-4 text-fundibots-yellow" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-yellow">{formatTime(Math.round(reportData.totalWorkHours * 3600))}</div>
                <p className="text-xs text-muted-foreground">
                  Total hours logged
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Custom Range Analysis */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="card-hover-gradient">
              <CardHeader>
                <CardTitle>Custom Range Trends</CardTitle>
                <CardDescription>Production and efficiency trends for selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.productionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="parts" fill="#ef5824" name="Parts Produced" />
                    <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#15bddc" name="Efficiency %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-hover-gradient">
              <CardHeader>
                <CardTitle>Project Distribution</CardTitle>
                <CardDescription>Project status breakdown for selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.projectsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.projectsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {reportData.projectsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [value, name]}
                        labelFormatter={() => ''}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No project data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Custom Range Detailed Analysis */}
          <Card className="card-hover-gradient">
            <CardHeader>
              <CardTitle>Detailed Analysis for Selected Period</CardTitle>
              <CardDescription>Comprehensive breakdown of performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-3 text-fundibots-primary">Top Performing Projects</h4>
                  <div className="space-y-2">
                    {projects.slice(0, 3).map((project, index) => (
                      <div key={project.id} className="flex items-center justify-between p-2 bg-fundibots-primary/5 rounded-lg">
                        <span className="text-sm font-medium">{project.name}</span>
                        <Badge variant="outline" className="bg-fundibots-green/10 text-fundibots-green border-fundibots-green">
                          {getProjectProgress(project).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-fundibots-secondary">Key Insights</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-fundibots-green rounded-full"></div>
                      <span>Production efficiency increased by 5% in selected period</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-fundibots-cyan rounded-full"></div>
                      <span>Average project completion time: {Math.floor(Math.random() * 10 + 15)} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-fundibots-yellow rounded-full"></div>
                      <span>Peak production hours: 2:00 PM - 4:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Real-time Monitoring Content */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <div className="p-2 bg-fundibots-primary/10 rounded-lg">
                  <Activity className="h-4 w-4 text-fundibots-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-primary">{activeProjects.length}</div>
                <p className="text-xs text-muted-foreground">
                  {projects.length} total projects
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-green">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
                <div className="p-2 bg-fundibots-green/10 rounded-lg">
                  <Users className="h-4 w-4 text-fundibots-green" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-green">{activeWorkers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {workers.length} total workers
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-cyan">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parts Completed Today</CardTitle>
                <div className="p-2 bg-fundibots-cyan/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-fundibots-cyan" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-cyan">{totalPartsToday.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all projects
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-hover-gradient border-l-4 border-l-fundibots-yellow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Deadlines</CardTitle>
                <div className="p-2 bg-fundibots-yellow/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-fundibots-yellow" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-fundibots-yellow">{urgentProjects.length}</div>
                <p className="text-xs text-muted-foreground">
                  Due within 3 days
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Production Rate Chart */}
            <Card className="card-hover-gradient">
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
                      stroke="#ef5824" 
                      strokeWidth={2}
                      dot={{ fill: "#ef5824" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Machine Utilization */}
            <Card className="card-hover-gradient">
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
                    <Bar dataKey="utilization" fill="#f58220" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Active Work Sessions */}
            <Card className="lg:col-span-2 card-hover-gradient">
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
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border-2 border-fundibots-primary/20">
                                  <AvatarFallback className="bg-gradient-to-br from-fundibots-green to-fundibots-cyan text-white font-semibold text-xs">
                                    {(() => {
                                      const names = worker.name.trim().split(' ').filter(n => n.length > 0);
                                      if (names.length === 0) return "W";
                                      if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
                                      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                                    })()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900">{worker.name}</div>
                                  <div className="text-xs text-fundibots-primary">Active Worker</div>
                                </div>
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
                              <Badge className="bg-fundibots-green text-white">
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
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
            <Card className="card-hover-gradient">
              <CardHeader>
                <CardTitle>Bottlenecks & Alerts</CardTitle>
                <CardDescription>Projects requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bottlenecks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-fundibots-green" />
                    <p>All projects on track!</p>
                  </div>
                ) : (
                  bottlenecks.map((project) => (
                    <div key={project.id} className="flex items-start gap-3 p-3 border border-fundibots-yellow/20 rounded-lg bg-fundibots-yellow/5">
                      <AlertTriangle className="h-4 w-4 text-fundibots-yellow mt-0.5" />
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
                  <div className="border-t border-fundibots-primary/20 pt-4">
                    <h4 className="font-medium text-fundibots-primary mb-2">Urgent Deadlines</h4>
                    {urgentProjects.map((project) => (
                      <div key={project.id} className="flex items-center gap-2 text-sm mb-1 p-2 bg-fundibots-primary/5 rounded">
                        <div className="h-2 w-2 bg-fundibots-primary rounded-full" />
                        <span>{project.name}</span>
                        <Badge className="ml-auto text-xs bg-fundibots-primary text-white">
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
          <Card className="card-hover-gradient">
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
                  {machineData.map((machine) => (
                    <TableRow key={machine.machineId}>
                      <TableCell className="font-medium">{machine.machineName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-fundibots-cyan text-fundibots-cyan">{machine.type}</Badge>
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
                          className={machine.utilizationPercentage > 80 
                            ? "bg-fundibots-green text-white" 
                            : "bg-fundibots-yellow text-gray-800"
                          }
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
        </TabsContent>
      </Tabs>
    </div>
  );
}