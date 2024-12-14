import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Session {
  name: string;
  proxy: {
    protocol: string;
  };
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

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Open a new tab with the sessions endpoint
        const newTab = window.open('http://127.0.0.1:40080/sessions', '_blank');
        
        if (!newTab) {
          throw new Error('Popup was blocked. Please allow popups for this site.');
        }

        // Listen for messages from the new tab
        const messageHandler = (event: MessageEvent) => {
          if (event.origin === 'http://127.0.0.1:40080') {
            try {
              const data = JSON.parse(event.data);
              console.log('Received sessions:', data);
              setSessions(data);
              // Close the tab after receiving data
              newTab.close();
            } catch (error) {
              console.error('Error parsing session data:', error);
              toast.error("Failed to parse session data");
            }
          }
        };

        window.addEventListener('message', messageHandler);

        // Cleanup
        return () => {
          window.removeEventListener('message', messageHandler);
          if (newTab && !newTab.closed) {
            newTab.close();
          }
        };
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error("Failed to fetch browser sessions. Make sure the local API is running and popups are allowed.");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchSessions();
    } else {
      // Reset selections when dialog closes
      setSelectedSessions(new Set());
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Browser Sessions</DialogTitle>
          <DialogDescription>
            Choose the browser sessions to run this workflow with.
            Please allow popups if prompted.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="py-6 text-center text-muted-foreground">
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No browser sessions found. Make sure the local API is running and popups are allowed.
          </div>
        ) : (
          <div className="py-6">
            <div className="space-y-4">
              {sessions.map((session) => (
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
                      Protocol: {session.proxy.protocol}
                      <br />
                      Status: {session.status}
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