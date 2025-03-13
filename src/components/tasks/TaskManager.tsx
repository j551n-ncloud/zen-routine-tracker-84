import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  Plus, 
  Edit, 
  Trash, 
  AlertTriangle, 
  ArrowUp, 
  Circle, 
  CalendarDays 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useTasksStorage } from '@/hooks/use-tasks-storage';

// Priority badge component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const getColor = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-600';
      case 'medium':
        return 'bg-yellow-100 text-yellow-600';
      case 'low':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getIcon = () => {
    switch (priority) {
      case 'high':
        return <ArrowUp className="w-3 h-3" />;
      case 'medium':
        return <Circle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center text-xs rounded-full px-2 py-0.5 font-medium",
        getColor()
      )}
    >
      {getIcon()}
      <span className="ml-1 capitalize">{priority}</span>
    </span>
  );
};

const TaskManager: React.FC = () => {
  const { 
    tasks, 
    upcomingTasks, 
    addTask, 
    toggleTaskCompletion,
    removeTask 
  } = useTasksStorage();
  
  const [activeTab, setActiveTab] = useState('today');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium',
    dueDate: new Date(),
  });

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskDate = new Date(dateObj);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) return 'Today';
    if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return taskDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const isOverdue = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(dateObj);
    taskDate.setHours(0, 0, 0, 0);
    
    return taskDate < today && !isToday(dateObj);
  };

  const isToday = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  };

  const getActiveTasks = () => {
    if (activeTab === 'upcoming') {
      return upcomingTasks;
    }
    return tasks;
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    addTask({
      title: newTask.title,
      priority: newTask.priority as 'high' | 'medium' | 'low',
      completed: false,
      dueDate: newTask.dueDate,
    });

    setNewTask({
      title: '',
      priority: 'medium',
      dueDate: new Date(),
    });
    
    setIsAddTaskOpen(false);
    toast.success("Task added successfully");
  };

  const handleDeleteTask = (id: number) => {
    removeTask(id);
    toast.success("Task deleted successfully");
  };

  return (
    <Card className="shadow-subtle overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center px-4 pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>
          <button 
            className="rounded-full p-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            onClick={() => setIsAddTaskOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <CardContent className="p-0">
          <TabsContent value="today" className="m-0">
            <div className="divide-y">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <div 
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between p-4 group hover:bg-muted/30 transition-colors",
                      task.completed && "opacity-60"
                    )}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={cn(
                          "rounded-full flex-shrink-0 flex items-center justify-center w-6 h-6 transition-all",
                          task.completed 
                            ? "bg-primary/20 text-primary" 
                            : "border border-muted-foreground/30 text-transparent hover:border-primary hover:text-primary"
                        )}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "text-sm font-medium truncate", 
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </p>
                        <div className="flex items-center mt-0.5 space-x-2">
                          <PriorityBadge priority={task.priority} />
                          <span 
                            className={cn(
                              "text-xs flex items-center",
                              isOverdue(task.dueDate) && !task.completed 
                                ? "text-red-500" 
                                : "text-muted-foreground"
                            )}
                          >
                            {isOverdue(task.dueDate) && !task.completed && (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-accent"
                              onClick={() => handleDeleteTask(task.id)}>
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No tasks for today</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="upcoming" className="m-0">
            <div className="divide-y">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-4 group hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-6 h-6 flex items-center justify-center">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center mt-0.5 space-x-2">
                          <PriorityBadge priority={task.priority} />
                          <span className="text-xs flex items-center text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-accent"
                              onClick={() => handleDeleteTask(task.id)}>
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <p>No upcoming tasks</p>
                </div>
              )}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input 
                id="task-title" 
                value={newTask.title} 
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="What do you need to do?"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select 
                value={newTask.priority} 
                onValueChange={(value) => setNewTask({...newTask, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {newTask.dueDate ? format(newTask.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newTask.dueDate}
                    onSelect={(date) => date && setNewTask({...newTask, dueDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TaskManager;
