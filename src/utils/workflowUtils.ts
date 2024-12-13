import { Node, Edge } from 'reactflow';
import { Json } from '@/integrations/supabase/types';

export const serializeWorkflowData = (nodes: Node[], edges: Edge[]): { nodes: Json, edges: Json } => {
  return {
    nodes: nodes as unknown as Json,
    edges: edges as unknown as Json
  };
};

export const deserializeWorkflowData = (nodes: Json | null, edges: Json | null): { nodes: Node[], edges: Edge[] } => {
  return {
    nodes: (nodes || []) as unknown as Node[],
    edges: (edges || []) as unknown as Edge[]
  };
};