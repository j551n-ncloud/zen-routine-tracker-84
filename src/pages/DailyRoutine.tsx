
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Check, Clock, Edit, GripVertical, Plus, Save, Trash2, Calendar, ListChecks } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface RoutineTask {
  id: number;
  title: string;
  description?: string;
  time?: string;
  completed: boolean;
}

interface RoutineTemplate {
  id: number;
  name: string;
  tasks: RoutineTask[];
}

const DailyRoutine = () => {
  // Store current routine tasks
  const [routineTasks, setRoutineTasks] = useLocalStorage<RoutineTask[]>("daily-routine-tasks", []);
  
  // Store routine templates
  const [templates, setTemplates] = useLocalStorage<RoutineTemplate[]>("routine-templates", []);
  
  // Track which template is active
  const [activeTemplate, setActiveTemplate] = useLocalStorage<number | null>("active-template", null);
  
  // UI state
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  
  const [newTask, setNewTask] = useState<Omit<RoutineTask, "id" | "completed">>({ title: "", time: "", description: "" });
  const [newTemplate, setNewTemplate] = useState({ name: "" });
  
  const [editingTask, setEditingTask] = useState<RoutineTask | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<RoutineTemplate | null>(null);
  
  // Handle adding a new task
  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    const task: RoutineTask = {
      id: Date.now(),
      title: newTask.title,
      time: newTask.time,
      description: newTask.description,
      completed: false
    };
    
    setRoutineTasks([...routineTasks, task]);
    setNewTask({ title: "", time: "", description: "" });
    setIsAddTaskOpen(false);
    toast.success("Task added to routine");
  };
  
  // Handle adding a new template
  const handleAddTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    
    const template: RoutineTemplate = {
      id: Date.now(),
      name: newTemplate.name,
      tasks: [...routineTasks] // Copy current routine tasks
    };
    
    setTemplates([...templates, template]);
    setNewTemplate({ name: "" });
    setIsAddTemplateOpen(false);
    toast.success("Template created");
  };
  
  // Handle applying a template
  const handleApplyTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setRoutineTasks([...template.tasks]);
      setActiveTemplate(templateId);
      toast.success(`Applied template: ${template.name}`);
    }
  };
  
  // Handle editing a task
  const handleEditTask = () => {
    if (!editingTask) return;
    
    if (!editingTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    
    const updatedTasks = routineTasks.map(task => 
      task.id === editingTask.id ? editingTask : task
    );
    
    setRoutineTasks(updatedTasks);
    setEditingTask(null);
    setIsEditTaskOpen(false);
    toast.success("Task updated");
  };
  
  // Handle editing a template
  const handleEditTemplate = () => {
    if (!editingTemplate) return;
    
    if (!editingTemplate.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    
    const updatedTemplates = templates.map(template => 
      template.id === editingTemplate.id ? editingTemplate : template
    );
    
    setTemplates(updatedTemplates);
    setEditingTemplate(null);
    setIsEditTemplateOpen(false);
    toast.success("Template updated");
  };
  
  // Handle deleting a task
  const handleDeleteTask = (taskId: number) => {
    const updatedTasks = routineTasks.filter(task => task.id !== taskId);
    setRoutineTasks(updatedTasks);
    toast.success("Task removed from routine");
  };
  
  // Handle deleting a template
  const handleDeleteTemplate = (templateId: number) => {
    const updatedTemplates = templates.filter(template => template.id !== templateId);
    setTemplates(updatedTemplates);
    
    // If the active template was deleted, reset it
    if (activeTemplate === templateId) {
      setActiveTemplate(null);
    }
    
    toast.success("Template deleted");
  };
  
  // Handle toggling a task's completion status
  const handleToggleTask = (taskId: number) => {
    const updatedTasks = routineTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    
    setRoutineTasks(updatedTasks);
  };
  
  // Handle task reordering via drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(routineTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setRoutineTasks(items);
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Daily Routine</h1>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setIsAddTemplateOpen(true)}>
              <Save className="mr-2 h-4 w-4" />
              Save as Template
            </Button>
            <Button onClick={() => setIsAddTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="routine">
          <TabsList className="mb-4">
            <TabsTrigger value="routine">
              <ListChecks className="h-4 w-4 mr-2" />
              My Routine
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Calendar className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="routine" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Today's Routine</span>
                  {activeTemplate !== null && (
                    <span className="text-sm font-normal text-muted-foreground">
                      Using: {templates.find(t => t.id === activeTemplate)?.name}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Your daily routine tasks in order
                </CardDescription>
              </CardHeader>
              <CardContent>
                {routineTasks.length > 0 ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="tasks">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {routineTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-start p-3 rounded-md border ${task.completed ? 'bg-muted/30' : 'bg-card'}`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex-shrink-0 mr-3 mt-1 text-muted-foreground"
                                  >
                                    <GripVertical className="h-5 w-5" />
                                  </div>
                                  
                                  <Checkbox
                                    checked={task.completed}
                                    onCheckedChange={() => handleToggleTask(task.id)}
                                    className="mr-3 mt-1"
                                  />
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                        {task.title}
                                      </h3>
                                      {task.time && (
                                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {task.time}
                                        </span>
                                      )}
                                    </div>
                                    {task.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center space-x-1 ml-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        setEditingTask(task);
                                        setIsEditTaskOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive"
                                      onClick={() => handleDeleteTask(task.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No routine tasks yet</p>
                    <p className="text-sm mt-1">Add tasks or apply a template to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>
                      {template.tasks.length} tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {template.tasks.map(task => (
                          <div key={task.id} className="flex items-center p-2 rounded-md bg-muted/40 text-sm">
                            <div className="w-1 h-1 rounded-full bg-primary/80 mr-2" />
                            <span>{task.title}</span>
                            {task.time && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {task.time}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsEditTemplateOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                    <Button 
                      onClick={() => handleApplyTemplate(template.id)}
                      disabled={activeTemplate === template.id}
                    >
                      {activeTemplate === template.id ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Applied
                        </>
                      ) : "Apply"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {templates.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <p>No templates yet</p>
                    <p className="text-sm mt-1">Save your routine as a template for quick reuse</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Routine Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input 
                id="task-title" 
                value={newTask.title} 
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="e.g., Morning Meditation"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-time">Time (optional)</Label>
              <Input 
                id="task-time" 
                value={newTask.time || ""} 
                onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                placeholder="e.g., 7:00 AM"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-description">Description (optional)</Label>
              <Textarea 
                id="task-description" 
                value={newTask.description || ""} 
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Additional details about this task"
                rows={3}
              />
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
      
      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Routine Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-task-title">Task Title</Label>
                <Input 
                  id="edit-task-title" 
                  value={editingTask.title} 
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-task-time">Time (optional)</Label>
                <Input 
                  id="edit-task-time" 
                  value={editingTask.time || ""} 
                  onChange={(e) => setEditingTask({...editingTask, time: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-task-description">Description (optional)</Label>
                <Textarea 
                  id="edit-task-description" 
                  value={editingTask.description || ""} 
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="edit-task-completed"
                  checked={editingTask.completed}
                  onCheckedChange={(checked) => setEditingTask({
                    ...editingTask, 
                    completed: checked as boolean
                  })}
                />
                <Label htmlFor="edit-task-completed" className="text-sm">Mark as completed</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTaskOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTask}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Template Dialog */}
      <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input 
                id="template-name" 
                value={newTemplate.name} 
                onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                placeholder="e.g., Productive Workday"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Tasks to Include</Label>
              
              <ScrollArea className="h-36 border rounded-md p-2">
                <div className="space-y-1">
                  {routineTasks.length > 0 ? (
                    routineTasks.map(task => (
                      <div key={task.id} className="flex items-center p-2 rounded-md bg-muted/40 text-sm">
                        <div className="w-1 h-1 rounded-full bg-primary/80 mr-2" />
                        <span>{task.title}</span>
                        {task.time && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {task.time}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No tasks in the current routine
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTemplateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTemplate}
              disabled={routineTasks.length === 0}
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Template Dialog */}
      <Dialog open={isEditTemplateOpen} onOpenChange={setIsEditTemplateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-template-name">Template Name</Label>
                <Input 
                  id="edit-template-name" 
                  value={editingTemplate.name} 
                  onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Tasks in Template</Label>
                
                <ScrollArea className="h-36 border rounded-md p-2">
                  <div className="space-y-1">
                    {editingTemplate.tasks.length > 0 ? (
                      editingTemplate.tasks.map(task => (
                        <div key={task.id} className="flex items-center p-2 rounded-md bg-muted/40 text-sm">
                          <div className="w-1 h-1 rounded-full bg-primary/80 mr-2" />
                          <span>{task.title}</span>
                          {task.time && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {task.time}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        No tasks in this template
                      </p>
                    )}
                  </div>
                </ScrollArea>
                
                <p className="text-xs text-muted-foreground">
                  Note: You can update the template tasks by applying it, making changes to the routine, and saving it again.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTemplateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTemplate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DailyRoutine;
