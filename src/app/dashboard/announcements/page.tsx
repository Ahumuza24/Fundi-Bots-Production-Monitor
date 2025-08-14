"use client"
import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Megaphone, Plus, Calendar, User, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, addDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  targetAudience: 'All' | 'Admins' | 'Assemblers';
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
}

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required.").max(100, "Title too long."),
  content: z.string().min(1, "Content is required.").max(1000, "Content too long."),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  targetAudience: z.enum(["All", "Admins", "Assemblers"]),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      priority: "Medium",
      targetAudience: "All",
    },
  });

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const announcementsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Announcement));
      setAnnouncements(announcementsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching announcements: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch announcements.",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const onSubmit = async (data: AnnouncementFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const newAnnouncement = {
        title: data.title,
        content: data.content,
        priority: data.priority,
        targetAudience: data.targetAudience,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Unknown User',
        authorAvatar: `https://i.pravatar.cc/150?u=${user.email}`,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "announcements"), newAnnouncement);

      toast({
        title: "Announcement Created",
        description: "Your announcement has been published successfully.",
      });
      
      form.reset();
      setOpen(false);

    } catch (error) {
      console.error("Error creating announcement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create announcement. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (announcement.targetAudience === 'All') return true;
    if (announcement.targetAudience === 'Admins' && user?.role === 'admin') return true;
    if (announcement.targetAudience === 'Assemblers' && user?.role === 'assembler') return true;
    return false;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case 'All': return 'bg-blue-100 text-blue-800';
      case 'Admins': return 'bg-purple-100 text-purple-800';
      case 'Assemblers': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Company-wide announcements and important updates
          </p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>
                  Share important updates with your team
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., New Safety Protocols" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write your announcement here..." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="targetAudience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select audience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="All">All Users</SelectItem>
                              <SelectItem value="Admins">Admins Only</SelectItem>
                              <SelectItem value="Assemblers">Assemblers Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Megaphone className="mr-2 h-4 w-4" />
                      Publish Announcement
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
              <p className="text-muted-foreground text-center">
                {user?.role === 'admin' 
                  ? "Create your first announcement to share updates with your team."
                  : "Check back later for important updates and announcements."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={announcement.authorAvatar} alt={announcement.authorName} />
                      <AvatarFallback>{announcement.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{announcement.authorName}</span>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>{formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                    <Badge variant="secondary" className={getAudienceColor(announcement.targetAudience)}>
                      {announcement.targetAudience}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}