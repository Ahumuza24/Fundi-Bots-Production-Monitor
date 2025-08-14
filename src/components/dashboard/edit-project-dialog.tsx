"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, Trash2, CalendarIcon, Loader2, Users, FileText } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { collection, doc, updateDoc, onSnapshot, deleteField } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Project, Worker } from "@/lib/types";

const componentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Component name is required."),
  process: z.string().min(1, "Process is required."),
  quantityRequired: z.coerce.number().min(0, "Quantity must be at least 0."),
  quantityCompleted: z.coerce.number().min(0, "Quantity must be at least 0."),
  imageUrl: z.string().optional(),
});

const editProjectSchema = z.object({
  name: z.string().min(1, "Project name is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  description: z.string().min(1, "Description is required."),
  imageUrl: z.string().optional(),
  documentationUrl: z.string().optional(),
  deadline: z.date({
    required_error: "A due date is required.",
  }),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  status: z.enum(["Not Started", "In Progress", "Completed", "On Hold", "Archived"]),
  assignedWorkerIds: z.array(z.string()),
  components: z.array(componentSchema),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

interface EditProjectDialogProps {
  project: Project;
  onProjectUpdated: () => void;
  children: React.ReactNode;
}

export function EditProjectDialog({ project, onProjectUpdated, children }: EditProjectDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [documentRemoved, setDocumentRemoved] = useState(false);

  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name || "",
      quantity: project.quantity || 1,
      description: project.description || "",
      imageUrl: project.imageUrl || "",
      documentationUrl: project.documentationUrl || "",
      deadline: new Date(project.deadline),
      priority: project.priority || "Medium",
      status: project.status || "Not Started",
      assignedWorkerIds: project.assignedWorkerIds || [],
      components: project.components?.map(component => ({
        id: component.id || "",
        name: component.name || "",
        process: component.process || "",
        quantityRequired: component.quantityRequired || 0,
        quantityCompleted: component.quantityCompleted || 0,
        imageUrl: component.imageUrl || "",
      })) || [],
    },
  });

  // Reset form when project changes
  React.useEffect(() => {
    form.reset({
      name: project.name || "",
      quantity: project.quantity || 1,
      description: project.description || "",
      imageUrl: project.imageUrl || "",
      documentationUrl: project.documentationUrl || "",
      deadline: new Date(project.deadline),
      priority: project.priority || "Medium",
      status: project.status || "Not Started",
      assignedWorkerIds: project.assignedWorkerIds || [],
      components: project.components?.map(component => ({
        id: component.id || "",
        name: component.name || "",
        process: component.process || "",
        quantityRequired: component.quantityRequired || 0,
        quantityCompleted: component.quantityCompleted || 0,
        imageUrl: component.imageUrl || "",
      })) || [],
    });
  }, [project, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  const handleImageFileSelect = useCallback((file: File) => {
    setImageFile(file);
    setImageRemoved(false);
  }, []);

  const handleImageFileRemove = useCallback(() => {
    setImageFile(null);
    setImageRemoved(true);
    form.setValue('imageUrl', '');
  }, [form]);

  const handleDocumentFileSelect = useCallback((file: File) => {
    setDocumentFile(file);
    setDocumentRemoved(false);
  }, []);

  const handleDocumentFileRemove = useCallback(() => {
    setDocumentFile(null);
    setDocumentRemoved(true);
    form.setValue('documentationUrl', '');
  }, [form]);

  useEffect(() => {
    if (open) {
      // Reset file states when dialog opens
      setImageFile(null);
      setDocumentFile(null);
      setImageRemoved(false);
      setDocumentRemoved(false);
      
      const unsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
        const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
        setWorkers(workersData);
      });
      return () => unsubscribe();
    }
  }, [open]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onSubmit = async (data: EditProjectFormData) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    try {
      // Handle image upload/removal
      let imageUrl = project.imageUrl; // Start with existing image
      
      if (imageFile) {
        // New file uploaded
        imageUrl = await convertFileToBase64(imageFile);
      } else if (imageRemoved) {
        // File was explicitly removed
        imageUrl = "https://placehold.co/600x400.png";
      }
      
      // Handle document upload/removal
      let documentationUrl: string | typeof deleteField | null = project.documentationUrl;
      
      if (documentFile) {
        // New file uploaded
        documentationUrl = await convertFileToBase64(documentFile);
      } else if (documentRemoved) {
        // File was explicitly removed - use deleteField to remove from Firestore
        documentationUrl = deleteField();
      }

      const projectRef = doc(db, "projects", project.id);
      
      // Prepare the update data
      const updatedProject: any = {
        ...data,
        imageUrl,
        documentationUrl,
        deadline: data.deadline.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Remove any undefined values from the data object
      Object.keys(updatedProject).forEach(key => {
        if (updatedProject[key] === undefined) {
          delete updatedProject[key];
        }
      });

      await updateDoc(projectRef, updatedProject);

      toast({
        title: "Project Updated",
        description: `Project "${data.name}" has been successfully updated.`,
      });
      
      setImageFile(null);
      setDocumentFile(null);
      setImageRemoved(false);
      setDocumentRemoved(false);
      setOpen(false);
      onProjectUpdated();

    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update project. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details, assign workers, and manage components.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("Form validation errors:", errors);
            toast({
              variant: "destructive",
              title: "Validation Error",
              description: "Please check the form for errors and try again.",
            });
          })} className="space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Project Details</TabsTrigger>
                <TabsTrigger value="workers">Assign Workers</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Model-X Circuit Board" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Project Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailed description of the project..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Project Image
                    </label>
                    <div className="mt-2">
                      <FileUpload
                        onFileSelect={handleImageFileSelect}
                        onFileRemove={handleImageFileRemove}
                        currentFile={imageFile}
                        currentUrl={!imageFile && !imageRemoved ? project.imageUrl : undefined}
                        accept="image/*"
                        placeholder="Upload new project image"
                        maxSize={5 * 1024 * 1024} // 5MB for images
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Documentation (Optional)
                    </label>
                    <div className="mt-2">
                      <FileUpload
                        onFileSelect={handleDocumentFileSelect}
                        onFileRemove={handleDocumentFileRemove}
                        currentFile={documentFile}
                        currentUrl={!documentFile && !documentRemoved ? project.documentationUrl : undefined}
                        accept=".pdf,.doc,.docx"
                        placeholder="Upload new documentation"
                        maxSize={10 * 1024 * 1024} // 10MB for documents
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0,0,0,0)) 
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="workers" className="space-y-4">
                <FormField
                  control={form.control}
                  name="assignedWorkerIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Assign Workers</FormLabel>
                        <FormDescription>
                          Select workers to assign to this project.
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workers.map((worker) => (
                          <FormField
                            key={worker.id}
                            control={form.control}
                            name="assignedWorkerIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={worker.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-fundibots-primary/5 transition-colors"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(worker.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, worker.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== worker.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <Avatar className="h-10 w-10 border-2 border-fundibots-primary/20 mt-1">
                                    <AvatarFallback className="bg-gradient-to-br from-fundibots-secondary to-fundibots-yellow text-white font-semibold text-sm">
                                      {(() => {
                                        const names = worker.name.trim().split(' ').filter(n => n.length > 0);
                                        if (names.length === 0) return "W";
                                        if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
                                        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                                      })()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-1 leading-none flex-1">
                                    <FormLabel className="font-medium text-gray-900 cursor-pointer">
                                      {worker.name}
                                    </FormLabel>
                                    <div className="text-sm text-fundibots-primary font-medium">
                                      {worker.email}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {worker.skills.map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs bg-fundibots-primary/10 text-fundibots-primary border-fundibots-primary/20">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="components" className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Components & Processes</h3>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow">
                          <FormField
                            control={form.control}
                            name={`components.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Component Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Microcontroller" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`components.${index}.process`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Process</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Assembly" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`components.${index}.quantityRequired`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Required</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`components.${index}.quantityCompleted`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Completed</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                          className="mb-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove component</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => append({ 
                      id: `new-${Date.now()}`,
                      name: "", 
                      process: "Assembly", 
                      quantityRequired: 1,
                      quantityCompleted: 0
                    })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Component
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}