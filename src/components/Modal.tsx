
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  title: string;
  content: string;
  setContent: (content: string) => void;
  placeholder?: string;
  helpText?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, title, content, setContent, placeholder, helpText }) => {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
    >
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 id="modal-title" className="text-lg font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={15}
            className="w-full p-3 border border-border rounded-lg text-sm text-text-primary bg-card focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent font-mono"
            aria-label={title}
          />
          {helpText && <div className="mt-2 text-xs text-text-secondary">{helpText}</div>}
        </div>
        <div className="flex justify-end p-4 border-t border-border bg-card/50 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-background border border-border rounded-lg hover:bg-interactive-hover mr-2">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
