import type { Project, Worker } from './types';

export const workers: Omit<Worker, 'id'>[] = [
  { name: 'Alice Johnson', email: 'alice.johnson@fundibots.com', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', skills: ['Soldering', 'Final Assembly', 'QA Testing'], availability: '40 hours/week', pastPerformance: 0.98, timeLoggedSeconds: 144000, activeProjectId: null },
  { name: 'Bob Williams', email: 'bob.williams@fundibots.com', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', skills: ['Circuit Board Assembly', 'Wiring'], availability: '30 hours/week', pastPerformance: 0.92, timeLoggedSeconds: 108000, activeProjectId: null },
  { name: 'Charlie Brown', email: 'charlie.brown@fundibots.com', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', skills: ['Soldering', 'Mechanical Assembly'], availability: '40 hours/week', pastPerformance: 0.95, timeLoggedSeconds: 172800, activeProjectId: null },
  { name: 'Diana Prince', email: 'diana.prince@fundibots.com', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026707d', skills: ['Final Assembly', 'Packaging'], availability: '20 hours/week', pastPerformance: 0.99, timeLoggedSeconds: 86400, activeProjectId: null },
];

export const projects: Omit<Project, 'id'>[] = [
  {
    name: 'Model-X Circuit Board',
    quantity: 100,
    description: 'Assemble main circuit board for the Model-X drone. Requires precision soldering and component placement.',
    imageUrl: 'https://placehold.co/600x400.png',
    documentationUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihNb2RlbC1YIERvY3VtZW50YXRpb24pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMjIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MTYKJSVFT0Y=',
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    status: 'In Progress',
    assignedWorkerIds: [],
    priority: 'High',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      { id: 'C01', name: 'Microcontroller', quantityRequired: 100, quantityCompleted: 50, availableProcesses: ['Assembly'], completedProcesses: [] },
      { id: 'C02', name: 'Resistor Pack', quantityRequired: 500, quantityCompleted: 350, availableProcesses: ['Soldering'], completedProcesses: [] },
      { id: 'C03', name: 'Capacitor Kit', quantityRequired: 300, quantityCompleted: 120, availableProcesses: ['Assembly'], completedProcesses: [] },
    ]
  },
  {
    name: 'Guardian Security Bot - Chassis',
    quantity: 50,
    description: 'Mechanical assembly of the main chassis for the Guardian Security Bot.',
    imageUrl: 'https://placehold.co/600x400.png',
    documentationUrl: '#',
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    status: 'Not Started',
    assignedWorkerIds: [],
    priority: 'Medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      { id: 'C04', name: 'Frame', quantityRequired: 50, quantityCompleted: 0, availableProcesses: ['Mechanical Assembly'], completedProcesses: [] },
      { id: 'C05', name: 'Armor Plating', quantityRequired: 200, quantityCompleted: 0, availableProcesses: ['CNC Cutting'], completedProcesses: [] },
      { id: 'C06', name: 'Wheel Assembly', quantityRequired: 200, quantityCompleted: 0, availableProcesses: ['Assembly'], completedProcesses: [] },
    ]
  },
  {
    name: 'AudioPhonic-9000 Speakers',
    quantity: 200,
    description: 'Final assembly and QA testing for the high-end AudioPhonic-9000 speaker system.',
    imageUrl: 'https://placehold.co/600x400.png',
    documentationUrl: '#',
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    status: 'In Progress',
    assignedWorkerIds: [],
    priority: 'Critical',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
      { id: 'C07', name: 'Speaker Cone', quantityRequired: 400, quantityCompleted: 380, availableProcesses: ['Assembly'], completedProcesses: [] },
      { id: 'C08', name: 'Amplifier Unit', quantityRequired: 200, quantityCompleted: 190, availableProcesses: ['Soldering'], completedProcesses: [] },
      { id: 'C09', name: 'Housing', quantityRequired: 200, quantityCompleted: 200, availableProcesses: ['Final Assembly'], completedProcesses: ['Final Assembly'] },
    ]
  },
  {
    name: 'Project Phoenix',
    quantity: 1,
    description: 'Top-secret R&D project. High-level clearance required.',
    imageUrl: 'https://placehold.co/600x400.png',
    deadline: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString(),
    status: 'On Hold',
    assignedWorkerIds: [],
    priority: 'Low',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    components: [
        { id: 'C10', name: 'Core Fusion Reactor', quantityRequired: 1, quantityCompleted: 0, availableProcesses: ['Advanced Assembly'], completedProcesses: []},
    ]
  }
];
