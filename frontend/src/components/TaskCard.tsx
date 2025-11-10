import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Circle, Clock, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  created_at: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, currentStatus: string) => void;
  selectedIds?: Set<string>;
  onSelectToggle?: (id: string) => void;
  onInlineEdit?: (updated: Task) => void;
}

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning text-warning-foreground",
  high: "bg-destructive text-destructive-foreground",
  urgent: "bg-urgent text-urgent-foreground",
};

const statusColors = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  archived: "bg-muted text-muted-foreground",
};

export function TaskCard({ task, onEdit, onDelete, onToggleComplete, selectedIds, onSelectToggle, onInlineEdit }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const progress = task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0;
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  
  return (
    <Card className="p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted/50 rounded mb-3 overflow-hidden">
        <div
          className={`h-full ${isCompleted ? 'bg-success' : 'bg-primary'} transition-all`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {onSelectToggle && (
            <Checkbox checked={selectedIds?.has(task.id)} onCheckedChange={() => onSelectToggle(task.id)} className="mt-1" />
          )}
        <button
          onClick={() => onToggleComplete(task.id, task.status)}
          className="mt-1 flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-success transition-transform duration-200 scale-110" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-lg mb-1 ${isCompleted ? "line-through text-muted-foreground" : ""}`}
            onDoubleClick={() => setEditingTitle(true)}
          >
            {editingTitle ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => { setEditingTitle(false); if (title !== task.title) (onInlineEdit || onEdit)({ ...task, title }); }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className="w-full bg-transparent border-b outline-none"
                autoFocus
              />
            ) : (
              title
            )}
          </h3>
          
          <div onDoubleClick={() => setEditingDesc(true)}>
            {editingDesc ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => { setEditingDesc(false); if (description !== (task.description || "")) (onInlineEdit || onEdit)({ ...task, description }); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) (e.target as HTMLTextAreaElement).blur(); }}
                className="w-full bg-transparent border rounded p-1 text-sm"
                rows={3}
                autoFocus
              />
            ) : (
              task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {task.description}
                </p>
              )
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
              {task.priority}
            </Badge>
            <Badge className={statusColors[task.status as keyof typeof statusColors]}>
              {task.status.replace('_', ' ')}
            </Badge>
            {task.category && (
              <Badge variant="outline">{task.category}</Badge>
            )}
          </div>
          
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Calendar className="h-3 w-3" />
              <span>Due: {format(new Date(task.due_date), "MMM d, yyyy")}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Created: {format(new Date(task.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>
        
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(task)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}