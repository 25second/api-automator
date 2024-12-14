import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface WorkflowFormProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
}

export const WorkflowForm = ({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  isEditing
}: WorkflowFormProps) => {
  return (
    <form className="flex gap-4 items-end" onSubmit={onSubmit}>
      <div className="space-y-1 flex-1">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="name" className="text-sm font-medium block">
              Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              required
              className="h-8"
            />
          </div>
          <div className="flex-[2]">
            <label htmlFor="description" className="text-sm font-medium block">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              required
              className="h-8"
            />
          </div>
        </div>
      </div>

      <Button type="submit" size="sm">
        {isEditing ? "Update Workflow" : "Create Workflow"}
      </Button>
    </form>
  );
};