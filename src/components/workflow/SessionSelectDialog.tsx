import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";

interface Session {
  name: string;
  status: string;
  uuid: string;
}

interface SessionSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sessions: Session[]) => void;
}

export const SessionSelectDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: SessionSelectDialogProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:40080/sessions');
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const data = await response.json();
        console.log('Fetched sessions:', data); // Debug log
        setSessions(data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error("Failed to fetch browser sessions");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchSessions();
    }
  }, [open]);

  const handleCheckboxChange = (uuid: string, checked: boolean) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(uuid);
      } else {
        newSet.delete(uuid);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selectedSessionObjects = sessions.filter(session => 
      selectedSessions.has(session.uuid)
    );
    onConfirm(selectedSessionObjects);
    onOpenChange(false);
  };

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Browser Sessions</DialogTitle>
          <DialogDescription>
            Choose one or more browser sessions to run this workflow.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {loading ? (
          <div className="py-6 text-center text-muted-foreground">
            Loading sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            {sessions.length === 0 ? "No browser sessions found" : "No sessions match your search"}
          </div>
        ) : (
          <div className="py-6">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.uuid}
                  className="flex items-start space-x-4 rounded-lg border p-4"
                >
                  <Checkbox
                    id={session.uuid}
                    checked={selectedSessions.has(session.uuid)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(session.uuid, checked as boolean)
                    }
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedSessions.size === 0}
          >
            Run with Selected Sessions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};