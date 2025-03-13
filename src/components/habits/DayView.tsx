
import React, { useState, useEffect } from "react";
import { format, subDays, addDays, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHabitsStorage, Habit } from "@/hooks/use-habits-storage";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface DayViewProps {
  className?: string;
}

// Interface for storing daily habit status
interface DailyHabitStatus {
  [date: string]: {
    [habitId: number]: boolean;
  };
}

const DayView: React.FC<DayViewProps> = ({ className }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { habits, toggleHabit } = useHabitsStorage();
  const [dailyHabitStatus, setDailyHabitStatus] = useLocalStorage<DailyHabitStatus>(
    "zen-tracker-daily-habits", 
    {}
  );
  
  // Format date as string for storage key
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  
  // Get habits with their completed status for the selected date
  const getHabitsForSelectedDay = () => {
    // Initialize the date entry if it doesn't exist
    if (!dailyHabitStatus[dateKey]) {
      dailyHabitStatus[dateKey] = {};
    }
    
    return habits.map(habit => ({
      ...habit,
      completed: dailyHabitStatus[dateKey][habit.id] || false
    }));
  };
  
  const [displayedHabits, setDisplayedHabits] = useState(getHabitsForSelectedDay());
  
  // Update displayed habits when date or habits change
  useEffect(() => {
    setDisplayedHabits(getHabitsForSelectedDay());
  }, [selectedDate, habits, dailyHabitStatus]);
  
  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };
  
  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };
  
  const handleToggleHabit = (id: number) => {
    // Get the current completed status
    const currentHabit = displayedHabits.find(h => h.id === id);
    if (!currentHabit) return;
    
    const completed = currentHabit.completed;
    
    // Create a new object to avoid direct state mutation
    const newDailyHabitStatus = { ...dailyHabitStatus };
    
    // Initialize the date entry if it doesn't exist
    if (!newDailyHabitStatus[dateKey]) {
      newDailyHabitStatus[dateKey] = {};
    }
    
    // Toggle the completion status
    newDailyHabitStatus[dateKey][id] = !completed;
    
    // Update state
    setDailyHabitStatus(newDailyHabitStatus);
    
    // Update streak in the global habits only if it's today
    const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
    if (isToday) {
      toggleHabit(id);
    }
    
    // Update the displayed habits immediately
    setDisplayedHabits(prev => 
      prev.map(habit => 
        habit.id === id ? { ...habit, completed: !completed } : habit
      )
    );
    
    toast.success(`Habit marked as ${completed ? 'not completed' : 'completed'}`);
  };
  
  const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy");
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  
  return (
    <Card className={cn("shadow-subtle", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Daily Habit Tracker</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant={isToday ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-center">
          <h3 className="text-xl font-medium">{formattedDate}</h3>
        </div>
        
        <div className="space-y-2">
          {displayedHabits.length > 0 ? (
            displayedHabits.map((habit) => (
              <div 
                key={habit.id}
                className={cn(
                  "p-3 rounded-md flex items-center justify-between cursor-pointer",
                  habit.completed ? "bg-green-100/50" : "bg-accent/50"
                )}
                onClick={() => handleToggleHabit(habit.id)}
              >
                <span className="text-sm">{habit.name}</span>
                {habit.completed && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No habits to track yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DayView;
