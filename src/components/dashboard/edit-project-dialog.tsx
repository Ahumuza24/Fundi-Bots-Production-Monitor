"use client";

import { useState, useEffect } from "react";
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
import { PlusCircle, Trash2, CalendarIcon, Loader2, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, doc, updateDoc, onSnapshot } from "firebase/firestore";
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
  imageUrl: z.string().url("Please enter a valid image URL."),
  documentationUrl: z.string().url().optional().or(z.literal("")),
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

  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      quantity: project.quantity,
      description: project.description,
      imageUrl: project.imageUrl,
      documentationUrl: project.documentationUrl || "",
      deadline: new Date(project.deadline),
      priority: project.priority,
      status: project.status,
      assignedWorkerIds: project.assignedWorkerIds || [],
      components: project.components,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  useEffect(() => {
    if (open) {
      const unsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
        const workersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker));
        setWorkers(workersData);
      });
      return () => unsubscribe();
    }
  }, [open]);

  const onSubmit = async (data: EditProjectFormData) => {
    setIsSubmitting(true);
    try {
      const projectRef = doc(db, "projects", project.id);
      const updatedProject = {
        ...data,
        deadline: data.deadline.toISOString(),
        documentationUrl: data.documentationUrl || undefined,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(projectRef, updatedProject);

      toast({
        title: "Project Updated",
        description: `Project "${data.name}" has been successfully updated.`,
      });
      
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
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="workers">Assign Workers</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.png" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="documentationUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Documentation URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/docs.pdf" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
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
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">
                                      {worker.name}
                                    </FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                      {worker.email}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {worker.skills.map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
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
              
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}