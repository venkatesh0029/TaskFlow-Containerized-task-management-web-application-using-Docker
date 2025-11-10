import { useState, useEffect } from "react";
import { getTasks, createTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";
import { TaskFilters } from "./TaskFilters";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Moon, Sun } from "lucide-react";
import { ConfettiBurst } from "./ConfettiBurst";

interface Task {
  id: string; // keep as string for UI keys; backend uses numeric, we'll coerce
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  created_at: string;
}

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState("");
  const { toast } = useToast();
  const [dark, setDark] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "gantt">("list");
  const [CalendarImpl, setCalendarImpl] = useState<any>(null);
  const [GanttImpl, setGanttImpl] = useState<any>(null);

  // Avoid Vite resolving optional peer deps by using a runtime importer
  const runtimeImport = async (specifier: string): Promise<any> => {
    // eslint-disable-next-line no-new-func
    const importer = new Function("s", "return import(s)");
    return importer(specifier);
  };

  useEffect(() => {
    fetchUserProfile();
    fetchTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, search, statusFilter, priorityFilter]);

  useEffect(() => {
    // Lazy-load heavy libs only when needed
    if (viewMode === "calendar" && !CalendarImpl) {
      runtimeImport("react-big-calendar").then((mod: any) => {
        setCalendarImpl(mod);
      }).catch(() => {
        toast({ title: "Calendar unavailable", description: "Install react-big-calendar to enable calendar view.", variant: "default" });
      });
    }
    if (viewMode === "gantt" && !GanttImpl) {
      // Try two popular options: prefer frappe-gantt via wrapper, else react-gantt-chart
      runtimeImport("frappe-gantt").then((mod: any) => {
        setGanttImpl({ type: "frappe", mod });
      }).catch(async () => {
        try {
          const alt = await runtimeImport("react-gantt-chart");
          setGanttImpl({ type: "react-gantt-chart", mod: alt });
        } catch (_e) {
          toast({ title: "Gantt unavailable", description: "Install frappe-gantt or react-gantt-chart to enable Gantt view.", variant: "default" });
        }
      });
    }
  }, [viewMode]);

  useEffect(() => {
    // If calendar component becomes available, inject CSS via CDN for sane defaults
    if (CalendarImpl) {
      const id = "rbc-stylesheet";
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/react-big-calendar@latest/lib/css/react-big-calendar.css";
        document.head.appendChild(link);
      }
    }
  }, [CalendarImpl]);

  const fetchUserProfile = async () => {
    // SQL backend demo: no auth wired yet
    setUserName("Demo User");
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      const mapped: Task[] = (data || []).map((t: any) => ({
        id: String(t.id),
        title: t.title,
        description: t.description ?? null,
        status: t.status,
        priority: t.priority,
        category: t.category ?? null,
        due_date: t.due_date,
        created_at: t.created_at,
      }));
      setTasks(mapped);
    } catch {
      toast({ title: "Error", description: "Failed to fetch tasks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    if (search) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter((task) => task.category === categoryFilter);
    }

    // Sort
    const priorityRank: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 };
    switch (sortBy) {
      case 'created_asc':
        filtered.sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
        break;
      case 'created_desc':
        filtered.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        break;
      case 'due_asc':
        filtered.sort((a, b) => ((a.due_date || '') > (b.due_date || '') ? 1 : -1));
        break;
      case 'due_desc':
        filtered.sort((a, b) => ((a.due_date || '') < (b.due_date || '') ? 1 : -1));
        break;
      case 'priority_desc':
        filtered.sort((a, b) => (priorityRank[b.priority] - priorityRank[a.priority]));
        break;
      case 'priority_asc':
        filtered.sort((a, b) => (priorityRank[a.priority] - priorityRank[b.priority]));
        break;
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async (data: any) => {
    try {
      await createTask({
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? 'todo',
        priority: data.priority ?? 'medium',
        due_date: data.due_date ? data.due_date.toISOString() : null,
      } as any);
      toast({ title: "Success", description: "Task created successfully" });
      fetchTasks();
      setDialogOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  };

  const handleUpdateTask = async (data: any) => {
    if (!editingTask) return;
    try {
      await apiUpdateTask(Number(editingTask.id), {
        ...data,
        due_date: data.due_date ? data.due_date.toISOString() : null,
      } as any);
      toast({ title: "Success", description: "Task updated successfully" });
      fetchTasks();
      setDialogOpen(false);
      setEditingTask(null);
    } catch {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleInlineEdit = async (updated: Task) => {
    try {
      await apiUpdateTask(Number(updated.id), { title: updated.title, description: updated.description } as any);
      fetchTasks();
    } catch {}
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const bulkComplete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) {
      await handleToggleComplete(id, 'todo');
    }
    setSelectedIds(new Set());
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) {
      await handleDeleteTask(id);
    }
    setSelectedIds(new Set());
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await apiDeleteTask(Number(id));
      toast({ title: "Success", description: "Task deleted successfully" });
      fetchTasks();
    } catch {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  const handleToggleComplete = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "todo" : "completed";
    try {
      await apiUpdateTask(Number(id), { status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null } as any);
      fetchTasks();
      if (newStatus === 'completed') {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1400);
      }
    } catch {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    // SQL backend demo: no session management yet
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    if (next) root.classList.add('dark'); else root.classList.remove('dark');
  };

  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const activeCount = tasks.filter((t) => t.status !== "completed").length;
  const nowIso = new Date().toISOString();
  const overdueCount = tasks.filter((t) => !!t.due_date && t.due_date < nowIso && t.status !== "completed").length;
  const completedPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const renderListView = () => (
    loading ? (
      <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
    ) : filteredTasks.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {tasks.length === 0 ? "No tasks yet. Create your first task!" : "No tasks match your filters."}
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            selectedIds={selectedIds}
            onSelectToggle={toggleSelect}
            onEdit={(task) => {
              setEditingTask(task);
              setDialogOpen(true);
            }}
            onInlineEdit={handleInlineEdit}
            onDelete={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
          />
        ))}
      </div>
    )
  );

  const renderCalendarView = () => {
    if (!CalendarImpl) {
      return (
        <div className="text-sm text-muted-foreground py-8">Calendar library not loaded. Ensure <code>react-big-calendar</code> is installed.</div>
      );
    }
    const { Calendar, dateFnsLocalizer } = CalendarImpl;
    // react-big-calendar needs a localizer; derive from date-fns if available
    let localizer: any = undefined;
    try {
      // Lazy require date-fns parts if present
      const dfns: any = (window as any).dateFns || null;
      if (dfns && dfns.format && dfns.parse && dfns.startOfWeek && dfns.getDay) {
        localizer = dateFnsLocalizer({
          format: dfns.format,
          parse: dfns.parse,
          startOfWeek: dfns.startOfWeek,
          getDay: dfns.getDay,
          locales: {}
        });
      }
    } catch {}
    const events = tasks.filter(t => t.due_date).map(t => ({
      title: t.title,
      start: new Date(t.due_date as string),
      end: new Date(t.due_date as string),
      allDay: true,
    }));
    return (
      <div className="h-[600px] rounded-md border">
        {localizer ? (
          <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" />
        ) : (
          <div className="p-4 text-sm text-muted-foreground">Calendar localizer not available. Install <code>date-fns</code> to enable full calendar rendering.</div>
        )}
      </div>
    );
  };

  const renderGanttView = () => {
    if (!GanttImpl) {
      return (
        <div className="text-sm text-muted-foreground py-8">Gantt library not loaded. Install <code>frappe-gantt</code> or <code>react-gantt-chart</code>.</div>
      );
    }
    // Provide a minimal neutral fallback: list of tasks with due dates
    const ganttTasks = tasks
      .filter(t => !!t.due_date)
      .map(t => ({
        id: t.id,
        name: t.title,
        start: new Date(t.created_at),
        end: new Date(t.due_date as string),
        progress: t.status === "completed" ? 100 : 0,
      }));
    return (
      <div className="rounded-md border p-4">
        <div className="text-sm text-muted-foreground mb-2">Gantt preview (install a Gantt lib for full chart)</div>
        <div className="space-y-2">
          {ganttTasks.map(gt => (
            <div key={gt.id} className="flex items-center gap-3">
              <div className="w-40 truncate" title={gt.name}>{gt.name}</div>
              <div className="flex-1 h-2 bg-muted rounded">
                <div className="h-2 bg-primary rounded" style={{ width: `${gt.progress}%` }} />
              </div>
              <div className="text-xs text-muted-foreground">{gt.start.toLocaleDateString()} → {gt.end.toLocaleDateString()}</div>
            </div>
          ))}
          {ganttTasks.length === 0 && (
            <div className="text-sm text-muted-foreground">No tasks with date ranges to display.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto p-6">
        <ConfettiBurst show={celebrate} />
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent mb-2">
              TaskFlow
            </h1>
            <p className="text-muted-foreground">Welcome back, {userName}!</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
            <Button variant="outline" onClick={toggleTheme}>
              {dark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              {dark ? 'Light' : 'Dark'}
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Analytics top bar */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border p-3 flex items-center justify-between">
            <span>✅ Completed</span>
            <span className="font-medium">{completedCount} ({completedPct}%)</span>
          </div>
          <div className="rounded-md border p-3 flex items-center justify-between">
            <span>⏳ In Progress</span>
            <span className="font-medium">{activeCount}</span>
          </div>
          <div className="rounded-md border p-3 flex items-center justify-between">
            <span>🔥 Overdue</span>
            <span className="font-medium">{overdueCount}</span>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>List View</Button>
          <Button variant={viewMode === 'calendar' ? 'default' : 'outline'} onClick={() => setViewMode('calendar')}>Calendar View</Button>
          <Button variant={viewMode === 'gantt' ? 'default' : 'outline'} onClick={() => setViewMode('gantt')}>Gantt</Button>
        </div>

        <div className="mb-6">
          <TaskFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            categories={[...new Set(tasks.map((t) => t.category).filter(Boolean))] as string[]}
          />
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" disabled={selectedIds.size === 0} onClick={bulkComplete}>Mark Done</Button>
          <Button variant="outline" disabled={selectedIds.size === 0} onClick={bulkDelete}>Delete Selected</Button>
          {selectedIds.size > 0 && (
            <span className="text-sm text-muted-foreground self-center">{selectedIds.size} selected</span>
          )}
        </div>

        {viewMode === 'list' && renderListView()}
        {viewMode === 'calendar' && renderCalendarView()}
        {viewMode === 'gantt' && renderGanttView()}

        <TaskDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingTask(null);
          }}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          task={editingTask}
        />
      </div>
    </div>
  );
}