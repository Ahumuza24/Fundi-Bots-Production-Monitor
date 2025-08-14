import type { Project, Worker } from './types';

export const workers: Omit<Worker, 'id' | 'email' | 'timeLoggedSeconds'>[] = [
  { name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', skills: ['Soldering', 'Final Assembly', 'QA Testing'], availability: '40 hours/week', pastPerformance: 0.98 },
  { name: 'Bob Williams', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', skills: ['Circuit Board Assembly', 'Wiring'], availability: '30 hours/week', pastPerformance: 0.92 },
  { name: 'Charlie Brown', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', skills: ['Soldering', 'Mechanical Assembly'], availability: '40 hours/week', pastPerformance: 0.95 },
  { name: 'Diana Prince', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026707d', skills: ['Final Assembly', 'Packaging'], availability: '20 hours/week', pastPerformance: 0.99 },
];

export const projects: Omit<Project, 'id'>[] = [
  {
    name: 'Model-X Circuit Board',
    quantity: 100,
    description: 'Assemble main circuit board for the Model-X drone. Requires precision soldering and component placement.',
    imageUrl: 'https://placehold.co/600x400.png',
    documentationUrl: '#',
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    status: 'In Progress',
    assignedWorkerIds: [],
    components: [
      { id: 'C01', name: 'Microcontroller', quantityRequired: 100, quantityCompleted: 50 },
      { id: 'C02', name: 'Resistor Pack', quantityRequired: 500, quantityCompleted: 350 },
      { id: 'C03', name: 'Capacitor Kit', quantityRequired: 300, quantityCompleted: 120 },
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
    components: [
      { id: 'C04', name: 'Frame', quantityRequired: 50, quantityCompleted: 0 },
      { id: 'C05', name: 'Armor Plating', quantityRequired: 200, quantityCompleted: 0 },
      { id: 'C06', name: 'Wheel Assembly', quantityRequired: 200, quantityCompleted: 0 },
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
    components: [
      { id: 'C07', name: 'Speaker Cone', quantityRequired: 400, quantityCompleted: 380 },
      { id: 'C08', name: 'Amplifier Unit', quantityRequired: 200, quantityCompleted: 190 },
      { id: 'C09', name: 'Housing', quantityRequired: 200, quantityCompleted: 200 },
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
    components: [
        { id: 'C10', name: 'Core Fusion Reactor', quantityRequired: 1, quantityCompleted: 0},
    ]
  }
];
