
import React from "react";
import { CheckCircle, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HabitsViewProps {
  habits: Array<{
    id: number;
    name: string;
    completed: boolean;
  }>;
  onToggleHabit?: (id: number, completed: boolean) => void;
}

const HabitsView: React.FC<HabitsViewProps> = ({ habits, onToggleHabit }) => {
  const handleToggleHabit = (id: number, completed: boolean) => {
    if (onToggleHabit) {
      onToggleHabit(id, completed);
    } else {
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
