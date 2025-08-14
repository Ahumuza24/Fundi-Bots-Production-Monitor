
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

const componentSchema = z.object({
  name: z.string().min(1, "Component name is required."),
  quantityRequired: z.coerce.number().min(1, "Quantity must be at least 1."),
});

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  description: z.string().min(1, "Description is required."),
  imageUrl: z.string().url("Please enter a valid image URL."),
  components: z.array(componentSchema).min(1, "Please add at least one component."),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export function CreateProjectDialog({ onProjectCreated }: { onProjectCreated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      description: "",
      imageUrl: "https://placehold.co/600x400.png",
      components: [{ name: "", quantityRequired: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      // Automatic calculation: total components needed is project quantity * quantity per unit.
      // The current form schema takes total quantity directly, so no calculation needed here,
      // but the data is structured for it.
      const newProject = {
        ...data,
        deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(), // Default 30 day deadline
        status: 'Not Started',
        // In this model, quantityRequired is the total.
        components: data.components.map(c => ({
            id: c.name.toLowerCase().replace(/\s/g, '-'), // simple id generation
            name: c.name,
            quantityRequired: c.quantityRequired,
            quantityCompleted: 0
        })),
      };

      await addDoc(collection(db, "projects"), newProject);

      toast({
        title: "Project Created",
        description: `Project "${data.name}" has been successfully created.`,
      });
      
      form.reset();
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

            <div>
              <h3 className="text-lg font-medium mb-2">Components</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md relative">
                    <div className="grid grid-cols-2 gap-4 flex-grow">
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
                        name={`components.${index}.quantityRequired`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Quantity Required</FormLabel>
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
                onClick={() => append({ name: "", quantityRequired: 1 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Component
              </Button>
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

