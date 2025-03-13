
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Target, Star, Edit, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from 'sonner';

const FocusToday: React.FC = () => {
  const [mainFocus, setMainFocus] = useLocalStorage('focus-for-today', '');
  const [editingMainFocus, setEditingMainFocus] = useState(false);
  const [mainFocusInput, setMainFocusInput] = useState(mainFocus);
  
  const [priorities, setPriorities] = useLocalStorage('top-3-priorities', ['', '', '']);
  
  const [editingPriority, setEditingPriority] = useState<number | null>(null);
  const [priorityInput, setPriorityInput] = useState('');

  useEffect(() => {
    setMainFocusInput(mainFocus);
  }, [mainFocus]);

  useEffect(() => {
    // Check if it's a new day
    const today = new Date().toDateString();
    const lastVisitDate = localStorage.getItem("last-visit-date");
    
    if (lastVisitDate !== today) {
      // Reset focus and priorities for the new day
      setMainFocus('');
      setPriorities(['', '', '']);
      localStorage.setItem("last-visit-date", today);
    }
  }, []);

  const handleSaveMainFocus = () => {
    setMainFocus(mainFocusInput);
    setEditingMainFocus(false);
    toast.success('Focus updated');
  };

  const handleSavePriority = (index: number) => {
    const newPriorities = [...priorities];
    newPriorities[index] = priorityInput;
    setPriorities(newPriorities);
    setEditingPriority(null);
    toast.success('Priority updated');
  };

  const handleEditPriority = (index: number) => {
    setPriorityInput(priorities[index]);
    setEditingPriority(index);
  };

  const handleAddPriority = () => {
    if (priorities.length < 3) {
      setPriorities([...priorities, '']);
      setPriorityInput('');
      setEditingPriority(priorities.length);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Focus */}
      <Card className="overflow-hidden shadow-subtle">
        <CardContent className="p-0">
          <div className="p-4 bg-primary/5 border-b flex items-center space-x-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">My Focus for Today</h3>
          </div>
          
          <div className="p-4">
            {editingMainFocus ? (
              <div className="space-y-2">
                <Textarea
                  value={mainFocusInput}
                  onChange={(e) => setMainFocusInput(e.target.value)}
                  placeholder="What's your main focus for today?"
                  className="resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveMainFocus}
                    className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative group min-h-[70px] flex items-center">
                {mainFocus ? (
                  <p className="text-sm">{mainFocus}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to set your main focus for today</p>
                )}
                <button
                  onClick={() => setEditingMainFocus(true)}
                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Priorities */}
      <Card className="overflow-hidden shadow-subtle">
        <CardContent className="p-0">
          <div className="p-4 bg-primary/5 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Top 3 Priorities</h3>
            </div>
            {priorities.filter(p => p).length < 3 && (
              <button
                onClick={handleAddPriority}
                className="inline-flex items-center text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </button>
            )}
          </div>
          
          <div className="divide-y">
            {priorities.map((priority, index) => (
              <div 
                key={index}
                className="p-4 relative group"
              >
                {editingPriority === index ? (
                  <div className="flex space-x-2">
                    <Input
                      value={priorityInput}
                      onChange={(e) => setPriorityInput(e.target.value)}
                      className="text-sm flex-1"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSavePriority(index)}
                      className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shrink-0"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div 
                      className={cn(
                        "h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center",
                        index === 0 ? "bg-orange-100 text-orange-500" : 
                        index === 1 ? "bg-yellow-100 text-yellow-500" : 
                        "bg-blue-100 text-blue-500"
                      )}
                    >
                      {index + 1}
                    </div>
                    {priority ? (
                      <p className="text-sm flex-1">{priority}</p>
                    ) : (
                      <p className="text-sm flex-1 text-muted-foreground">Click to add priority #{index + 1}</p>
                    )}
                    <button
                      onClick={() => handleEditPriority(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FocusToday;
