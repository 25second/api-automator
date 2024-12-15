import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SessionSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const SessionSearch = ({ value, onChange }: SessionSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search sessions..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  );
};