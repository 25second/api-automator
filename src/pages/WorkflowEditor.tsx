import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          {isEditing ? "Edit Workflow" : "Create New Workflow"}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="flex gap-4">
            <Button type="submit">
              {isEditing ? "Update Workflow" : "Create Workflow"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkflowEditor;