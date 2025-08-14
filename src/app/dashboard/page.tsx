"use client"
import { Activity, ArrowUpRight, CheckCircle, Package, Users, Hourglass, GanttChartSquare } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import Link from "next/link"
import { projects, workers } from "@/lib/mock-data"

const chartData = projects.map(p => ({
  name: p.name.split(' ')[0],
  total: p.components.reduce((acc, c) => acc + c.quantityRequired, 0),
  completed: p.components.reduce((acc, c) => acc + c.quantityCompleted, 0),
}));

export default function Dashboard() {
  const projectsInProgress = projects.filter(p => p.status === 'In Progress').length;
  const totalUnitsCompleted = projects.flatMap(p => p.components).reduce((sum, c) => sum + c.quantityCompleted, 0);
  const totalUnits = projects.flatMap(p => p.components).reduce((sum, c) => sum + c.quantityRequired, 0);
  const teamProductivity = totalUnits > 0 ? ((totalUnitsCompleted / totalUnits) * 100).toFixed(0) : 0;


  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projects In Progress
            </CardTitle>
            <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsInProgress}</div>
            <p className="text-xs text-muted-foreground">
              {projects.length} total projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Units
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnitsCompleted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              out of {totalUnits.toLocaleString()} total units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamProductivity}%</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Deadlines</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => new Date(p.deadline).getTime() < new Date().getTime() + 7 * 24 * 60 * 60 * 1000).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Projects due within 7 days
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Project Completion Progress</CardTitle>
            <CardDescription>
              An overview of units completed vs. total units required for each project.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{fill: 'hsl(var(--muted))'}}
                  contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}}
                />
                <Bar dataKey="completed" fill="hsl(var(--primary))" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="hsl(var(--primary))" fillOpacity={0.2} name="Total" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Assembler Activity</CardTitle>
              <CardDescription>
                Updates on the latest work sessions.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/dashboard/work-sessions">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assembler</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={workers[0].avatarUrl} alt="Avatar" />
                        <AvatarFallback>AJ</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{workers[0].name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {projects[0].name}
                  </TableCell>
                  <TableCell className="text-right">
                    15 min ago
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={workers[1].avatarUrl} alt="Avatar" />
                        <AvatarFallback>BW</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{workers[1].name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {projects[2].name}
                  </TableCell>
                  <TableCell className="text-right">
                    45 min ago
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={workers[2].avatarUrl} alt="Avatar" />
                        <AvatarFallback>CB</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{workers[2].name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {projects[0].name}
                  </TableCell>
                  <TableCell className="text-right">
                    2 hours ago
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={workers[3].avatarUrl} alt="Avatar" />
                        <AvatarFallback>DP</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{workers[3].name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {projects[2].name}
                  </TableCell>
                   <TableCell className="text-right">
                    5 hours ago
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
