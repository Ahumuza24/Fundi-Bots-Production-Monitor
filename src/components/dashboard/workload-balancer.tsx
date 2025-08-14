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
  DialogFooter,
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
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Scale, Users, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Project, Worker } from "@/lib/types";

interface WorkloadData {
  workerId: string;
  workerName: string;
  assignedProjects: number;
  totalWorkload: number;
  efficiency: number;
  availability: string;
  currentUtilization: number;
}

interface WorkloadBalancerProps {
  onBalanceComplete?: () => void;
}

export function WorkloadBalancer({ onBalanceComplete }: WorkloadBalancerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBalancing, setIsBalancing] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      const workersUnsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
        const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
        setWorkers(workersData);
        setLoading(false);
      });

      const projectsUnsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
        setProjects(projectsData.filter(p => p.status === 'In Progress' || p.status === 'Not Started'));
        setLoading(false);
      });

      return () => {
        workersUnsubscribe();
        projectsUnsubscribe();
      };
    }
  }, [open]);

  const calculateWorkloadData = (): WorkloadData[] => {
    return workers.map(worker => {
      const assignedProjects = projects.filter(p => p.assignedWorkerIds?.includes(worker.id));
      const totalWorkload = assignedProjects.reduce((sum, project) => {
        const totalComponents = project.components.reduce((compSum, c) => compSum + c.quantityRequired, 0);
        return sum + totalComponents;
      }, 0);

      // Parse availability (e.g., "40 hours/week" -> 40)
      const availabilityHours = parseInt(worker.availability.split(' ')[0]) || 40;
      const currentUtilization = Math.min((assignedProjects.length * 20) / availabilityHours * 100, 100); // rough calculation

      return {
        workerId: worker.id,
        workerName: worker.name,
        assignedProjects: assignedProjects.length,
        totalWorkload,
        efficiency: (worker.pastPerformance || 0) * 100,
        availability: worker.availability,
        currentUtilization,
      };
    });
  };

  const workloadData = calculateWorkloadData();
  const chartData = workloadData.map(w => ({
    name: w.workerName.split(' ')[0], // First name only for chart
    workload: w.totalWorkload,
    utilization: w.currentUtilization,
  }));

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 90) return 'bg-red-100 text-red-800';
    if (utilization > 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getUtilizationStatus = (utilization: number) => {
    if (utilization > 90) return 'Overloaded';
    if (utilization > 70) return 'Busy';
    if (utilization > 40) return 'Optimal';
    return 'Underutilized';
  };

  const handleAutoBalance = async () => {
    setIsBalancing(true);
    try {
      const batch = writeBatch(db);
      
      // Simple auto-balancing algorithm
      const overloadedWorkers = workloadData.filter(w => w.currentUtilization > 80);
      const underutilizedWorkers = workloadData.filter(w => w.currentUtilization < 50);
      
      if (overloadedWorkers.length === 0) {
        toast({
          title: "No Rebalancing Needed",
          description: "All workers have balanced workloads.",
        });
        setIsBalancing(false);
        return;
      }

      // Redistribute projects from overloaded to underutilized workers
      for (const overloadedWorker of overloadedWorkers) {
        const workerProjects = projects.filter(p => p.assignedWorkerIds?.includes(overloadedWorker.workerId));
        const projectsToReassign = workerProjects.slice(0, Math.ceil(workerProjects.length * 0.3)); // Reassign 30%
        
        for (const project of projectsToReassign) {
          // Find best underutilized worker based on skills and availability
          const bestWorker = underutilizedWorkers
            .sort((a, b) => a.currentUtilization - b.currentUtilization)[0];
          
          if (bestWorker) {
            const projectRef = doc(db, "projects", project.id);
            const newAssignedWorkers = project.assignedWorkerIds?.filter(id => id !== overloadedWorker.workerId) || [];
            newAssignedWorkers.push(bestWorker.workerId);
            
            batch.update(projectRef, {
              assignedWorkerIds: newAssignedWorkers,
              updatedAt: new Date().toISOString(),
            });
            
            // Update utilization for next iteration
            bestWorker.currentUtilization += 20; // rough estimate
          }
        }
      }

      await batch.commit();

      toast({
        title: "Workload Balanced",
        description: "Projects have been redistributed to balance workloads.",
      });
      
      onBalanceComplete?.();
      setOpen(false);

    } catch (error) {
      console.error("Error balancing workload:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to balance workloads. Please try again.",
      });
    } finally {
      setIsBalancing(false);
    }
  };

  const handleManualReassign = async () => {
    if (selectedProjects.length === 0) {
      toast({
        variant: "destructive",
        title: "No Projects Selected",
        description: "Please select projects to reassign.",
      });
      return;
    }

    // This would open another dialog for manual reassignment
    toast({
      title: "Manual Reassignment",
      description: "Manual reassignment feature would be implemented here.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Scale className="h-4 w-4 mr-2" />
          Balance Workload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workload Balancer</DialogTitle>
          <DialogDescription>
            Analyze and redistribute workloads across your team for optimal efficiency.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Workload Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Workload Distribution</CardTitle>
                <CardDescription>Current workload and utilization across all workers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="workload" fill="hsl(var(--primary))" name="Total Workload" />
                    <Bar yAxisId="right" dataKey="utilization" fill="#ff7300" name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Worker Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Worker Utilization Details</CardTitle>
                <CardDescription>Detailed breakdown of each worker's current workload</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Total Workload</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Efficiency</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workloadData.map((worker) => (
                      <TableRow key={worker.workerId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border-2 border-fundibots-cyan/20">
                              <AvatarFallback className="bg-gradient-to-br from-fundibots-cyan to-fundibots-green text-white font-semibold text-xs">
                                {(() => {
                                  const names = worker.workerName.trim().split(' ').filter(n => n.length > 0);
                                  if (names.length === 0) return "W";
                                  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
                                  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                                })()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{worker.workerName}</div>
                              <div className="text-sm text-fundibots-cyan font-medium">{worker.availability}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{worker.assignedProjects}</TableCell>
                        <TableCell>{worker.totalWorkload.toLocaleString()} parts</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={worker.currentUtilization} className="h-2 w-20" />
                            <span className="text-sm">{worker.currentUtilization.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{worker.efficiency.toFixed(0)}%</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getUtilizationColor(worker.currentUtilization)}>
                            {getUtilizationStatus(worker.currentUtilization)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workloadData.filter(w => w.currentUtilization > 80).length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <div className="h-2 w-2 bg-orange-500 rounded-full" />
                      <span>
                        {workloadData.filter(w => w.currentUtilization > 80).length} worker(s) are overloaded
                      </span>
                    </div>
                  )}
                  {workloadData.filter(w => w.currentUtilization < 40).length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      <span>
                        {workloadData.filter(w => w.currentUtilization < 40).length} worker(s) are underutilized
                      </span>
                    </div>
                  )}
                  {workloadData.every(w => w.currentUtilization >= 40 && w.currentUtilization <= 80) && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <div className="h-2 w-2 bg-green-500 rounded-full" />
                      <span>All workers have balanced workloads</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Selection for Manual Reassignment */}
            <Card>
              <CardHeader>
                <CardTitle>Manual Reassignment</CardTitle>
                <CardDescription>Select projects to manually reassign to different workers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={project.id}
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjects([...selectedProjects, project.id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                          }
                        }}
                      />
                      <label htmlFor={project.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {project.name} ({project.assignedWorkerIds?.length || 0} workers assigned)
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleManualReassign} disabled={selectedProjects.length === 0}>
            <Users className="h-4 w-4 mr-2" />
            Manual Reassign ({selectedProjects.length})
          </Button>
          <Button onClick={handleAutoBalance} disabled={isBalancing}>
            {isBalancing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Scale className="h-4 w-4 mr-2" />
            Auto Balance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}