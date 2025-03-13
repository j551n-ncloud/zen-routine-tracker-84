
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import our new components
import TasksView from "@/components/calendar/TasksView";
import HabitsView from "@/components/calendar/HabitsView";
import EnergyView from "@/components/calendar/EnergyView";
import EditDialog from "@/components/calendar/EditDialog";
import { formatDate, getSelectedDateData } from "@/components/calendar/calendarUtils";
import { useTasksStorage } from "@/hooks/use-tasks-storage";
import { useHabitsStorage } from "@/hooks/use-habits-storage";

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("tasks");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [breaks, setBreaks] = useState<string[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  
  const [savedEnergyLevels, setSavedEnergyLevels] = useLocalStorage("energy-levels", {});
  const [savedBreaks, setSavedBreaks] = useLocalStorage("breaks", {});
  const [savedTasks, setSavedTasks] = useLocalStorage("calendar-tasks", {});
  const [savedHabits, setSavedHabits] = useLocalStorage("calendar-habits", {});
  
  const { toggleTaskCompletion } = useTasksStorage();
  const { toggleHabit } = useHabitsStorage();
  
  const formattedDate = formatDate(date);
  
  const selectedDateData = getSelectedDateData(
    date,
    savedTasks,
    savedHabits,
    savedEnergyLevels,
    savedBreaks
  );

  // Sync with Focus Today data
  const [focusForToday, setFocusForToday] = useLocalStorage("focus-for-today", "");
  const [priorities, setPriorities] = useLocalStorage("top-3-priorities", []);
  const [currentEnergyLevel, setCurrentEnergyLevel] = useLocalStorage("current-energy-level", 5);
  const [plannedBreaks, setPlannedBreaks] = useLocalStorage("planned-breaks", []);

  useEffect(() => {
    // On date change to today, update with the latest focus data
    const today = new Date();
    if (date && date.toDateString() === today.toDateString()) {
      // Update energy level for today from stored current energy
      const updatedEnergyLevels = { ...savedEnergyLevels };
      updatedEnergyLevels[formattedDate] = currentEnergyLevel;
      setSavedEnergyLevels(updatedEnergyLevels);
      
      // Update breaks for today from stored planned breaks
      const updatedBreaks = { ...savedBreaks };
      updatedBreaks[formattedDate] = plannedBreaks;
      setSavedBreaks(updatedBreaks);
    }
  }, [date, currentEnergyLevel, plannedBreaks]);

  const openEditDialog = () => {
    setEnergyLevel(selectedDateData.energy);
    setBreaks(selectedDateData.breaks || []);
    setTasks(selectedDateData.tasks || []);
    setHabits(selectedDateData.habits || []);
    setIsEditDialogOpen(true);
  };

  const saveChanges = () => {
    // Update energy levels
    const updatedEnergyLevels = { ...savedEnergyLevels };
    updatedEnergyLevels[formattedDate] = energyLevel;
    setSavedEnergyLevels(updatedEnergyLevels);

    // Update breaks
    const updatedBreaks = { ...savedBreaks };
    updatedBreaks[formattedDate] = breaks;
    setSavedBreaks(updatedBreaks);

    // Update tasks
    const updatedTasks = { ...savedTasks };
    updatedTasks[formattedDate] = tasks;
    setSavedTasks(updatedTasks);

    // Update habits
    const updatedHabits = { ...savedHabits };
    updatedHabits[formattedDate] = habits;
    setSavedHabits(updatedHabits);

    // If it's today, also update the focus, priorities, energy and breaks
    const today = new Date();
    if (date && date.toDateString() === today.toDateString()) {
      setCurrentEnergyLevel(energyLevel);
      setPlannedBreaks(breaks);
    }

    setIsEditDialogOpen(false);
    toast.success("Calendar data updated successfully");
  };
  
  const handleToggleCalendarTask = (id: number, completed: boolean) => {
    // Update in the task manager
    toggleTaskCompletion(id);
    
    // Update in the calendar data
    if (savedTasks[formattedDate]) {
      const updatedTasks = { ...savedTasks };
      updatedTasks[formattedDate] = savedTasks[formattedDate].map(task => 
        task.id === id ? { ...task, completed: !completed } : task
      );
      setSavedTasks(updatedTasks);
    }
    
    toast.success(`Task marked as ${completed ? 'not completed' : 'completed'}`);
  };
  
  const handleToggleCalendarHabit = (id: number, completed: boolean) => {
    // Toggle in habits store
    toggleHabit(id);
    
    // Update in calendar data
    if (savedHabits[formattedDate]) {
      const updatedHabits = { ...savedHabits };
      updatedHabits[formattedDate] = savedHabits[formattedDate].map(habit => 
        habit.id === id ? { ...habit, completed: !completed } : habit
      );
      setSavedHabits(updatedHabits);
    }
    
    toast.success(`Habit marked as ${completed ? 'not completed' : 'completed'}`);
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
                  className="rounded-md pointer-events-auto"
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
                    <TasksView tasks={selectedDateData.tasks} />
                  </TabsContent>
                  
                  <TabsContent value="habits" className="mt-0">
                    <HabitsView 
                      habits={selectedDateData.habits} 
                      onToggleHabit={handleToggleCalendarHabit}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card className="shadow-subtle">
              <CardHeader>
                <CardTitle className="text-sm">
                  Energy & Breaks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EnergyView 
                  energyLevel={selectedDateData.energy}
                  breaks={selectedDateData.breaks}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <EditDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          date={date}
          energyLevel={energyLevel}
          setEnergyLevel={setEnergyLevel}
          breaks={breaks}
          setBreaks={setBreaks}
          tasks={tasks}
          setTasks={setTasks}
          habits={habits}
          setHabits={setHabits}
          onSave={saveChanges}
        />
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
