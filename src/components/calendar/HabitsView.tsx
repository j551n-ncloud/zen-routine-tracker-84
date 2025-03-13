
import React from "react";
import { CheckCircle, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useHabitsStorage } from "@/hooks/use-habits-storage";

interface HabitsViewProps {
  habits: Array<{
    id: number;
    name: string;
    completed: boolean;
  }>;
}

const HabitsView: React.FC<HabitsViewProps> = ({ habits }) => {
  const { toggleHabit } = useHabitsStorage();

  const handleToggleHabit = (id: number, completed: boolean) => {
    toggleHabit(id);
    toast.success(`Habit marked as ${completed ? 'not completed' : 'completed'}`);
  };

  return (
    <div className="space-y-2">
      {habits && habits.length > 0 ? (
        <div className="space-y-2">
          {habits.map(habit => (
            <div 
              key={habit.id}
              className="p-3 rounded-md bg-accent/50 flex items-center justify-between"
            >
              <span className="text-sm">{habit.name}</span>
              <div className="flex items-center space-x-2">
                {habit.completed ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    Missed
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleToggleHabit(habit.id, habit.completed)}
                  className="h-6 px-2 ml-2"
                >
                  {habit.completed ? 
                    <X className="h-3 w-3 mr-1" /> : 
                    <CheckSquare className="h-3 w-3 mr-1" />
                  }
                  {habit.completed ? 'Undo' : 'Complete'}
                </Button>
              </div>
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
