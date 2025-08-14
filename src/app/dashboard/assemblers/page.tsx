
"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { Worker } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssemblersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWorkers = useCallback(() => {
    setLoading(true);
    const workersCollection = collection(db, "workers");
    const unsubscribe = onSnapshot(workersCollection, (snapshot) => {
      const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
      setWorkers(workersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching workers: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch worker data from Firestore.",
      });
      setLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchWorkers();
    return () => unsubscribe();
  }, [fetchWorkers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assemblers</CardTitle>
        <CardDescription>
          An overview of all assemblers in your team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead className="hidden md:table-cell">Availability</TableHead>
              <TableHead className="hidden sm:table-cell">Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : (
              workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={worker.avatarUrl} alt={worker.name} />
                        <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{worker.name}</div>
                        <div className="text-sm text-muted-foreground">{worker.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.map(skill => (
                        <Badge key={skill} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{worker.availability}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={worker.pastPerformance > 0.95 ? "default" : "secondary"}>
                      {(worker.pastPerformance * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
