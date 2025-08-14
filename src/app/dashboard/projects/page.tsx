import Image from "next/image"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { projects } from "@/lib/mock-data"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog"
import { format } from "date-fns"

function getProjectProgress(project: typeof projects[0]) {
  const total = project.components.reduce((sum, c) => sum + c.quantityRequired, 0);
  if (total === 0) return 0;
  const completed = project.components.reduce((sum, c) => sum + c.quantityCompleted, 0);
  return (completed / total) * 100;
}

export default function ProjectsPage() {
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="on-hold" className="hidden sm:flex">
            On Hold
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <CreateProjectDialog />
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>
              Manage your projects and view their progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Due Date
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        alt={project.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={project.imageUrl}
                        width="64"
                        data-ai-hint="circuit board"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <Badge variant={project.status === "Completed" ? "default" : "outline"} className={
                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'On Hold' ? 'bg-yellow-100 text-yellow-800' :
                        project.status === 'Completed' ? 'bg-green-100 text-green-800' : ''
                      }>{project.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={getProjectProgress(project)} aria-label={`${getProjectProgress(project).toFixed(0)}% complete`} />
                        <span className="text-muted-foreground text-xs">{getProjectProgress(project).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                       {format(new Date(project.deadline), "PPP")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{projects.length}</strong> of <strong>{projects.length}</strong>{" "}
              projects
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
