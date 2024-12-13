import React from 'react';
import { Button } from "@/components/ui/button";

interface WorkflowHeaderProps {
  isEditing: boolean;
  onBack: () => void;
  onRun?: () => void;
}

export const WorkflowHeader = ({ isEditing, onBack, onRun }: WorkflowHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">
        {isEditing ? "Edit Workflow" : "Create New Workflow"}
      </h1>
      <div className="flex gap-4">
        {isEditing && onRun && (
          <Button onClick={onRun}>
            Run Workflow
          </Button>
        )}
        <Button onClick={onBack} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};