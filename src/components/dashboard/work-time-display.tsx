"use client";

import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkTimeDisplayProps {
  timeLoggedSeconds: number;
  className?: string;
  showIcon?: boolean;
}

export function WorkTimeDisplay({ timeLoggedSeconds, className, showIcon = true }: WorkTimeDisplayProps) {
  const formatTime = (seconds: number = 0) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes}m`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const formatDetailedTime = (seconds: number = 0) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours === 0 && minutes === 0) {
      return `${remainingSeconds} seconds`;
    }
    
    if (hours === 0) {
      return `${minutes} minutes, ${remainingSeconds} seconds`;
    }
    
    return `${hours} hours, ${minutes} minutes`;
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {showIcon && <Clock className="h-4 w-4 text-muted-foreground" />}
        <span className="font-medium">{formatTime(timeLoggedSeconds)}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {formatDetailedTime(timeLoggedSeconds)} total
      </div>
    </div>
  );
}

export function WorkTimeCard({ timeLoggedSeconds, title = "Time Logged" }: { timeLoggedSeconds: number; title?: string }) {
  const formatTime = (seconds: number = 0) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return { hours, minutes };
  };

  const { hours, minutes } = formatTime(timeLoggedSeconds);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
        </div>
        <p className="text-xs text-muted-foreground">
          {timeLoggedSeconds > 0 ? `${Math.floor(timeLoggedSeconds / 3600)} hours total` : 'No time logged yet'}
        </p>
      </CardContent>
    </Card>
  );
}