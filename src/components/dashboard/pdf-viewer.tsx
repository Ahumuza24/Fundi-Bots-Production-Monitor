'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink } from 'lucide-react';

interface PDFViewerProps {
  documentationUrl: string;
  projectName: string;
  trigger?: React.ReactNode;
}

export function PDFViewer({ documentationUrl, projectName, trigger }: PDFViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBase64 = documentationUrl.startsWith('data:');
  const isValidUrl = documentationUrl && documentationUrl !== '#';

  const handleDownload = () => {
    try {
      if (isBase64) {
        // Create blob from base64 and download
        const link = document.createElement('a');
        link.href = documentationUrl;
        link.download = `${projectName}-documentation.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Open external URL in new tab
        window.open(documentationUrl, '_blank');
      }
    } catch (err) {
      setError('Failed to download documentation');
      console.error('Download error:', err);
    }
  };

  const handleExternalOpen = () => {
    if (isBase64) {
      // Create blob URL for base64 data
      try {
        const byteCharacters = atob(documentationUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        
        // Clean up the blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (err) {
        setError('Failed to open PDF');
        console.error('PDF open error:', err);
      }
    } else {
      window.open(documentationUrl, '_blank');
    }
  };

  if (!isValidUrl) {
    return null;
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <FileText className="h-4 w-4 mr-2" />
      View Documentation
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Documentation - {projectName}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExternalOpen}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <iframe
              src={documentationUrl}
              className="w-full h-full border-0 rounded"
              title={`${projectName} Documentation`}
              onError={() => setError('Failed to load PDF')}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}