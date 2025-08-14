"use client";

import { useState, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, Loader2, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CSVProject {
  name: string;
  quantity: number;
  description: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  components: string; // JSON string of components
}

interface CSVImportDialogProps {
  onProjectsImported: () => void;
}

export function CSVImportDialog({ onProjectsImported }: CSVImportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [csvData, setCsvData] = useState<CSVProject[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCSV = `name,quantity,description,deadline,priority,components
"Model-X Circuit Board",100,"Main circuit board for Model-X drone","2024-12-31","High","[{""name"":""Microcontroller"",""process"":""Assembly"",""quantityPerUnit"":1},{""name"":""Resistor Pack"",""process"":""Soldering"",""quantityPerUnit"":5}]"
"Guardian Bot Chassis",50,"Mechanical assembly for Guardian Bot","2024-11-30","Medium","[{""name"":""Frame"",""process"":""Assembly"",""quantityPerUnit"":1},{""name"":""Armor Plating"",""process"":""Installation"",""quantityPerUnit"":4}]"`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-projects.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): CSVProject[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).map((line, index) => {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const project: any = {};
      headers.forEach((header, i) => {
        let value = values[i]?.replace(/^"|"$/g, '') || '';
        
        if (header === 'quantity') {
          project[header] = parseInt(value) || 1;
        } else if (header === 'components') {
          try {
            project[header] = JSON.parse(value);
          } catch {
            project[header] = [];
          }
        } else {
          project[header] = value;
        }
      });

      return project as CSVProject;
    });
  };

  const validateProjects = (projects: CSVProject[]): string[] => {
    const errors: string[] = [];
    
    projects.forEach((project, index) => {
      const row = index + 2; // +2 because of header and 0-based index
      
      if (!project.name) {
        errors.push(`Row ${row}: Project name is required`);
      }
      
      if (!project.quantity || project.quantity < 1) {
        errors.push(`Row ${row}: Quantity must be at least 1`);
      }
      
      if (!project.description) {
        errors.push(`Row ${row}: Description is required`);
      }
      
      if (!project.deadline) {
        errors.push(`Row ${row}: Deadline is required`);
      } else {
        const date = new Date(project.deadline);
        if (isNaN(date.getTime())) {
          errors.push(`Row ${row}: Invalid deadline format (use YYYY-MM-DD)`);
        }
      }
      
      if (!['Low', 'Medium', 'High', 'Critical'].includes(project.priority)) {
        errors.push(`Row ${row}: Priority must be Low, Medium, High, or Critical`);
      }
      
      if (!Array.isArray(project.components) || project.components.length === 0) {
        errors.push(`Row ${row}: At least one component is required`);
      }
    });
    
    return errors;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const projects = parseCSV(csvText);
        const validationErrors = validateProjects(projects);
        
        setCsvData(projects);
        setErrors(validationErrors);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to parse CSV file. Please check the format.",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Errors",
        description: "Please fix the errors before importing.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      csvData.forEach((project) => {
        const projectRef = doc(collection(db, "projects"));
        const newProject = {
          name: project.name,
          quantity: project.quantity,
          description: project.description,
          imageUrl: "https://placehold.co/600x400.png",
          deadline: new Date(project.deadline).toISOString(),
          priority: project.priority,
          status: 'Not Started' as const,
          assignedWorkerIds: [],
          createdAt: now,
          updatedAt: now,
          components: project.components.map((c: any, index: number) => ({
            id: `${c.name.toLowerCase().replace(/\s/g, '-')}-${index}`,
            name: c.name,
            process: c.process,
            quantityRequired: c.quantityPerUnit * project.quantity,
            quantityCompleted: 0
          })),
          comments: [],
          attachments: [],
        };
        batch.set(projectRef, newProject);
      });

      await batch.commit();

      toast({
        title: "Import Successful",
        description: `Successfully imported ${csvData.length} projects.`,
      });

      setCsvData([]);
      setErrors([]);
      setOpen(false);
      onProjectsImported();

    } catch (error) {
      console.error("Error importing projects:", error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Failed to import projects. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Upload className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Import CSV
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Projects from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple projects at once. Download the sample file to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={downloadSampleCSV}
              className="mt-6"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Sample
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Validation Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {csvData.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Preview ({csvData.length} projects)</h3>
              <div className="border rounded-md max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Components</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.map((project, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.quantity}</TableCell>
                        <TableCell>{project.priority}</TableCell>
                        <TableCell>{project.deadline}</TableCell>
                        <TableCell>
                          {Array.isArray(project.components) 
                            ? `${project.components.length} components`
                            : 'Invalid format'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={csvData.length === 0 || errors.length > 0 || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <FileText className="mr-2 h-4 w-4" />
            Import {csvData.length} Projects
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}