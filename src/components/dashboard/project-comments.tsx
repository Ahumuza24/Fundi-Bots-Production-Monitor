"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Project, ProjectComment } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(500, "Comment too long."),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface ProjectCommentsProps {
  project: Project;
  onCommentAdded?: () => void;
}

export function ProjectComments({ project, onCommentAdded }: ProjectCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: CommentFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const newComment: ProjectComment = {
        id: `comment-${Date.now()}`,
        userId: user.uid,
        userName: user.displayName || user.email || 'Unknown User',
        userAvatar: '', // No longer using external avatars
        content: data.content,
        timestamp: new Date().toISOString(),
      };

      const projectRef = doc(db, "projects", project.id);
      await updateDoc(projectRef, {
        comments: arrayUnion(newComment),
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Comment Added",
        description: "Your comment has been added to the project.",
      });
      
      form.reset();
      onCommentAdded?.();

    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add comment. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const comments = project.comments || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Project Comments
          <Badge variant="secondary">{comments.length}</Badge>
        </CardTitle>
        <CardDescription>
          Collaborate and share updates about this project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Add a comment about this project..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} size="sm">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Add Comment
              </Button>
            </div>
          </form>
        </Form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet. Be the first to add one!</p>
            </div>
          ) : (
            comments
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 border rounded-lg">
                  <Avatar className="h-8 w-8 border-2 border-fundibots-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-fundibots-secondary to-fundibots-cyan text-white font-semibold text-xs">
                      {(() => {
                        const names = comment.userName.trim().split(' ').filter(n => n.length > 0);
                        if (names.length === 0) return "U";
                        if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
                        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                      })()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}