import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SessionCard } from './SessionCard';

interface Session {
  name: string;
  status: string;
  uuid: string;
  debugPort?: number;
}

interface DetailedSession {
  device: {
    os: string;
  };
  proxy: {
    publicIp: string;
  };
  name: string;
  uuid: string;
}

interface SessionListProps {
  sessions: Session[] | undefined;
  isLoading: boolean;
}

export const SessionList = ({ sessions, isLoading }: SessionListProps) => {
  const [detailedSessions, setDetailedSessions] = useState<Map<string, DetailedSession>>(
    new Map()
  );
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);

  useEffect(() => {
    if (!sessions) return;

    const queue = sessions.map(session => session.uuid);
    setProcessingQueue(queue);
  }, [sessions]);

  useEffect(() => {
    if (processingQueue.length === 0) return;

    const processNext = async () => {
      const uuid = processingQueue[0];
      try {
        const response = await fetch(`http://127.0.0.1:40080/sessions/${uuid}`);
        if (!response.ok) throw new Error('Failed to fetch session details');
        const data = await response.json();
        
        setDetailedSessions(prev => new Map(prev).set(uuid, data));
      } catch (error) {
        console.error(`Error fetching details for session ${uuid}:`, error);
      }
      
      setProcessingQueue(prev => prev.slice(1));
    };

    const timer = setTimeout(processNext, 500);
    return () => clearTimeout(timer);
  }, [processingQueue]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-lg border bg-card p-4 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!sessions?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No sessions found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.uuid}
          session={session}
          detailedInfo={detailedSessions.get(session.uuid)}
        />
      ))}
    </div>
  );
};