
import React, { useEffect } from "react";
import { CheckCircle, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useHabitsStorage } from "@/hooks/use-habits-storage";

interface HabitsViewProps {
  habits: Array<{
    id: number;
    name: string;
    completed: boolean;
  }>;
  date?: Date;
  onToggleHabit?: (id: number, completed: boolean) => void;
}

// Interface for storing daily habit status
interface DailyHabitStatus {
  [date: string]: {
    [habitId: number]: boolean;
  };
}

const HabitsView: React.FC<HabitsViewProps> = ({ habits, date, onToggleHabit }) => {
  const [dailyHabitStatus, setDailyHabitStatus] = useLocalStorage<DailyHabitStatus>(
    "zen-tracker-daily-habits", 
    {}
  );
  const { toggleHabit, habits: allHabits } = useHabitsStorage();
  const [calendarHabits, setCalendarHabits] = useLocalStorage<Record<string, any[]>>("calendar-habits", {});

  // Update local habit state when global habits change (for edits/deletes)
  useEffect(() => {
    if (date && habits.length > 0) {
      const dateKey = format(date, "yyyy-MM-dd");
      
      // Find any habits that were deleted
      const currentHabitIds = new Set(habits.map(h => h.id));
      const globalHabitIds = new Set(allHabits.map(h => h.id));
      
      // Check if any current habits no longer exist in global habit store
      const hasDeletedHabits = Array.from(currentHabitIds).some(id => !globalHabitIds.has(id));
      
      // Update names for edited habits
      const hasNameChanges = habits.some(h => {
        const globalHabit = allHabits.find(gh => gh.id === h.id);
        return globalHabit && globalHabit.name !== h.name;
      });
      
      if (hasDeletedHabits || hasNameChanges) {
        // Sync with global habits
        const updatedHabits = allHabits.map(h => ({
          id: h.id,
          name: h.name,
          completed: habits.find(ch => ch.id === h.id)?.completed || false
        }));
        
        // Update calendar habits for this date
        const updatedCalendarHabits = { ...calendarHabits };
        updatedCalendarHabits[dateKey] = updatedHabits;
        setCalendarHabits(updatedCalendarHabits);
        
        // Also update daily habit status
        const newDailyHabitStatus = { ...dailyHabitStatus };
        
        // Initialize the date entry if it doesn't exist
        if (!newDailyHabitStatus[dateKey]) {
          newDailyHabitStatus[dateKey] = {};
        }
        
        // Clean up deleted habits
        Object.keys(newDailyHabitStatus[dateKey]).forEach(habitId => {
          if (!globalHabitIds.has(Number(habitId))) {
            delete newDailyHabitStatus[dateKey][Number(habitId)];
          }
        });
        
        setDailyHabitStatus(newDailyHabitStatus);
      }
    }
  }, [allHabits, date, habits]);

  const handleToggleHabit = (id: number, completed: boolean) => {
    if (onToggleHabit) {
      onToggleHabit(id, completed);
    } else if (date) {
      // If we have a date, update the daily habit status
      const dateKey = format(date, "yyyy-MM-dd");
      
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
      
      // Update calendar habits
      const updatedCalendarHabits = { ...calendarHabits };
      if (!updatedCalendarHabits[dateKey]) {
        updatedCalendarHabits[dateKey] = habits;
      }
      
      updatedCalendarHabits[dateKey] = updatedCalendarHabits[dateKey].map(h => 
        h.id === id ? { ...h, completed: !completed } : h
      );
      
      setCalendarHabits(updatedCalendarHabits);
      
      // Check if it's today and update the global habit state as well
      const today = new Date();
      const isToday = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
      if (isToday) {
        toggleHabit(id);
      }
      
      toast.success(`Habit marked as ${completed ? 'not completed' : 'completed'}`);
    } else {
      // If no date is provided, update the global habit state
      toggleHabit(id);
      toast.success(`Habit marked as ${completed ? 'not completed' : 'completed'}`);
    }
  };

  return (
    <div className="space-y-2">
      {habits && habits.length > 0 ? (
        <div className="space-y-2">
          {habits.map(habit => (
            <div 
              key={habit.id}
              className={`p-3 rounded-md flex items-center justify-between cursor-pointer ${habit.completed ? "bg-green-100/50" : "bg-accent/50"}`}
              onClick={() => handleToggleHabit(habit.id, habit.completed)}
            >
              <span className="text-sm">{habit.name}</span>
              {habit.completed && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Done
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
    </div>
  );
};

export default HabitsView;
