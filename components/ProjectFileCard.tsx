import React from 'react';
import { Code } from 'lucide-react';
import { Project } from '../types';

interface ProjectFileCardProps {
  project: Project;
  onOpen: () => void;
}

const ProjectFileCard: React.FC<ProjectFileCardProps> = ({ project, onOpen }) => {
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  return (
    <div className="my-4 p-4 bg-card rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex-shrink-0 bg-background p-2 rounded-lg">
          <Code className="h-5 w-5 text-text-secondary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate" title={project.name}>
            {project.name}
          </p>
          <p className="text-xs text-text-secondary">{formattedDate}</p>
        </div>
      </div>
      <button
        onClick={onOpen}
        className="flex-shrink-0 px-4 py-2 bg-background text-text-primary text-sm font-semibold rounded-lg hover:bg-interactive-hover border border-border shadow-sm transition-colors"
        data-tooltip-text="Open in Code Interpreter"
        data-tooltip-position="top"
      >
        Open
      </button>
    </div>
  );
};

export default ProjectFileCard;