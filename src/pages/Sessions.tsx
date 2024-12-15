import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SessionList } from '@/components/sessions/SessionList';
import { SessionsHeader } from '@/components/sessions/SessionsHeader';

const Sessions = () => {
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await fetch('http://127.0.0.1:40080/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      return response.json();
    },
  });

  return (
    <div className="container mx-auto py-6">
      <SessionsHeader />
      <SessionList sessions={sessions} isLoading={isLoadingSessions} />
    </div>
  );
};

export default Sessions;