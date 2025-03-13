
import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useHabitsStorage } from "@/hooks/use-habits-storage";
import { format } from "date-fns";

interface MonthlyViewProps {
  className?: string;
}

// Define props for our custom day component that matches what the Calendar expects
interface CalendarDayProps {
  date: Date;
  selected?: boolean;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({ className }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { habits } = useHabitsStorage();
  const [habitCompletionData, setHabitCompletionData] = useState<Record<string, number>>({});
  
  // Load real habit completion data from localStorage
  useEffect(() => {
    try {
      const dailyHabitsData = localStorage.getItem("zen-tracker-daily-habits");
      const calendarHabitsData = localStorage.getItem("calendar-habits");
      
      const completionData: Record<string, number> = {};
      
      // Process daily habits data
      if (dailyHabitsData) {
        const dailyHabits = JSON.parse(dailyHabitsData);
        
        Object.entries(dailyHabits).forEach(([date, habitsObj]: [string, any]) => {
          const completedCount = Object.values(habitsObj).filter(value => !!value).length;
          if (completedCount > 0) {
            completionData[date] = (completionData[date] || 0) + completedCount;
          }
        });
      }
      
      // Process calendar habits data
      if (calendarHabitsData) {
        const calendarHabits = JSON.parse(calendarHabitsData);
        
        Object.entries(calendarHabits).forEach(([date, habitsArray]: [string, any]) => {
          const completedCount = habitsArray.filter((h: any) => h.completed).length;
          if (completedCount > 0) {
            completionData[date] = (completionData[date] || 0) + completedCount;
          }
        });
      }
      
      setHabitCompletionData(completionData);
    } catch (error) {
      console.error("Error loading habit completion data:", error);
    }
  }, []);
  
  // Function to customize day rendering
  const customDayRender = (day: Date, isSelected: boolean) => {
    // Format date to match the keys in habitCompletionData
    const dateKey = format(day, 'yyyy-MM-dd');
    
    // Get completion count for this day (if any)
    const completionCount = habitCompletionData[dateKey] || 0;
    
    // Determine color based on habit completion count
    const getColor = () => {
      if (completionCount === 0) return "bg-muted";
      if (completionCount < 3) return "bg-blue-400";
      if (completionCount < 5) return "bg-green-400";
      return "bg-purple-400";
    };
    
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        {/* Background indicator based on habit completion */}
        {completionCount > 0 && (
          <div 
            className={cn(
              "absolute inset-0 opacity-20 rounded-sm",
              getColor()
            )}
          />
        )}
        
        {/* Day number */}
        <span>{day.getDate()}</span>
        
        {/* Dot indicator for completion */}
        {completionCount > 0 && (
          <div className="absolute bottom-1 left-0 right-0 flex justify-center">
            <div 
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                getColor()
              )}
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className={cn("shadow-subtle", className)}>
      <CardContent className="p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md overflow-hidden"
          classNames={{
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
          }}
          components={{
            Day: ({ date, selected }: CalendarDayProps) => customDayRender(date, selected || false),
          }}
        />
      </CardContent>
    </Card>
  );
};

export default MonthlyView;
