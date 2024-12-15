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
import { Search, Download, CheckCircle2 } from "lucide-react";

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [startedSessions, setStartedSessions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHeadless, setIsHeadless] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:40080/sessions');
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const data = await response.json();
        console.log('Fetched sessions:', data);
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

  const handleConfirm = async () => {
    const selectedSessionObjects = sessions.filter(session => 
      selectedSessions.has(session.uuid)
    );

    // Start all selected sessions
    for (const session of selectedSessionObjects) {
      await startSession(session.uuid);
    }

    onConfirm(selectedSessionObjects);
  };

  const filteredSessions = sessions.filter(session =>
    selectedSessions.has(session.uuid) || 
    (session.name.toLowerCase().includes(searchQuery.toLowerCase()) && !startedSessions.has(session.uuid))
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
                      {session.debugPort && (
                        <div className="mt-1 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-xs">Port: {session.debugPort}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedSessions.has(session.uuid) && !startedSessions.has(session.uuid) && (
                    <Download className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
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
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selectedSessions.size === 0}
            >
              Run with Selected Sessions
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};