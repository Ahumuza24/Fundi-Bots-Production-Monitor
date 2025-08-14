import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { notifications } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

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
