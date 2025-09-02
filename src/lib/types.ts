export interface ComponentSpec {
  id: string;
  name: string;
  quantityRequired: number;
  quantityCompleted: number;
  availableProcesses: string[]; // Processes that can be performed on this component
  completedProcesses: string[]; // Processes that have been completed
  imageUrl?: string;
  estimatedTimePerUnit?: number; // in minutes
}

export interface Project {
  id: string;
  name: string;
  quantity: number;
  description: string;
  imageUrl: string;
  documentationUrl?: string;
  components: ComponentSpec[];
  deadline: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Archived';
  assignedWorkerIds: string[];
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  processSequence?: string[]; // ordered list of processes
  createdAt: string;
  updatedAt: string;
  templateId?: string; // if created from template
  comments?: ProjectComment[];
  attachments?: ProjectAttachment[];
}

export interface ProjectComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  components: Omit<ComponentSpec, 'id' | 'quantityRequired' | 'quantityCompleted' | 'availableProcesses' | 'completedProcesses'>[];
  processSequence?: string[];
  estimatedDuration?: number; // in days
  createdAt: string;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  skills: string[];
  availability: string; // e.g., "40 hours/week"
  pastPerformance: number; // e.g., 0.95 for 95%
  timeLoggedSeconds: number;
  activeProjectId?: string | null;
}

export interface WorkSession {
  id: string;
  workerId: string;
  projectId: string;
  componentId?: string;
  process?: string;
  startTime: Date;
  endTime?: Date;
  completedComponents: { componentId: string, quantity: number }[];
  qualityRating?: 'Good' | 'Needs Rework' | 'Defective';
  notes?: string;
  breakTimeSeconds?: number;
}

export interface ProductionMetrics {
  projectId: string;
  workerId: string;
  date: string;
  partsCompleted: number;
  timeSpentMinutes: number;
  efficiency: number; // parts per hour
  qualityScore: number;
}

export interface MachineUtilization {
  machineId: string;
  machineName: string;
  type: 'CNC' | 'Laser' | 'Assembly Station' | 'Other';
  utilizationPercentage: number;
  activeTime: number;
  downTime: number;
  lastMaintenance?: string;
}

export interface Notification {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}
