import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ClipboardList, Battery, Coffee, X as XIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const sampleData = {
  "2023-07-15": {
    tasks: [
      { id: 1, title: "Team meeting", completed: true },
      { id: 2, title: "Send weekly report", completed: false }
    ],
    habits: [
      { id: 1, name: "Exercise", completed: true },
      { id: 2, name: "Read", completed: true },
      { id: 3, name: "Meditate", completed: false }
    ],
    energy: 8,
    breaks: ["11:30 AM", "3:30 PM"]
  },
  "2023-07-16": {
    tasks: [
      { id: 3, title: "Client call", completed: true }
    ],
    habits: [
      { id: 1, name: "Exercise", completed: false },
      { id: 2, name: "Read", completed: true }
    ],
    energy: 6,
    breaks: ["1:00 PM"]
  }
};

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("tasks");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [breaks, setBreaks] = useState<string[]>([]);
  const [newBreak, setNewBreak] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  
  const [savedEnergyLevels, setSavedEnergyLevels] = useLocalStorage("energy-levels", {});
  const [savedBreaks, setSavedBreaks] = useLocalStorage("breaks", {});
  const [savedTasks, setSavedTasks] = useLocalStorage("tasks", {});
  const [savedHabits, setSavedHabits] = useLocalStorage("habits", {});
  
  const formattedDate = date ? 
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : 
    "";
  
  const getSelectedDateData = () => {
    if (sampleData[formattedDate]) {
      return sampleData[formattedDate];
    }
    
    return {
      tasks: savedTasks[formattedDate] || [],
      habits: savedHabits[formattedDate] || [],
      energy: savedEnergyLevels[formattedDate] || 0,
      breaks: savedBreaks[formattedDate] || []
    };
  };
  
  const selectedDateData = getSelectedDateData();

  const openEditDialog = () => {
    setEnergyLevel(selectedDateData.energy);
    setBreaks(selectedDateData.breaks || []);
    setTasks(selectedDateData.tasks || []);
    setHabits(selectedDateData.habits || []);
    setIsEditDialogOpen(true);
  };

  const saveChanges = () => {
    const updatedEnergyLevels = { ...savedEnergyLevels };
    updatedEnergyLevels[formattedDate] = energyLevel;
    setSavedEnergyLevels(updatedEnergyLevels);

    const updatedBreaks = { ...savedBreaks };
    updatedBreaks[formattedDate] = breaks;
    setSavedBreaks(updatedBreaks);

    const updatedTasks = { ...savedTasks };
    updatedTasks[formattedDate] = tasks;
    setSavedTasks(updatedTasks);

    const updatedHabits = { ...savedHabits };
    updatedHabits[formattedDate] = habits;
    setSavedHabits(updatedHabits);

    setIsEditDialogOpen(false);
    toast.success("Calendar data updated successfully");
  };

  const addBreak = () => {
    if (newBreak) {
      setBreaks([...breaks, newBreak]);
      setNewBreak("");
    }
  };

  const removeBreak = (index: number) => {
    const updatedBreaks = breaks.filter((_, i) => i !== index);
    setBreaks(updatedBreaks);
  };

  const toggleTaskCompletion = (taskId: number) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
  };

  const toggleHabitCompletion = (habitId: number) => {
    const updatedHabits = habits.map(habit => 
      habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
    );
    setHabits(updatedHabits);
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <Button variant="outline" onClick={openEditDialog}>
            Edit Day
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow-subtle">
              <CardContent className="p-6">
                <Calendar 
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="shadow-subtle">
              <CardHeader>
                <CardTitle className="text-lg">
                  {date ? date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="tasks" className="flex-1">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Tasks
                    </TabsTrigger>
                    <TabsTrigger value="habits" className="flex-1">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Habits
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tasks" className="mt-0">
                    {selectedDateData.tasks && selectedDateData.tasks.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDateData.tasks.map(task => (
                          <div 
                            key={task.id}
                            className="p-3 rounded-md bg-accent/50 flex items-center justify-between"
                          >
                            <span className="text-sm">{task.title}</span>
                            {task.completed ? (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                                Completed
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full">
                                Pending
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No tasks for this date</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="habits" className="mt-0">
                    {selectedDateData.habits && selectedDateData.habits.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDateData.habits.map(habit => (
                          <div 
                            key={habit.id}
                            className="p-3 rounded-md bg-accent/50 flex items-center justify-between"
                          >
                            <span className="text-sm">{habit.name}</span>
                            {habit.completed ? (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                                Done
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">
                                Missed
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>No habits for this date</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card className="shadow-subtle">
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Battery className="h-4 w-4 mr-2" />
                  Energy & Breaks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Energy Level</span>
                    <span className="text-sm">{selectedDateData.energy}/10</span>
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(selectedDateData.energy/10) * 100}%` }}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center mb-2">
                    <Coffee className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Break Times</span>
                  </div>
                  
                  {selectedDateData.breaks && selectedDateData.breaks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDateData.breaks.map((breakTime, index) => (
                        <div 
                          key={index}
                          className="rounded-md bg-accent/50 px-3 py-2 text-sm text-center"
                        >
                          {breakTime}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-muted-foreground">
                      <p className="text-sm">No breaks scheduled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Day</DialogTitle>
              <DialogDescription>
                Update information for {date?.toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Energy Level (0-10)</h4>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-right text-sm">{energyLevel}/10</div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Break Times</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBreak}
                    onChange={(e) => setNewBreak(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="flex-1 px-3 py-2 border rounded-md text-sm"
                  />
                  <Button onClick={addBreak} size="sm">Add</Button>
                </div>
                
                {breaks.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {breaks.map((breakTime, index) => (
                      <div key={index} className="flex items-center justify-between bg-accent/50 px-3 py-2 rounded-md">
                        <span className="text-sm">{breakTime}</span>
                        <button
                          onClick={() => removeBreak(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-muted-foreground">
                    <p className="text-sm">No breaks added</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tasks</h4>
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`task-${task.id}`}
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                        />
                        <label
                          htmlFor={`task-${task.id}`}
                          className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {task.title}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-muted-foreground">
                    <p className="text-sm">No tasks for this date</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Habits</h4>
                {habits.length > 0 ? (
                  <div className="space-y-2">
                    {habits.map(habit => (
                      <div key={habit.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`habit-${habit.id}`}
                          checked={habit.completed}
                          onCheckedChange={() => toggleHabitCompletion(habit.id)}
                        />
                        <label
                          htmlFor={`habit-${habit.id}`}
                          className={`text-sm ${habit.completed ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {habit.name}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-muted-foreground">
                    <p className="text-sm">No habits for this date</p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveChanges}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
