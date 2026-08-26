import { categoryColor, PRIORITY_STYLES, STATUS_STYLES } from "@/lib/format";
import type { TaskPriority, TaskStatus } from "@/lib/types";

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge className={PRIORITY_STYLES[priority]}>{priority}</Badge>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={STATUS_STYLES[status]}>{status.replace("_", " ")}</Badge>;
}

export function CategoryBadge({ category }: { category: string }) {
  return <Badge className={categoryColor(category)}>{category}</Badge>;
}
