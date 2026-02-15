import { Handle, Position, NodeProps } from "reactflow";
import { Bot, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AgentNode({ data }: NodeProps) {
  return (
    <Card className="p-3 min-w-[150px]">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2 mb-2">
        <Bot className="h-4 w-4" />
        <span className="font-medium text-sm">{data.label}</span>
        <Badge variant="outline" className="ml-auto text-xs">
          {data.agent_type || "agent"}
        </Badge>
      </div>
      
      {data.description && (
        <p className="text-xs text-muted-foreground mb-2">{data.description}</p>
      )}
      
      <div className="flex gap-1">
        <Handle type="source" position={Position.Bottom} id="output" />
      </div>
    </Card>
  );
}