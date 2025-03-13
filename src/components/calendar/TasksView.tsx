
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TasksViewProps {
  tasks: Array<{
    id: number;
    title: string;
    completed: boolean;
  }>;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks }) => {
  return (
    <div className="space-y-2">
      {tasks && tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map(task => (
            <div 
              key={task.id}
              className="p-3 rounded-md bg-accent/50 flex items-center justify-between"
            >
              <span className="text-sm">{task.title}</span>
              {task.completed ? (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                  Completed
                </span>
              ) : (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full">
                  Pending
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <p>No tasks for this date</p>
        </div>
      )}
    </div>
  );
};

export default TasksView;
