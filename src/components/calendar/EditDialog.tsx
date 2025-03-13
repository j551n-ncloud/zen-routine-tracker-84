
import React, { useState } from "react";
import { X as XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface EditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | undefined;
  energyLevel: number;
  setEnergyLevel: (level: number) => void;
  breaks: string[];
  setBreaks: (breaks: string[]) => void;
  tasks: any[];
  setTasks: (tasks: any[]) => void;
  habits: any[];
  setHabits: (habits: any[]) => void;
  onSave: () => void;
}

const EditDialog: React.FC<EditDialogProps> = ({
  isOpen,
  onOpenChange,
  date,
  energyLevel,
  setEnergyLevel,
  breaks,
  setBreaks,
  tasks,
  setTasks,
  habits,
  setHabits,
  onSave
}) => {
  const [newBreak, setNewBreak] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newHabit, setNewHabit] = useState("");

  const addBreak = () => {
    if (newBreak) {
      setBreaks([...breaks, newBreak]);
      setNewBreak("");
    }
  };

  const removeBreak = (index: number) => {
    const updatedBreaks = breaks.filter((_, i) => i !== index);
    setBreaks(updatedBreaks);
  };

  const toggleTaskCompletion = (taskId: number) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
  };

  const toggleHabitCompletion = (habitId: number) => {
    const updatedHabits = habits.map(habit => 
      habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
    );
    setHabits(updatedHabits);
  };
  
  const addNewTask = () => {
    if (newTask.trim()) {
      const newTaskObj = {
        id: Date.now(),
        title: newTask,
        completed: false
      };
      setTasks([...tasks, newTaskObj]);
      setNewTask("");
    }
  };
  
  const addNewHabit = () => {
    if (newHabit.trim()) {
      const newHabitObj = {
        id: Date.now(),
        name: newHabit,
        completed: false
      };
      setHabits([...habits, newHabitObj]);
      setNewHabit("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Day</DialogTitle>
          <DialogDescription>
            Update information for {date?.toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Energy Level (0-10)</h4>
            <input
              type="range"
              min="0"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-right text-sm">{energyLevel}/10</div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Break Times</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBreak}
                onChange={(e) => setNewBreak(e.target.value)}
                placeholder="e.g. 10:30 AM"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button onClick={addBreak} size="sm">Add</Button>
            </div>
            
            {breaks.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {breaks.map((breakTime, index) => (
                  <div key={index} className="flex items-center justify-between bg-accent/50 px-3 py-2 rounded-md">
                    <span className="text-sm">{breakTime}</span>
                    <button
                      onClick={() => removeBreak(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-muted-foreground">
                <p className="text-sm">No breaks added</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Tasks</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button onClick={addNewTask} size="sm">Add</Button>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-2 mt-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {task.title}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-muted-foreground">
                <p className="text-sm">No tasks for this date</p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Habits</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
                placeholder="Add a new habit"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button onClick={addNewHabit} size="sm">Add</Button>
            </div>
            {habits.length > 0 ? (
              <div className="space-y-2 mt-2">
                {habits.map(habit => (
                  <div key={habit.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`habit-${habit.id}`}
                      checked={habit.completed}
                      onCheckedChange={() => toggleHabitCompletion(habit.id)}
                    />
                    <label
                      htmlFor={`habit-${habit.id}`}
                      className={`text-sm ${habit.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {habit.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-muted-foreground">
                <p className="text-sm">No habits for this date</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDialog;
