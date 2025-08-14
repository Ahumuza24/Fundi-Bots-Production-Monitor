import type { Project, Worker, Notification } from './types';
import { Bell, CheckCircle, Package, AlertTriangle } from 'lucide-react';

export const workers: Worker[] = [
  { id: 'W001', name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', skills: ['Soldering', 'Final Assembly', 'QA Testing'], availability: '40 hours/week', pastPerformance: 0.98 },
  { id: 'W002', name: 'Bob Williams', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', skills: ['Circuit Board Assembly', 'Wiring'], availability: '30 hours/week', pastPerformance: 0.92 },
  { id: 'W003', name: 'Charlie Brown', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', skills: ['Soldering', 'Mechanical Assembly'], availability: '40 hours/week', pastPerformance: 0.95 },
  { id: 'W004', name: 'Diana Prince', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026707d', skills: ['Final Assembly', 'Packaging'], availability: '20 hours/week', pastPerformance: 0.99 },
];

export const projects: Project[] = [
  {
    id: 'P001',
    name: 'Model-X Circuit Board',
    quantity: 100,
    description: 'Assemble main circuit board for the Model-X drone. Requires precision soldering and component placement.',
    imageUrl: 'https://placehold.co/600x400.png',
    documentationUrl: '#',
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    status: 'In Progress',
    components: [
      { id: 'C01', name: 'Microcontroller', quantityRequired: 100, quantityCompleted: 50 },
      { id: 'C02', name: 'Resistor Pack', quantityRequired: 500, quantityCompleted: 350 },
      { id: 'C03', name: 'Capacitor Kit', quantityRequired: 300, quantityCompleted: 120 },
    ]
  },
  {
    id: 'P002',
    name: 'Guardian Security Bot - Chassis',
    quantity: 50,
    description: 'Mechanical assembly of the main chassis for the Guardian Security Bot.',
    imageUrl: 'https://placehold.co/600x400.png',
    documentationUrl: '#',
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    status: 'Not Started',
    components: [
      { id: 'C04', name: 'Frame', quantityRequired: 50, quantityCompleted: 0 },
      { id: 'C05', name: 'Armor Plating', quantityRequired: 200, quantityCompleted: 0 },
      { id: 'C06', name: 'Wheel Assembly', quantityRequired: 200, quantityCompleted: 0 },
    ]
  },
  {
    id: 'P003',
    name: 'AudioPhonic-9000 Speakers',
    quantity: 200,
    description: 'Final assembly and QA testing for the high-end AudioPhonic-9000 speaker system.',
    imageUrl: 'https://placehold.co/600x400.png',
    documentationUrl: '#',
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    status: 'In Progress',
    components: [
      { id: 'C07', name: 'Speaker Cone', quantityRequired: 400, quantityCompleted: 380 },
      { id: 'C08', name: 'Amplifier Unit', quantityRequired: 200, quantityCompleted: 190 },
      { id: 'C09', name: 'Housing', quantityRequired: 200, quantityCompleted: 200 },
    ]
  },
  {
    id: 'P004',
    name: 'Project Phoenix',
    quantity: 1,
    description: 'Top-secret R&D project. High-level clearance required.',
    imageUrl: 'https://placehold.co/600x400.png',
    deadline: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString(),
    status: 'On Hold',
    components: [
        { id: 'C10', name: 'Core Fusion Reactor', quantityRequired: 1, quantityCompleted: 0},
    ]
  }
];


export const notifications: Notification[] = [
  {
    id: 'N001',
    icon: CheckCircle,
    title: 'Project Completed: AudioPhonic-9000',
    description: 'All components have been assembled and tested. Ready for shipping.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    read: false,
  },
  {
    id: 'N002',
    icon: Package,
    title: 'New Project Assigned: Guardian Bot Chassis',
    description: 'Production for 50 units has been scheduled. Work can now begin.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
  },
  {
    id: 'N003',
    icon: AlertTriangle,
    title: 'Component Shortage: Resistor Pack',
    description: 'Low stock on Resistor Packs for Model-X Circuit Board. Please re-order.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    read: true,
  },
  {
    id: 'N004',
    icon: Bell,
    title: 'Weekly Summary Ready',
    description: 'Your weekly production summary for the period is now available in Analytics.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
];
