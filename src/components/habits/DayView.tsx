
import React, { useState } from "react";
import { format, subDays, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHabitsStorage, Habit } from "@/hooks/use-habits-storage";
import { toast } from "sonner";

interface DayViewProps {
  className?: string;
}

const DayView: React.FC<DayViewProps> = ({ className }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { habits, toggleHabit } = useHabitsStorage();
  
  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };
  
  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };
  
  const handleToggleHabit = (id: number) => {
    toggleHabit(id);
    toast.success("Habit status updated");
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
          {habits.length > 0 ? (
            habits.map((habit) => (
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
