"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, Plus, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ProjectTemplate } from "@/lib/types";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required."),
  description: z.string().min(1, "Description is required."),
  estimatedDuration: z.coerce.number().min(1, "Duration must be at least 1 day."),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface ProjectTemplatesDialogProps {
  onTemplateSelected: (template: ProjectTemplate) => void;
}

export function ProjectTemplatesDialog({ onTemplateSelected }: ProjectTemplatesDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      estimatedDuration: 7,
    },
  });

  useEffect(() => {
    if (open) {
      const unsubscribe = onSnapshot(collection(db, "projectTemplates"), (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectTemplate));
        setTemplates(templatesData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching templates: ", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch project templates.",
        });
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [open, toast]);

  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    try {
      const newTemplate: Omit<ProjectTemplate, 'id'> = {
        name: data.name,
        description: data.description,
        estimatedDuration: data.estimatedDuration,
        components: [
          { name: "Main Component", process: "Assembly", quantityPerUnit: 1 }
        ],
        processSequence: ["Assembly", "Testing", "Packaging"],
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "projectTemplates"), newTemplate);

      toast({
        title: "Template Created",
        description: `Template "${data.name}" has been successfully created.`,
      });
      
      form.reset();
      setActiveTab("browse");

    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create template. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseTemplate = (template: ProjectTemplate) => {
    onTemplateSelected(template);
    setOpen(false);
    toast({
      title: "Template Applied",
      description: `Using template "${template.name}" for new project.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <FileText className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Templates
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Templates</DialogTitle>
          <DialogDescription>
            Browse existing templates or create new ones to speed up project creation.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Templates</TabsTrigger>
            <TabsTrigger value="create">Create Template</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No templates found. Create your first template!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                        <Badge variant="outline">
                          {template.estimatedDuration} days
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Components:</p>
                          <p className="text-sm text-muted-foreground">
                            {template.components.map(c => c.name).join(", ")}
                          </p>
                        </div>
                        {template.processSequence && (
                          <div>
                            <p className="text-sm font-medium">Process Sequence:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {template.processSequence.map((process, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {process}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button 
                          onClick={() => handleUseTemplate(template)}
                          className="w-full mt-4"
                          size="sm"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Standard Circuit Board Assembly" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe what this template is used for..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Duration (days)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Template
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}