import { useEffect, useState, useCallback } from "react";
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
  applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable";
import { nodeTypes } from "@/components/workflow/nodeTypes";
import { WorkflowForm } from "@/components/workflow/WorkflowForm";
import { WorkflowHeader } from "@/components/workflow/WorkflowHeader";
import { serializeWorkflowData, deserializeWorkflowData } from "@/utils/workflowUtils";

interface WorkflowData {
  name: string;
  description: string;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string;
  id?: string;
}

const WorkflowEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id !== "new";
  
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

  const handleRun = async () => {
    toast.info("Running workflow...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { error } = await supabase.functions.invoke('run-workflow', {
        body: { workflowId: id },
      });

      if (error) throw error;
      toast.success("Workflow completed successfully");
    } catch (error) {
      console.error("Error running workflow:", error);
      toast.error("Error running workflow");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <WorkflowHeader 
          isEditing={isEditing}
          onBack={() => navigate("/dashboard")}
          onRun={isEditing ? handleRun : undefined}
        />

        <ResizablePanelGroup direction="vertical" className="min-h-[600px] rounded-lg border">
          <ResizablePanel defaultSize={25}>
            <div className="p-6">
              <WorkflowForm
                name={workflow.name}
                description={workflow.description}
                onNameChange={(name) => setWorkflow({ ...workflow, name })}
                onDescriptionChange={(description) => setWorkflow({ ...workflow, description })}
                onSubmit={handleSubmit}
                isEditing={isEditing}
              />
            </div>
          </ResizablePanel>
          
          <ResizablePanel defaultSize={75}>
            <div className="h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background />
                <Controls />
              </ReactFlow>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default WorkflowEditor;