import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Download, CheckCircle2 } from "lucide-react";

interface Session {
  name: string;
  status: string;
  uuid: string;
  debugPort?: number;
}

interface SessionListItemProps {
  session: Session;
  isSelected: boolean;
  isStarted: boolean;
  onSelect: (uuid: string, checked: boolean) => void;
}

export const SessionListItem = ({ 
  session, 
  isSelected, 
  isStarted,
  onSelect 
}: SessionListItemProps) => {
  return (
    <div className="flex items-start space-x-4 rounded-lg border p-4">
      <Checkbox
        id={session.uuid}
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(session.uuid, checked as boolean)}
      />
      <div className="flex-1 space-y-1">
        <label
          htmlFor={session.uuid}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {session.name}
        </label>
        <div className="text-sm text-muted-foreground">
          Status: {session.status}
          <br />
          <span className="text-xs opacity-50">UUID: {session.uuid}</span>
          {session.debugPort && (
            <div className="mt-1 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs">Port: {session.debugPort}</span>
            </div>
          )}
        </div>
      </div>
      {isSelected && !isStarted && (
        <Download className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
};