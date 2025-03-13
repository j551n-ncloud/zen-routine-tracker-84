
import React from "react";

interface HabitsViewProps {
  habits: Array<{
    id: number;
    name: string;
    completed: boolean;
  }>;
}

const HabitsView: React.FC<HabitsViewProps> = ({ habits }) => {
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
    </div>
  );
};

export default HabitsView;
