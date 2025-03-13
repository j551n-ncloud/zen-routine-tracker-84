
import React from "react";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHabitsStorage } from "@/hooks/use-habits-storage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HabitsWidget = () => {
  const { habits, toggleHabit } = useHabitsStorage();
  const navigate = useNavigate();
  
  // Display only 4 habits at most on the dashboard
  const displayHabits = habits.slice(0, 4);
  
  // Get completion status
  const completedCount = habits.filter(habit => habit.completed).length;
  const totalHabits = habits.length;
  const completionPercentage = totalHabits > 0 
    ? Math.round((completedCount / totalHabits) * 100) 
    : 0;
    
  return (
    <Card className="shadow-subtle">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Today's Habits</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => navigate("/habits")}
        >
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {displayHabits.length > 0 ? (
          <div className="space-y-2">
            {displayHabits.map(habit => (
              <div 
                key={habit.id}
                className={cn(
                  "p-3 rounded-md flex items-center justify-between cursor-pointer",
                  habit.completed ? "bg-green-100/50 dark:bg-green-900/20" : "bg-accent/50"
                )}
                onClick={() => toggleHabit(habit.id)}
              >
                <span className="text-sm">{habit.name}</span>
                {habit.completed && (
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>No habits to track yet</p>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Today's progress</span>
            <span className="text-sm font-medium">{completedCount}/{totalHabits}</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitsWidget;
