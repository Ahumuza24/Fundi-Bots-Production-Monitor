import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Bell, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import type { Notification } from '@/lib/types';


const notifications: Notification[] = [
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


export default function NotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Here are your recent updates and alerts.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
          >
            <span className={cn(
                "flex h-2 w-2 translate-y-1 rounded-full",
                !notification.read && "bg-accent"
            )} />
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <notification.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium leading-none">
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground ml-auto">
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {notification.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
