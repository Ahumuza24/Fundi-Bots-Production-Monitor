import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ProjectPrioritizer, WorkerMatcher, ProjectComparer } from "@/components/dashboard/ai-optimizer-client";

export default function AIOptimizerPage() {
  return (
    <div className="flex flex-col gap-4">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">AI Optimizer</h1>
        <p className="text-muted-foreground">
          Use generative AI to optimize your production planning and analyze performance.
        </p>
      </div>
      <Tabs defaultValue="priority" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="priority">Project Priority</TabsTrigger>
          <TabsTrigger value="worker-matching">Worker Matching</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="priority">
          <ProjectPrioritizer />
        </TabsContent>
        <TabsContent value="worker-matching">
          <WorkerMatcher />
        </TabsContent>
        <TabsContent value="analytics">
          <ProjectComparer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
