import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Play, ListBrowser } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Workflow {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      fetchWorkflows();
    };
    
    checkUser();
  }, [navigate]);

  const fetchWorkflows = async () => {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Error fetching workflows");
      console.error("Error fetching workflows:", error);
      return;
    }

    setWorkflows(data || []);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Error deleting workflow");
      console.error("Error deleting workflow:", error);
      return;
    }

    toast.success("Workflow deleted successfully");
    fetchWorkflows();
  };

  const handleCreate = () => {
    navigate("/workflow/new");
  };

  const handleEdit = (id: string) => {
    navigate(`/workflow/${id}`);
  };

  const handleRun = (id: string) => {
    toast.info("Run workflow functionality coming soon!");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Workflows</h1>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/sessions')} variant="outline">
              <ListBrowser className="mr-2 h-4 w-4" />
              Browser Sessions
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </div>
        </div>
        
        <div className="bg-card rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">{workflow.name}</TableCell>
                  <TableCell>{workflow.description}</TableCell>
                  <TableCell>
                    {new Date(workflow.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRun(workflow.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(workflow.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(workflow.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {workflows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No workflows found. Create your first workflow!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;