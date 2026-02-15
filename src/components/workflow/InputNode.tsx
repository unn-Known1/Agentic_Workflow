import { Handle, Position, NodeProps } from "reactflow";
import { Database } from "lucide-react";
import { Card } from "@/components/ui/card";

export function InputNode({ data }: NodeProps) {
  return (
    <Card className="p-3 min-w-[120px] bg-blue-50 dark:bg-blue-950">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-sm text-blue-900 dark:text-blue-100">
          {data.label}
        </span>
      </div>
      
      {data.input_type && (
        <p className="text-xs text-blue-600 mt-1">{data.input_type}</p>
      )}
      
      <Handle type="source" position={Position.Bottom} id="output" />
    </Card>
  );
}