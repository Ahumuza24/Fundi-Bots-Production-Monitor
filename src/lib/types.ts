export interface ComponentSpec {
  id: string;
  name: string;
  quantityRequired: number;
  quantityCompleted: number;
}

export interface Project {
  id: string;
  name:string;
  quantity: number;
  description: string;
  imageUrl: string;
  documentationUrl?: string;
  components: ComponentSpec[];
  deadline: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  assignedWorkerIds: string[];
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  skills: string[];
  availability: string; // e.g., "40 hours/week"
  pastPerformance: number; // e.g., 0.95 for 95%
  timeLoggedSeconds: number;
  status?: 'Active' | 'Inactive';
  activeProjectId?: string | null;
}

export interface WorkSession {
  id: string;
  workerId: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  completedComponents: { componentId: string, quantity: number }[];
}

export interface Notification {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}
