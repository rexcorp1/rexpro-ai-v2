

import React, { useEffect, useMemo, useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Attachment } from '../types';

interface PreviewModalProps {
  isOpen: boolean;
  file: Attachment | null;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, file, onClose }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (file && file.mimeType === 'application/pdf' && file.dataUrl) {
      try {
        const byteCharacters = atob(file.dataUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);

        return () => {
          URL.revokeObjectURL(url);
          setObjectUrl(null);
        };
      } catch (e) {
        console.error("Error creating PDF Object URL:", e);
      }
    }
  }, [file]);


  const decodedTextContent = useMemo(() => {
    if (file && file.mimeType.startsWith('text/')) {
      try {
        const base64Part = file.dataUrl.split(',')[1];
        if (base64Part) {
          // Robustly decode base64 that might contain non-latin characters
          return decodeURIComponent(atob(base64Part).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
        }
      } catch (e) {
        console.error("Failed to decode base64 content:", e);
        return "Error: Could not display file content.";
      }
    }
    return null;
  }, [file]);


  if (!isOpen || !file) return null;

  const renderContent = () => {
    if (file.mimeType.startsWith('image/')) {
      return <img src={file.dataUrl} alt={file.name} className="max-w-full max-h-full object-contain" />;
    }
    if (file.mimeType.startsWith('video/')) {
      return <video src={file.dataUrl} controls autoPlay className="max-w-full max-h-full" />;
    }
    if (file.mimeType === 'application/pdf') {
      return <iframe src={objectUrl || ''} title={file.name} className="w-full h-full border-none" />;
    }
     if (decodedTextContent) {
      return <pre className="w-full h-full bg-card text-text-primary p-4 rounded-lg overflow-auto text-sm whitespace-pre-wrap">{decodedTextContent}</pre>;
    }
    return <div className="text-center text-text-secondary">Preview not available for this file type.</div>;
  };

  const handlePrint = () => {
     if (file.mimeType === 'application/pdf' && objectUrl) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = objectUrl;
        document.body.appendChild(iframe);
        iframe.onload = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            // Optional: remove iframe after a delay
            setTimeout(() => document.body.removeChild(iframe), 1000);
        };
     } else if (file.mimeType.startsWith('image/')) {
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`<html><head><title>Print</title></head><body style="margin:0;"><img src="${file.dataUrl}" style="max-width:100%;"></body></html>`);
        printWindow?.document.close();
        printWindow?.focus();
        printWindow?.print();
        printWindow?.close();
     } else {
        alert('Print is only supported for PDF and image files currently.');
     }
  };

  return (
    <div
      className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-background rounded-lg shadow-xl w-full max-w-6xl h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-3 flex-shrink-0">
          <h2 className="text-lg font-medium text-text-primary truncate pr-4" title={file.name}>
            {file.name}
          </h2>
          <div className="flex items-center gap-2">
             <button onClick={handlePrint} className="p-2 text-text-secondary hover:bg-interactive-hover rounded-lg" data-tooltip-text="Print" data-tooltip-position="bottom">
                <Printer className="h-5 w-5" />
            </button>
            <a href={file.dataUrl} download={file.name} className="p-2 text-text-secondary hover:bg-interactive-hover rounded-lg" data-tooltip-text="Download" data-tooltip-position="bottom">
              <Download className="h-5 w-5" />
            </a>
            <button onClick={onClose} className="p-2 text-text-secondary hover:bg-interactive-hover rounded-lg" aria-label="Close modal">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="p-4 flex-1 flex justify-center items-center bg-card/50 min-h-0 rounded-b-lg">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};