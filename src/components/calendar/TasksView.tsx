
import React from "react";
import { CheckCircle, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TasksViewProps {
  tasks: Array<{
    id: number;
    title: string;
    completed: boolean;
  }>;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks }) => {
  const handleToggleTask = (id: number, completed: boolean) => {
    // This will be implemented in the Calendar component
    // We'll pass this up via props
    toast.success(`Task marked as ${completed ? 'not completed' : 'completed'}`);
  };

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
              <div className="flex items-center space-x-2">
                {task.completed ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full flex items-center">
                    <X className="h-3 w-3 mr-1" />
                    Pending
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleToggleTask(task.id, task.completed)}
                  className="h-6 px-2 ml-2"
                >
                  {task.completed ? 
                    <X className="h-3 w-3 mr-1" /> : 
                    <CheckSquare className="h-3 w-3 mr-1" />
                  }
                  {task.completed ? 'Undo' : 'Complete'}
                </Button>
              </div>
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
