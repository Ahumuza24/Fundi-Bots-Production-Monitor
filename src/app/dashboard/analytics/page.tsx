
import { ProjectComparer } from "@/components/dashboard/ai-optimizer-client";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">Analytics</h1>
        <p className="text-muted-foreground">
          Analyze project performance and gain insights.
        </p>
      </div>
      <ProjectComparer />
    </div>
  )
}
