
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ClipboardList, Edit, Clock, BarChart, CalendarIcon } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import TasksView from "@/components/calendar/TasksView";
import HabitsView from "@/components/calendar/HabitsView";
import EnergyView from "@/components/calendar/EnergyView";
import EditDialog from "@/components/calendar/EditDialog";
import { formatDate, getSelectedDateData } from "@/components/calendar/calendarUtils";
import { useTasksStorage } from "@/hooks/use-tasks-storage";
import { useHabitsStorage } from "@/hooks/use-habits-storage";
import { Separator } from "@/components/ui/separator";
import Timeline from "@/components/calendar/Timeline";

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("tasks");
  const [timelineTab, setTimelineTab] = useState("daily");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [breaks, setBreaks] = useState<string[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [dailyFocusInput, setDailyFocusInput] = useState("");
  const [prioritiesInput, setPrioritiesInput] = useState<string[]>([]);
  
  const [savedEnergyLevels, setSavedEnergyLevels] = useLocalStorage("energy-levels", {});
  const [savedBreaks, setSavedBreaks] = useLocalStorage("breaks", {});
  const [savedTasks, setSavedTasks] = useLocalStorage("calendar-tasks", {});
  const [savedHabits, setSavedHabits] = useLocalStorage("calendar-habits", {});
  
  const [dailyFocus, setDailyFocus] = useLocalStorage('calendar-daily-focus', {});
  const [dailyPriorities, setDailyPriorities] = useLocalStorage('calendar-daily-priorities', {});
  
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

  // Get all dates with data for the timeline
  const getAllDatesWithData = () => {
    const allDates = new Set<string>();
    
    // Collect all dates from different data sources
    Object.keys(savedTasks).forEach(date => allDates.add(date));
    Object.keys(savedHabits).forEach(date => allDates.add(date));
    Object.keys(savedEnergyLevels).forEach(date => allDates.add(date));
    Object.keys(dailyFocus).forEach(date => allDates.add(date));
    Object.keys(dailyPriorities).forEach(date => allDates.add(date));
    
    // Convert to array and sort by date (most recent first)
    return Array.from(allDates)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const [focusForToday, setFocusForToday] = useLocalStorage("focus-for-today", "");
  const [priorities, setPriorities] = useLocalStorage("top-3-priorities", []);
  const [currentEnergyLevel, setCurrentEnergyLevel] = useLocalStorage("current-energy-level", 5);
  const [plannedBreaks, setPlannedBreaks] = useLocalStorage("planned-breaks", []);

  // Check if it's a new day and reset values if needed
  useEffect(() => {
    const today = new Date();
    const todayStr = formatDate(today);
    const lastVisitDate = localStorage.getItem("last-visit-date");
    
    if (lastVisitDate !== todayStr) {
      // It's a new day, reset focus and priorities for today
      setFocusForToday("");
      setPriorities([]);
      setPlannedBreaks([]);
      localStorage.setItem("last-visit-date", todayStr);
    }
  }, []);

  useEffect(() => {
    const today = new Date();
    if (date && date.toDateString() === today.toDateString()) {
      const updatedEnergyLevels = { ...savedEnergyLevels };
      updatedEnergyLevels[formattedDate] = currentEnergyLevel;
      setSavedEnergyLevels(updatedEnergyLevels);
      
      const updatedBreaks = { ...savedBreaks };
      updatedBreaks[formattedDate] = plannedBreaks;
      setSavedBreaks(updatedBreaks);
      
      const updatedFocus = { ...dailyFocus };
      updatedFocus[formattedDate] = focusForToday;
      setDailyFocus(updatedFocus);
      
      const updatedPriorities = { ...dailyPriorities };
      updatedPriorities[formattedDate] = priorities;
      setDailyPriorities(updatedPriorities);
    }
  }, [date, currentEnergyLevel, plannedBreaks, focusForToday, priorities]);

  const openEditDialog = () => {
    // Set the values based on the selected date
    setEnergyLevel(selectedDateData.energy);
    setBreaks(selectedDateData.breaks || []);
    setTasks(selectedDateData.tasks || []);
    setHabits(selectedDateData.habits || []);
    setDailyFocusInput(dailyFocus[formattedDate] || "");
    setPrioritiesInput(dailyPriorities[formattedDate] || []);
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
    
    // Update daily focus and priorities
    const updatedFocus = { ...dailyFocus };
    updatedFocus[formattedDate] = dailyFocusInput;
    setDailyFocus(updatedFocus);
    
    const updatedPriorities = { ...dailyPriorities };
    updatedPriorities[formattedDate] = prioritiesInput;
    setDailyPriorities(updatedPriorities);

    // If the date is today, update the current values too
    const today = new Date();
    if (date && date.toDateString() === today.toDateString()) {
      setCurrentEnergyLevel(energyLevel);
      setPlannedBreaks(breaks);
      setFocusForToday(dailyFocusInput);
      setPriorities(prioritiesInput);
    }

    setIsEditDialogOpen(false);
    toast.success("Calendar data updated successfully");
  };
  
  const handleToggleCalendarTask = (id: number, completed: boolean) => {
    toggleTaskCompletion(id);
    
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
    toggleHabit(id);
    
    if (savedHabits[formattedDate]) {
      const updatedHabits = { ...savedHabits };
      updatedHabits[formattedDate] = savedHabits[formattedDate].map(habit => 
        habit.id === id ? { ...habit, completed: !completed } : habit
      );
      setSavedHabits(updatedHabits);
    }
    
    toast.success(`Habit marked as ${completed ? 'not completed' : 'completed'}`);
  };
  
  const getDailyFocus = () => {
    return dailyFocus[formattedDate] || "";
  };
  
  const getDailyPriorities = () => {
    return dailyPriorities[formattedDate] || [];
  };

  const handleEditBreaks = () => {
    openEditDialog();
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

        <Tabs defaultValue="calendar">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-0">
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
                  <CardContent className="space-y-4">
                    {getDailyFocus() && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Focus for the Day</h3>
                        <p className="text-sm bg-primary/5 p-3 rounded-md">{getDailyFocus()}</p>
                      </div>
                    )}
                    
                    {getDailyPriorities().length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Top Priorities</h3>
                        <div className="space-y-1">
                          {getDailyPriorities().map((priority, index) => (
                            <div key={index} className="text-sm bg-accent/40 p-2 rounded-md flex items-center">
                              <div className="h-5 w-5 flex items-center justify-center bg-primary/10 rounded-full text-xs mr-2">
                                {index + 1}
                              </div>
                              {priority}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
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
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm">Energy & Breaks</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleEditBreaks}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
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
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <Card className="shadow-subtle">
              <CardHeader>
                <CardTitle>Your Progress Timeline</CardTitle>
                <CardDescription>Review your past daily routines, focus areas, priorities, and achievements</CardDescription>
                
                <div className="mt-2">
                  <Tabs value={timelineTab} onValueChange={setTimelineTab} className="w-full">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="daily" className="flex-1">
                        <Clock className="h-4 w-4 mr-2" />
                        Daily Routine
                      </TabsTrigger>
                      <TabsTrigger value="focus" className="flex-1">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Focus & Priorities
                      </TabsTrigger>
                      <TabsTrigger value="stats" className="flex-1">
                        <BarChart className="h-4 w-4 mr-2" />
                        Progress Stats
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <Timeline 
                  dates={getAllDatesWithData()}
                  timelineTab={timelineTab}
                  dailyFocus={dailyFocus}
                  dailyPriorities={dailyPriorities}
                  savedTasks={savedTasks}
                  savedHabits={savedHabits}
                  savedEnergyLevels={savedEnergyLevels}
                  savedBreaks={savedBreaks}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
          dailyFocus={dailyFocusInput}
          setDailyFocus={setDailyFocusInput}
          priorities={prioritiesInput}
          setPriorities={setPrioritiesInput}
          onSave={saveChanges}
        />
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
