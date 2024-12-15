import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { SessionSearch } from "./SessionSearch";
import { SessionListItem } from "./SessionListItem";
import { useSessionPolling } from "./useSessionPolling";

interface Session {
  name: string;
  status: string;
  uuid: string;
  debugPort?: number;
}

interface SessionSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sessions: Session[]) => void;
}

interface StartSessionResponse {
  debug_port: number;
  uuid: string;
}

export const SessionSelectDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: SessionSelectDialogProps) => {
  const { sessions, setSessions, loading } = useSessionPolling();
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [startedSessions, setStartedSessions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isHeadless, setIsHeadless] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

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

  const startSession = async (uuid: string) => {
    try {
      const debugPort = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
      const response = await fetch('http://127.0.0.1:40080/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid,
          headless: isHeadless,
          debug_port: debugPort,
          disable_images: false,
          chromium_args: "--blink-settings=imagesEnabled=false",
          referrer_values: [{ url: "https://fv.pro", replace: "https://ls.app"}]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data: StartSessionResponse = await response.json();
      
      setSessions(prev => prev.map(session => 
        session.uuid === data.uuid 
          ? { ...session, debugPort: data.debug_port }
          : session
      ));
      
      setStartedSessions(prev => new Set(prev).add(uuid));
      toast.success(`Session started on port ${data.debug_port}`);
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error("Failed to start session");
    }
  };

  const handleStartSessions = async () => {
    setIsStarting(true);
    const selectedSessionObjects = sessions.filter(session => 
      selectedSessions.has(session.uuid)
    );

    for (const session of selectedSessionObjects) {
      await startSession(session.uuid);
    }
    setIsStarting(false);
  };

  const allSelectedSessionsStarted = Array.from(selectedSessions).every(uuid => 
    startedSessions.has(uuid)
  );

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
        
        <SessionSearch value={searchQuery} onChange={setSearchQuery} />

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
                <SessionListItem
                  key={session.uuid}
                  session={session}
                  isSelected={selectedSessions.has(session.uuid)}
                  isStarted={startedSessions.has(session.uuid)}
                  onSelect={handleCheckboxChange}
                />
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="headless"
              checked={isHeadless}
              onCheckedChange={(checked) => setIsHeadless(checked as boolean)}
            />
            <label
              htmlFor="headless"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Headless Mode
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {allSelectedSessionsStarted ? (
              <Button
                type="button"
                onClick={() => {
                  const selectedSessionObjects = sessions.filter(session => 
                    selectedSessions.has(session.uuid)
                  );
                  onConfirm(selectedSessionObjects);
                }}
                disabled={selectedSessions.size === 0}
              >
                Run Workflow
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStartSessions}
                disabled={selectedSessions.size === 0 || isStarting}
                className="flex items-center gap-2"
              >
                {isStarting ? "Starting..." : "Run Sessions"}
                {!isStarting && <Download className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};