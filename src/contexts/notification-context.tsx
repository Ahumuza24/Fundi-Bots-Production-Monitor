'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  notifyProjectCreatedToAssemblers,
  notifyProjectAssignedToAssembler,
  notifyWorkSessionCompleted,
  notifyProjectDeadlineApproaching,
  notifyNewAnnouncement
} from '@/lib/notification-triggers';

interface NotificationContextType {
  // Real-time workflow functions
  notifyProjectCreatedToAssemblers: (projectName: string, projectId: string) => Promise<void>;
  notifyProjectAssignedToAssembler: (assemblerId: string, assemblerName: string, projectName: string, projectId: string) => Promise<void>;
  notifyWorkSessionCompleted: (projectLeadId: string, assemblerName: string, projectName: string, projectId: string, workSessionDetails: any) => Promise<void>;
  notifyProjectDeadlineApproaching: (projectId: string, projectName: string, daysUntilDeadline: number, currentProgress?: number) => Promise<void>;
  notifyNewAnnouncement: (announcementId: string, announcementTitle: string, announcementContent: string, targetAudience?: 'all' | 'assemblers' | 'leads') => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Real-time workflow handlers
  const handleNotifyProjectCreatedToAssemblers = useCallback(async (projectName: string, projectId: string) => {
    if (!user?.uid) return;
    try {
      await notifyProjectCreatedToAssemblers(projectName, projectId, user.uid);
    } catch (error) {
      console.error('Failed to notify assemblers about new project:', error);
    }
  }, [user?.uid]);

  const handleNotifyProjectAssignedToAssembler = useCallback(async (
    assemblerId: string, 
    assemblerName: string, 
    projectName: string, 
    projectId: string
  ) => {
    if (!user?.uid) return;
    try {
      await notifyProjectAssignedToAssembler(assemblerId, assemblerName, projectName, projectId, user.uid);
    } catch (error) {
      console.error('Failed to notify assembler about project assignment:', error);
    }
  }, [user?.uid]);

  const handleNotifyWorkSessionCompleted = useCallback(async (
    projectLeadId: string,
    assemblerName: string,
    projectName: string,
    projectId: string,
    workSessionDetails: any
  ) => {
    try {
      await notifyWorkSessionCompleted(projectLeadId, assemblerName, projectName, projectId, workSessionDetails);
    } catch (error) {
      console.error('Failed to notify project lead about work session completion:', error);
    }
  }, []);

  const handleNotifyProjectDeadlineApproaching = useCallback(async (
    projectId: string,
    projectName: string,
    daysUntilDeadline: number,
    currentProgress: number = 0
  ) => {
    try {
      await notifyProjectDeadlineApproaching(projectId, projectName, daysUntilDeadline, currentProgress);
    } catch (error) {
      console.error('Failed to notify about approaching deadline:', error);
    }
  }, []);

  const handleNotifyNewAnnouncement = useCallback(async (
    announcementId: string,
    announcementTitle: string,
    announcementContent: string,
    targetAudience: 'all' | 'assemblers' | 'leads' = 'all'
  ) => {
    if (!user?.uid) return;
    try {
      await notifyNewAnnouncement(announcementId, announcementTitle, announcementContent, user.uid, targetAudience);
    } catch (error) {
      console.error('Failed to notify about new announcement:', error);
    }
  }, [user?.uid]);

  const value: NotificationContextType = {
    // Real-time workflow functions
    notifyProjectCreatedToAssemblers: handleNotifyProjectCreatedToAssemblers,
    notifyProjectAssignedToAssembler: handleNotifyProjectAssignedToAssembler,
    notifyWorkSessionCompleted: handleNotifyWorkSessionCompleted,
    notifyProjectDeadlineApproaching: handleNotifyProjectDeadlineApproaching,
    notifyNewAnnouncement: handleNotifyNewAnnouncement,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationActions() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationActions must be used within a NotificationProvider');
  }
  return context;
}