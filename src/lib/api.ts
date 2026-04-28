import { toast } from "sonner";
// Get API base URL from environment or default to localhost for development
// In production, this should always be set via VITE_API_BASE_URL
const getApiBaseUrl = (): string => {
  // Check for environment variable (Vite uses import.meta.env)
  // For Vite, env vars must be prefixed with VITE_
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim() !== "") {
    // Ensure URL ends with /api
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }
  // Development fallback with localhost
  // Check if we're running on localhost
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:8000/api";
  }
  // Production fallback - this should NOT happen if environment is configured correctly
  console.warn("WARNING: Using localhost fallback for API_BASE_URL. Set VITE_API_BASE_URL in production!");
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
