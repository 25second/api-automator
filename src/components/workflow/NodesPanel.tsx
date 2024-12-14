import React from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const nodeTypes = [
  {
    type: 'input',
    label: 'Input Node',
    description: 'Starting point of your workflow'
  },
  {
    type: 'process',
    label: 'Process Node',
    description: 'Process or transform data'
  },
  {
    type: 'output',
    label: 'Output Node',
    description: 'End point of your workflow'
  }
];

export const NodesPanel = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold mb-4">Available Nodes</h2>
      {nodeTypes.map((node) => (
        <Card
          key={node.type}
          className="cursor-move hover:border-primary"
          draggable
          onDragStart={(e) => onDragStart(e, node.type)}
        >
          <CardHeader className="p-4">
            <CardTitle className="text-sm">{node.label}</CardTitle>
            <p className="text-xs text-muted-foreground">{node.description}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};