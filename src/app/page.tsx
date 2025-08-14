import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Cpu, GanttChartSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-2xl font-bold text-primary">FundiFlow</h1>
      </header>
      <main className="flex-grow">
        <section className="text-center py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-4 font-headline">
              Streamline Your Assembly Line
            </h2>
            <p className="max-w-3xl mx-auto text-lg lg:text-xl text-muted-foreground mb-8">
              From project creation to final assembly, manage your entire workflow with real-time tracking and AI-powered optimization.
            </p>
            <Button asChild size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </section>

        <section className="py-20 lg:py-24 bg-card">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <GanttChartSquare className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">Project Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Create and manage projects with detailed specifications, documentation, and component lists.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <CardTitle>Real-Time Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Monitor progress live with dynamic indicators for components and overall project status.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <CardTitle>AI Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Leverage AI to prioritize projects and assign the best workers for timely completion.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        © {new Date().getFullYear()} FundiFlow. All rights reserved.
      </footer>
    </div>
  );
}
