import { Handle, Position, NodeProps } from "reactflow";
import { Type } from "lucide-react";
import { Card } from "@/components/ui/card";

export function OutputNode({ data }: NodeProps) {
  return (
    <Card className="p-3 min-w-[120px] bg-green-50 dark:bg-green-950">
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-green-600" />
        <span className="font-medium text-sm text-green-900 dark:text-green-100">
          {data.label}
        </span>
      </div>
      
      {data.output_type && (
        <p className="text-xs text-green-600 mt-1">{data.output_type}</p>
      )}
    </Card>
  );
}