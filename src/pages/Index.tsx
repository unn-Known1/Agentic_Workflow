import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Workflow, 
  Database, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Zap,
  BookOpen
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboardData] = await Promise.all([
        api.getDashboardMetrics(),
      ]);
      setMetrics(dashboardData);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "failed": return "bg-red-500";
      case "running": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Agentic Workflow Environment</h1>
          <p className="text-muted-foreground mt-2">
            Personal closed-loop agentic workflow automation and intelligent task management
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/agents")}>
            <Bot className="mr-2 h-4 w-4" />
            Manage Agents
          </Button>
          <Button onClick={() => navigate("/workflows")}>
            <Workflow className="mr-2 h-4 w-4" />
            Build Workflows
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.executions?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.executions?.success_rate?.toFixed(1) || 0}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.agents?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Specialized AI agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics?.tokens?.total || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total tokens consumed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.knowledge?.document_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Documents indexed
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Execution Status</CardTitle>
                <CardDescription>Current workflow execution status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <Badge variant="secondary">{metrics?.executions?.completed || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Running</span>
                  </div>
                  <Badge variant="secondary">{metrics?.executions?.running || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Failed</span>
                  </div>
                  <Badge variant="secondary">{metrics?.executions?.failed || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => navigate("/agents/new")}>
                  <Bot className="mr-2 h-4 w-4" />
                  Create New Agent
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigate("/workflows/new")}>
                  <Workflow className="mr-2 h-4 w-4" />
                  Design Workflow
                </Button>
                <Button className="w-full" variant="outline" onClick={() => navigate("/knowledge")}>
                  <Database className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Latest workflow execution history</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {metrics?.recent_executions?.length > 0 ? (
                  <div className="space-y-4">
                    {metrics.recent_executions.map((execution: any) => (
                      <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Execution #{execution.id}</p>
                          <p className="text-xs text-muted-foreground">
                            Workflow ID: {execution.workflow_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Started: {new Date(execution.started_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(execution.status)}`} />
                          <span className="text-sm capitalize">{execution.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No executions yet. Create a workflow and run it to see results here.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>Your document repository for RAG</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Documents Indexed</p>
                    <p className="text-2xl font-bold">{metrics?.knowledge?.document_count || 0}</p>
                  </div>
                  <Button onClick={() => navigate("/knowledge")}>Manage Documents</Button>
                </div>
                <Progress value={metrics?.knowledge?.document_count || 0} max={100} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}