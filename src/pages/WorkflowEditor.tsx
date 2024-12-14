import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactFlow, { 
  Background, 
  Controls,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from "@/components/workflow/nodeTypes";
import { WorkflowForm } from "@/components/workflow/WorkflowForm";
import { WorkflowHeader } from "@/components/workflow/WorkflowHeader";
import { NodesPanel } from "@/components/workflow/NodesPanel";
import { SessionSelectDialog } from "@/components/workflow/SessionSelectDialog";
import { serializeWorkflowData, deserializeWorkflowData } from "@/utils/workflowUtils";
import { Json } from "@/integrations/supabase/types";

interface WorkflowData {
  name: string;
  description: string;
  nodes?: Json;
  edges?: Json;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string;
  id?: string;
}

interface Session {
  name: string;
  proxy: {
    protocol: string;
  };
  status: string;
  uuid: string;
}

const WorkflowEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id !== "new";
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  
  const [workflow, setWorkflow] = useState<WorkflowData>({
    name: "",
    description: "",
  });

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      if (isEditing) {
        fetchWorkflow();
      }
    };
    
    checkUser();
  }, [navigate, id, isEditing]);

  const fetchWorkflow = async () => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error("Error fetching workflow");
      console.error("Error fetching workflow:", error);
      navigate("/dashboard");
      return;
    }

    const { nodes: deserializedNodes, edges: deserializedEdges } = deserializeWorkflowData(data.nodes, data.edges);
    
    setWorkflow(data);
    setNodes(deserializedNodes);
    setEdges(deserializedEdges);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { nodes: serializedNodes, edges: serializedEdges } = serializeWorkflowData(nodes, edges);

    const workflowData = {
      ...workflow,
      nodes: serializedNodes,
      edges: serializedEdges,
      user_id: session.user.id,
    };

    if (isEditing) {
      const { error } = await supabase
        .from('workflows')
        .update(workflowData)
        .eq('id', id);

      if (error) {
        toast.error("Error updating workflow");
        console.error("Error updating workflow:", error);
        return;
      }

      toast.success("Workflow updated successfully");
    } else {
      const { error } = await supabase
        .from('workflows')
        .insert([workflowData]);

      if (error) {
        toast.error("Error creating workflow");
        console.error("Error creating workflow:", error);
        return;
      }

      toast.success("Workflow created successfully");
    }

    navigate("/dashboard");
  };

  const handleRun = async () => {
    setShowSessionDialog(true);
  };

  const handleRunWithSessions = async (selectedSessions: Session[]) => {
    toast.info("Running workflow with selected sessions...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { error } = await supabase.functions.invoke('run-workflow', {
        body: { 
          workflowId: id,
          sessions: selectedSessions.map(s => s.uuid)
        },
      });

      if (error) throw error;
      toast.success("Workflow started successfully");
    } catch (error) {
      console.error("Error running workflow:", error);
      toast.error("Error running workflow");
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `${type}-${nodes.length + 1}`,
        type: 'custom',
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes]
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b">
        <div className="container py-2">
          <WorkflowHeader 
            isEditing={isEditing}
            onBack={() => navigate("/dashboard")}
            onRun={isEditing ? handleRun : undefined}
          />
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Nodes Panel */}
        <div className="w-64 border-r bg-muted/10">
          <NodesPanel />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="border-b px-4 py-2">
            <WorkflowForm
              name={workflow.name}
              description={workflow.description}
              onNameChange={(name) => setWorkflow({ ...workflow, name })}
              onDescriptionChange={(description) => setWorkflow({ ...workflow, description })}
              onSubmit={handleSubmit}
              isEditing={isEditing}
            />
          </div>

          <div className="flex-1" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </div>
      </div>

      <SessionSelectDialog
        open={showSessionDialog}
        onOpenChange={setShowSessionDialog}
        onConfirm={handleRunWithSessions}
      />
    </div>
  );
};

export default WorkflowEditor;
