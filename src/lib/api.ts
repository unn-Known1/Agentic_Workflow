import { toast } from "sonner";

// Get API base URL from environment or default to localhost for development
const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl;
  return "http://localhost:8000/api";
};

const API_BASE_URL = getApiBaseUrl();

export interface Agent {
  id: number;
  name: string;
  role: string;
  description: string;
  personality: Record<string, any>;
  system_prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: number;
  name: string;
  description: string;
  agent_id: number;
  workflow_config: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Execution {
  id: number;
  workflow_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  execution_log: string | null;
  metrics: Record<string, any>;
}

export interface Document {
  id: number;
  filename: string;
  file_type: string;
  content_preview: string;
  metadata: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      toast.error(`API Error: ${error.message}`);
      throw error;
    }
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    return this.request("/agents");
  }

  async createAgent(agent: Omit<Agent, "id" | "created_at" | "updated_at" | "is_active">): Promise<Agent> {
    return this.request("/agents", {
      method: "POST",
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: number, agent: Omit<Agent, "id" | "created_at" | "updated_at" | "is_active">): Promise<Agent> {
    return this.request(`/agents/${id}`, {
      method: "PUT",
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: number): Promise<void> {
    return this.request(`/agents/${id}`, { method: "DELETE" });
  }

  async cloneAgent(id: number): Promise<Agent> {
    return this.request(`/agents/${id}/clone`, { method: "POST" });
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    return this.request("/workflows");
  }

  async createWorkflow(workflow: Omit<Workflow, "id" | "created_at" | "updated_at" | "is_active">): Promise<Workflow> {
    return this.request("/workflows", {
      method: "POST",
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: number, workflow: Omit<Workflow, "id" | "created_at" | "updated_at" | "is_active">): Promise<Workflow> {
    return this.request(`/workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: number): Promise<void> {
    return this.request(`/workflows/${id}`, { method: "DELETE" });
  }

  async getWorkflowTemplates(): Promise<any> {
    return this.request("/workflows/templates/list");
  }

  // Knowledge Base
  async uploadDocument(file: File, tags: string[] = []): Promise<{ document_id: number; embedding_id: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tags", JSON.stringify(tags));

    const response = await fetch(`${API_BASE_URL}/knowledge/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getDocuments(): Promise<Document[]> {
    return this.request("/knowledge/documents");
  }

  async deleteDocument(id: number): Promise<void> {
    return this.request(`/knowledge/documents/${id}`, { method: "DELETE" });
  }

  async searchKnowledge(query: string, topK: number = 5, filterMetadata?: Record<string, any>): Promise<any> {
    return this.request("/knowledge/search", {
      method: "POST",
      body: JSON.stringify({
        query,
        top_k: topK,
        filter_metadata: filterMetadata,
      }),
    });
  }

  async getKnowledgeStats(): Promise<any> {
    return this.request("/knowledge/stats");
  }

  // Execution
  async executeWorkflow(workflowId: number, inputData: Record<string, any> = {}): Promise<Execution> {
    return this.request("/execution/execute", {
      method: "POST",
      body: JSON.stringify({
        workflow_id: workflowId,
        input_data: inputData,
      }),
    });
  }

  async getExecutions(): Promise<Execution[]> {
    return this.request("/execution/executions");
  }

  async getExecution(id: number): Promise<Execution> {
    return this.request(`/execution/executions/${id}`);
  }

  async getExecutionStatus(id: number): Promise<any> {
    return this.request(`/execution/executions/${id}/status`);
  }

  async stopExecution(id: number): Promise<void> {
    return this.request(`/execution/executions/${id}/stop`, { method: "POST" });
  }

  // Monitoring
  async getDashboardMetrics(): Promise<any> {
    return this.request("/monitoring/dashboard");
  }

  async getExecutionStats(): Promise<any> {
    return this.request("/monitoring/executions/stats");
  }

  async getAgentStats(): Promise<any> {
    return this.request("/monitoring/agents/stats");
  }

  async getTokenUsage(): Promise<any> {
    return this.request("/monitoring/tokens/history");
  }

  async resetTokenUsage(): Promise<void> {
    return this.request("/monitoring/tokens/reset", { method: "POST" });
  }

  // Tools
  async getTools(): Promise<any> {
    return this.request("/tools/list");
  }

  async registerTool(tool: any): Promise<any> {
    return this.request("/tools/register", {
      method: "POST",
      body: JSON.stringify(tool),
    });
  }

  async deleteTool(name: string): Promise<void> {
    return this.request(`/tools/${name}`, { method: "DELETE" });
  }

  async executeTool(name: string, parameters: Record<string, any>): Promise<any> {
    return this.request(`/tools/${name}/execute`, {
      method: "POST",
      body: JSON.stringify(parameters),
    });
  }

  async getBuiltInTools(): Promise<any> {
    return this.request("/tools/built-in/list");
  }
}

export const api = new ApiClient();