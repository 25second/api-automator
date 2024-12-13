import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
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
import { CustomNode } from "@/components/workflow/CustomNode";
import { nodeTypes } from "@/components/workflow/nodeTypes";

interface WorkflowData {
  name: string;
  description: string;
  nodes: Json | null;
  edges: Json | null;
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
    nodes: [],
    edges: []
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

    setWorkflow(data);
    if (data.nodes) setNodes(data.nodes as Node[]);
    if (data.edges) setEdges(data.edges as Edge[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const workflowData = {
      ...workflow,
      nodes,
      edges,
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit Workflow" : "Create New Workflow"}
          </h1>
          <div className="flex gap-4">
            {isEditing && (
              <Button onClick={handleRun}>
                Run Workflow
              </Button>
            )}
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>

        <ResizablePanelGroup direction="vertical" className="min-h-[600px] rounded-lg border">
          <ResizablePanel defaultSize={25}>
            <div className="p-6">
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={workflow.name}
                    onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={workflow.description}
                    onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" onClick={handleSubmit}>
                  {isEditing ? "Update Workflow" : "Create Workflow"}
                </Button>
              </form>
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