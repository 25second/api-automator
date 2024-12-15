import { useState, useEffect } from 'react';

interface Session {
  name: string;
  status: string;
  uuid: string;
  debugPort?: number;
}

export const useSessionPolling = (initialSessions: Session[] = []) => {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:40080/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const data = await response.json();
      setSessions(prev => {
        // Preserve debug ports from previous state
        return data.map((newSession: Session) => ({
          ...newSession,
          debugPort: prev.find(s => s.uuid === newSession.uuid)?.debugPort
        }));
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 300);
    return () => clearInterval(interval);
  }, []);

  return { sessions, setSessions, loading };
};