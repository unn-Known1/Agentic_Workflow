import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Bot, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Save,
  X,
  User,
  Brain,
  Settings
} from "lucide-react";
import { api, Agent } from "@/lib/api";
import { toast } from "sonner";

export default function AgentsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Partial<Agent> | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (error) {
      toast.error("Failed to load agents");
    }
  };

  const handleCreateAgent = async () => {
    if (!editingAgent) return;

    try {
      const newAgent = await api.createAgent({
        name: editingAgent.name || "",
        role: editingAgent.role || "",
        description: editingAgent.description || "",
        personality: editingAgent.personality || {},
        system_prompt: editingAgent.system_prompt || "",
      });
      
      setAgents([...agents, newAgent]);
      setIsDialogOpen(false);
      setEditingAgent(null);
      toast.success("Agent created successfully");
    } catch (error) {
      toast.error("Failed to create agent");
    }
  };

  const handleUpdateAgent = async () => {
    if (!editingAgent || !editingAgent.id) return;

    try {
      const updatedAgent = await api.updateAgent(editingAgent.id, {
        name: editingAgent.name || "",
        role: editingAgent.role || "",
        description: editingAgent.description || "",
        personality: editingAgent.personality || {},
        system_prompt: editingAgent.system_prompt || "",
      });
      
      setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
      setIsDialogOpen(false);
      setEditingAgent(null);
      toast.success("Agent updated successfully");
    } catch (error) {
      toast.error("Failed to update agent");
    }
  };

  const handleDeleteAgent = async (id: number) => {
    try {
      await api.deleteAgent(id);
      setAgents(agents.filter(a => a.id !== id));
      toast.success("Agent deleted successfully");
    } catch (error) {
      toast.error("Failed to delete agent");
    }
  };

  const handleCloneAgent = async (id: number) => {
    try {
      const clonedAgent = await api.cloneAgent(id);
      setAgents([...agents, clonedAgent]);
      toast.success("Agent cloned successfully");
    } catch (error) {
      toast.error("Failed to clone agent");
    }
  };

  const openCreateDialog = () => {
    setEditingAgent({
      name: "",
      role: "",
      description: "",
      personality: {
        expertise: "general",
        creativity: 0.7,
        thoroughness: 0.8,
        communication_style: "professional"
      },
      system_prompt: "You are a helpful AI assistant.",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (agent: Agent) => {
    setEditingAgent(agent);
    setIsDialogOpen(true);
  };

  const getPersonalityBadge = (value: number) => {
    if (value >= 0.8) return "bg-green-500";
    if (value >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Agent Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage specialized AI agents for your workflows
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {agent.name}
                  </CardTitle>
                  <CardDescription>{agent.role}</CardDescription>
                </div>
                <Badge variant={agent.is_active ? "default" : "secondary"}>
                  {agent.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{agent.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expertise</span>
                  <Badge className={getPersonalityBadge(agent.personality?.thoroughness || 0.5)}>
                    {agent.personality?.expertise || "general"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Creativity</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(agent.personality?.creativity || 0.5) * 100} className="w-20 h-2" />
                    <span className="text-xs">{Math.round((agent.personality?.creativity || 0.5) * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(agent)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCloneAgent(agent.id)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Clone
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteAgent(agent.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No agents created yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first agent to get started with workflow automation
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAgent?.id ? "Edit Agent" : "Create New Agent"}
            </DialogTitle>
          </DialogHeader>
          
          {editingAgent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={editingAgent.name}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  placeholder="e.g., Research Assistant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={editingAgent.role}
                  onChange={(e) => setEditingAgent({ ...editingAgent, role: e.target.value })}
                  placeholder="e.g., Senior Research Analyst"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingAgent.description}
                  onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                  placeholder="Describe what this agent does..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={editingAgent.system_prompt}
                  onChange={(e) => setEditingAgent({ ...editingAgent, system_prompt: e.target.value })}
                  placeholder="Define the agent's behavior and capabilities..."
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label>Personality Traits</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="expertise" className="text-sm">Expertise Area</Label>
                  <Input
                    id="expertise"
                    value={editingAgent.personality?.expertise || ""}
                    onChange={(e) => setEditingAgent({
                      ...editingAgent,
                      personality: { ...editingAgent.personality, expertise: e.target.value }
                    })}
                    placeholder="e.g., data_analysis, writing, coding"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="creativity" className="text-sm">Creativity</Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((editingAgent.personality?.creativity || 0.5) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    id="creativity"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editingAgent.personality?.creativity || 0.5}
                    onChange={(e) => setEditingAgent({
                      ...editingAgent,
                      personality: { ...editingAgent.personality, creativity: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="thoroughness" className="text-sm">Thoroughness</Label>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((editingAgent.personality?.thoroughness || 0.5) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    id="thoroughness"
                    min="0"
                    max="1"
                    step="0.1"
                    value={editingAgent.personality?.thoroughness || 0.5}
                    onChange={(e) => setEditingAgent({
                      ...editingAgent,
                      personality: { ...editingAgent.personality, thoroughness: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={editingAgent?.id ? handleUpdateAgent : handleCreateAgent}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingAgent?.id ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}