import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Play, 
  Save, 
  Plus, 
  Trash2, 
  Edit,
  Workflow,
  Database,
  Type,
  ListTodo
} from "lucide-react";
import { api, Workflow as WorkflowType } from "@/lib/api";
import { toast } from "sonner";
import { AgentNode } from "@/components/workflow/AgentNode";
import { InputNode } from "@/components/workflow/InputNode";
import { OutputNode } from "@/components/workflow/OutputNode";

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  input: InputNode,
  output: OutputNode,
};

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    loadWorkflows();
    loadAgents();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (id) {
      loadWorkflow(parseInt(id));
    }
  }, [id]);

  const loadWorkflows = async () => {
    try {
      const data = await api.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      toast.error("Failed to load workflows");
    }
  };

  const loadAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (error) {
      toast.error("Failed to load agents");
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await api.getWorkflowTemplates();
      setTemplates(data.templates);
    } catch (error) {
      toast.error("Failed to load templates");
    }
  };

  const loadWorkflow = async (workflowId: number) => {
    try {
      const workflow = await api.getWorkflow(workflowId);
      setSelectedWorkflow(workflow);
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description);
      setSelectedAgentId(workflow.agent_id);
      
      // Load workflow graph
      const config = workflow.workflow_config;
      setNodes(config.nodes || []);
      setEdges(config.edges || []);
      setIsBuilderOpen(true);
    } catch (error) {
      toast.error("Failed to load workflow");
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string, data: any = {}) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: {
        label: type === "agent" ? "New Agent" : type === "input" ? "Input" : "Output",
        ...data,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveWorkflow = async () => {
    if (!workflowName) {
      toast.error("Workflow name is required");
      return;
    }

    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      agent_id: selectedAgentId || 0,
      workflow_config: {
        nodes,
        edges,
      },
    };

    try {
      if (selectedWorkflow) {
        await api.updateWorkflow(selectedWorkflow.id, workflowData);
        toast.success("Workflow updated successfully");
      } else {
        await api.createWorkflow(workflowData);
        toast.success("Workflow created successfully");
      }
      setIsBuilderOpen(false);
      loadWorkflows();
    } catch (error) {
      toast.error("Failed to save workflow");
    }
  };

  const deleteWorkflow = async (id: number) => {
    try {
      await api.deleteWorkflow(id);
      setWorkflows(workflows.filter(w => w.id !== id));
      toast.success("Workflow deleted successfully");
    } catch (error) {
      toast.error("Failed to delete workflow");
    }
  };

  const executeWorkflow = async (workflowId: number) => {
    try {
      const execution = await api.executeWorkflow(workflowId, {});
      toast.success(`Workflow execution started. ID: ${execution.id}`);
      navigate(`/executions/${execution.id}`);
    } catch (error) {
      toast.error("Failed to start workflow execution");
    }
  };

  const loadTemplate = (template: any) => {
    setWorkflowName(template.name);
    setWorkflowDescription(template.description);
    setNodes(template.nodes.map((n: any) => ({
      ...n,
      data: { ...n.data, label: n.data.label || n.id },
    })));
    setEdges(template.edges);
    setIsBuilderOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Workflow Builder</h1>
          <p className="text-muted-foreground mt-2">
            Design and manage agentic workflows with visual node editor
          </p>
        </div>
        <Button onClick={() => setIsBuilderOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Workflow className="h-5 w-5" />
                        {workflow.name}
                      </CardTitle>
                      <CardDescription>{workflow.description}</CardDescription>
                    </div>
                    <Badge variant="outline">v1</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Agent ID</span>
                    <Badge variant="secondary">{workflow.agent_id}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nodes</span>
                    <span>{workflow.workflow_config?.nodes?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connections</span>
                    <span>{workflow.workflow_config?.edges?.length || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => loadWorkflow(workflow.id)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeWorkflow(workflow.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {workflows.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No workflows created yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first workflow or use a template to get started
                </p>
                <Button onClick={() => setIsBuilderOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nodes</span>
                    <span>{template.nodes.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connections</span>
                    <span>{template.edges.length}</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => loadTemplate(template)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow ? "Edit Workflow" : "Create Workflow"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="workflow_name">Workflow Name</Label>
                <Input
                  id="workflow_name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="e.g., Research Automation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow_agent">Primary Agent</Label>
                <select
                  id="workflow_agent"
                  value={selectedAgentId || ""}
                  onChange={(e) => setSelectedAgentId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select an agent...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 items-end">
                <Button onClick={() => addNode("input", { label: "Input Data" })}>
                  <Database className="mr-2 h-4 w-4" />
                  Add Input
                </Button>
                <Button onClick={() => addNode("agent", { agent_type: "executor" })}>
                  <Bot className="mr-2 h-4 w-4" />
                  Add Agent
                </Button>
                <Button onClick={() => addNode("output", { label: "Output" })}>
                  <Type className="mr-2 h-4 w-4" />
                  Add Output
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workflow_description">Description</Label>
              <Textarea
                id="workflow_description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                rows={2}
              />
            </div>

            <div className="border rounded-lg" style={{ height: "500px" }}>
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

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBuilderOpen(false);
                  setSelectedWorkflow(null);
                  setNodes([]);
                  setEdges([]);
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveWorkflow}>
                <Save className="mr-2 h-4 w-4" />
                Save Workflow
              </Button>
              {selectedWorkflow && (
                <Button onClick={() => executeWorkflow(selectedWorkflow.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Run Workflow
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}