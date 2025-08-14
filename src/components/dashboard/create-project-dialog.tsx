
"use client";

import { useState } from "react";
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
import { PlusCircle, Trash2, CalendarIcon, Loader2 } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const componentSchema = z.object({
  name: z.string().min(1, "Component name is required."),
  process: z.string().min(1, "Process is required."),
  quantityPerUnit: z.coerce.number().min(1, "Quantity must be at least 1."),
});

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  description: z.string().min(1, "Description is required."),
  imageUrl: z.string().optional(),
  documentationUrl: z.string().optional(),
  deadline: z.date({
    required_error: "A due date is required.",
  }),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  components: z.array(componentSchema).min(1, "Please add at least one component."),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export function CreateProjectDialog({ onProjectCreated }: { onProjectCreated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      description: "",
      imageUrl: "",
      documentationUrl: "",
      priority: "Medium",
      components: [{ name: "", process: "Assembly", quantityPerUnit: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      
      // Convert files to base64 if they exist
      let imageUrl = data.imageUrl || "https://placehold.co/600x400.png";
      let documentationUrl = data.documentationUrl;
      
      if (imageFile) {
        imageUrl = await convertFileToBase64(imageFile);
      }
      
      if (documentFile) {
        documentationUrl = await convertFileToBase64(documentFile);
      }
      
      const newProject = {
        name: data.name,
        quantity: data.quantity,
        description: data.description,
        imageUrl,
        documentationUrl: documentationUrl || undefined,
        deadline: data.deadline.toISOString(),
        priority: data.priority,
        status: 'Not Started' as const,
        assignedWorkerIds: [],
        createdAt: now,
        updatedAt: now,
        components: data.components.map(c => ({
            id: c.name.toLowerCase().replace(/\s/g, '-'), // simple id generation
            name: c.name,
            process: c.process,
            quantityRequired: c.quantityPerUnit * data.quantity,
            quantityCompleted: 0
        })),
        comments: [],
        attachments: [],
      };

      await addDoc(collection(db, "projects"), newProject);

      toast({
        title: "Project Created",
        description: `Project "${data.name}" has been successfully created.`,
      });
      
      form.reset();
      setImageFile(null);
      setDocumentFile(null);
      setOpen(false);
      onProjectCreated();

    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Project
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Fill in the details for the new project. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      onFileSelect={(file) => setImageFile(file)}
                      onFileRemove={() => setImageFile(null)}
                      currentFile={imageFile}
                      accept="image/*"
                      placeholder="Upload project image"
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
                      onFileSelect={(file) => setDocumentFile(file)}
                      onFileRemove={() => setDocumentFile(null)}
                      currentFile={documentFile}
                      accept=".pdf,.doc,.docx"
                      placeholder="Upload documentation"
                      maxSize={10 * 1024 * 1024} // 10MB for documents
                    />
                  </div>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
             </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Components & Processes</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
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
                        name={`components.${index}.quantityPerUnit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity per Unit</FormLabel>
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
                onClick={() => append({ name: "", process: "Assembly", quantityPerUnit: 1 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Component
              </Button>
              <FormDescription className="mt-2 text-sm">
                The total quantity required for each component will be automatically calculated by multiplying the project's total quantity by the component's quantity per unit.
              </FormDescription>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
