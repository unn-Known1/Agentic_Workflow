import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pause, 
  Square,
  RotateCcw,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { api, Execution } from "@/lib/api";
import { toast } from "sonner";

export default function ExecutionsPage() {
  const { id } = useParams();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [executionStatus, setExecutionStatus] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadExecutions();
    
    if (id) {
      loadExecution(parseInt(id));
    }

    const interval = setInterval(() => {
      if (autoRefresh) {
        loadExecutions();
        if (selectedExecution) {
          loadExecutionStatus(selectedExecution.id);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, autoRefresh, selectedExecution]);

  const loadExecutions = async () => {
    try {
      const data = await api.getExecutions();
      setExecutions(data);
    } catch (error) {
      toast.error("Failed to load executions");
    }
  };

  const loadExecution = async (executionId: number) => {
    try {
      const execution = await api.getExecution(executionId);
      setSelectedExecution(execution);
      loadExecutionStatus(executionId);
    } catch (error) {
      toast.error("Failed to load execution");
    }
  };

  const loadExecutionStatus = async (executionId: number) => {
    try {
      const status = await api.getExecutionStatus(executionId);
      setExecutionStatus(status);
    } catch (error) {
      console.error("Failed to load execution status");
    }
  };

  const handleStopExecution = async (executionId: number) => {
    try {
      await api.stopExecution(executionId);
      toast.success("Execution stopped");
      loadExecutions();
    } catch (error) {
      toast.error("Failed to stop execution");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-500";
      case "failed": return "text-red-500";
      case "running": return "text-blue-500";
      case "paused": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "failed": return "destructive";
      case "running": return "outline";
      case "paused": return "secondary";
      default: return "outline";
    }
  };

  const formatDuration = (start: string, end: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = endTime - startTime;
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Execution Monitor</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and control workflow executions in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="mr-2 h-4 w-4" />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>All workflow executions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {executions.length > 0 ? (
                  <div className="space-y-3">
                    {executions.map((execution) => (
                      <div
                        key={execution.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                          selectedExecution?.id === execution.id ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => loadExecution(execution.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">Execution #{execution.id}</h3>
                              <Badge variant={getStatusBadgeVariant(execution.status)}>
                                {execution.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Workflow ID: {execution.workflow_id}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(execution.started_at, execution.completed_at)}
                              </span>
                              {execution.metrics?.total_tokens && (
                                <span>
                                  {execution.metrics.total_tokens} tokens
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {execution.status === "running" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopExecution(execution.id);
                              }}
                            >
                              <Square className="h-3 w-3 mr-1" />
                              Stop
                            </Button>
                          )}
                        </div>

                        {execution.execution_log && (
                          <div className="mt-3 p-2 bg-muted rounded text-xs font-mono max-h-20 overflow-y-auto">
                            <div className="line-clamp-3">{execution.execution_log}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>No executions yet</p>
                    <p className="text-sm mt-1">Run a workflow to see execution history</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedExecution ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Execution Details</CardTitle>
                  <CardDescription>ID: {selectedExecution.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={getStatusBadgeVariant(selectedExecution.status)}>
                        {selectedExecution.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Workflow ID</span>
                      <span>{selectedExecution.workflow_id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span>
                        {formatDuration(selectedExecution.started_at, selectedExecution.completed_at)}
                      </span>
                    </div>
                  </div>

                  {selectedExecution.metrics && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Metrics</h4>
                      <div className="space-y-1 text-sm">
                        {selectedExecution.metrics.total_tokens && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tokens</span>
                            <span>{selectedExecution.metrics.total_tokens}</span>
                          </div>
                        )}
                        {selectedExecution.metrics.steps_completed !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Steps Completed</span>
                            <span>{selectedExecution.metrics.steps_completed}</span>
                          </div>
                        )}
                        {selectedExecution.metrics.steps_failed !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Steps Failed</span>
                            <span>{selectedExecution.metrics.steps_failed}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedExecution.status === "running" && (
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={() => handleStopExecution(selectedExecution.id)}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop Execution
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Real-time Status</CardTitle>
                  <CardDescription>Live execution updates</CardDescription>
                </CardHeader>
                <CardContent>
                  {executionStatus ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity className={`h-4 w-4 ${getStatusColor(executionStatus.status)}`} />
                        <span className="text-sm font-medium capitalize">{executionStatus.status}</span>
                      </div>

                      {executionStatus.log && executionStatus.log.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Recent Logs</h4>
                          <ScrollArea className="h-[200px] bg-muted rounded p-2">
                            <div className="space-y-1 text-xs font-mono">
                              {executionStatus.log.slice(-10).map((log: string, i: number) => (
                                <div key={i} className="text-muted-foreground">{log}</div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {executionStatus.metrics && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Progress</h4>
                          <Progress
                            value={
                              executionStatus.metrics.steps_completed
                                ? (executionStatus.metrics.steps_completed / 
                                   (executionStatus.metrics.steps_completed + executionStatus.metrics.steps_failed)) * 100
                                : 0
                            }
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Completed: {executionStatus.metrics.steps_completed || 0}</span>
                            <span>Failed: {executionStatus.metrics.steps_failed || 0}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No real-time data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No execution selected</h3>
                <p className="text-muted-foreground text-sm">
                  Select an execution from the list to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}