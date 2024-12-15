import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Monitor, Globe, CheckCircle2 } from 'lucide-react';

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

interface SessionCardProps {
  session: Session;
  detailedInfo?: DetailedSession;
}

export const SessionCard = ({ session, detailedInfo }: SessionCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">{session.name}</h3>
          {session.debugPort && (
            <div className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <span>Port: {session.debugPort}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Monitor className="h-4 w-4" />
            <span>{detailedInfo?.device?.os || 'Loading OS info...'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>{detailedInfo?.proxy?.publicIp || 'Loading IP info...'}</span>
          </div>
          <div className="mt-4 text-xs text-muted-foreground opacity-50">
            UUID: {session.uuid}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};