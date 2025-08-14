"use client";

import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;
  maxSize?: number;
  currentFile?: File | null;
  currentUrl?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = "image/*,.pdf,.doc,.docx",
  maxSize = 10 * 1024 * 1024, // 10MB
  currentFile,
  currentUrl,
  placeholder = "Drop files here or click to browse",
  className,
  disabled = false,
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Use setTimeout to ensure the callback is called outside of the render cycle
          setTimeout(() => {
            onFileSelect(file);
          }, 0);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (file: File | string) => {
    const fileName = typeof file === 'string' ? file : file.name;
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-8 w-8" />;
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className="h-8 w-8" />;
    } else {
      return <File className="h-8 w-8" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasFile = currentFile || (currentUrl && currentUrl !== "");

  return (
    <div className={cn("w-full", className)}>
      {!hasFile ? (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive ? "border-fundibots-primary bg-fundibots-primary/5" : "border-gray-300 hover:border-fundibots-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            {isDragActive ? "Drop the file here..." : placeholder}
          </p>
          <p className="text-xs text-gray-500">
            Supports images, PDFs, and documents up to {formatFileSize(maxSize)}
          </p>
          
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-fundibots-primary">
                {currentFile ? getFileIcon(currentFile) : getFileIcon(currentUrl || '')}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {currentFile ? currentFile.name : 'Current file'}
                </p>
                <p className="text-xs text-gray-500">
                  {currentFile ? formatFileSize(currentFile.size) : 'Existing file'}
                </p>
                {currentUrl && !currentFile && currentUrl.startsWith('data:image') && (
                  <div className="mt-2">
                    <img 
                      src={currentUrl} 
                      alt="Current project image" 
                      className="max-w-32 max-h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {isUploading && (
            <div className="mt-3">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}