
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Battery, Clock, Coffee, Plus, Edit } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/use-local-storage';

const EnergyTracker: React.FC = () => {
  const [energyLevel, setEnergyLevel] = useLocalStorage('current-energy-level', 7);
  const [peakHours, setPeakHours] = useLocalStorage('peak-hours', ['9:00 AM - 11:00 AM', '4:00 PM - 6:00 PM']);
  const [breaks, setBreaks] = useLocalStorage('planned-breaks', ['11:30 AM', '3:30 PM']);
  
  const [newBreak, setNewBreak] = useState('');
  const [isAddingBreak, setIsAddingBreak] = useState(false);
  const [editingPeakHour, setEditingPeakHour] = useState<number | null>(null);
  const [newPeakHour, setNewPeakHour] = useState('');

  // Function to determine energy level color
  const getEnergyColor = () => {
    if (energyLevel <= 3) return "bg-red-100 text-red-500";
    if (energyLevel <= 6) return "bg-yellow-100 text-yellow-500";
    return "bg-green-100 text-green-500";
  };

  // Function to determine energy level label
  const getEnergyLabel = () => {
    if (energyLevel <= 3) return "Low";
    if (energyLevel <= 6) return "Moderate";
    return "High";
  };

  const handleAddBreak = () => {
    if (isAddingBreak) {
      if (newBreak.trim()) {
        setBreaks([...breaks, newBreak]);
        setNewBreak('');
        toast.success('Break time added');
      } else {
        toast.error('Please enter a valid break time');
      }
      setIsAddingBreak(false);
    } else {
      setIsAddingBreak(true);
    }
  };

  const startEditPeakHour = (index: number) => {
    setEditingPeakHour(index);
    setNewPeakHour(peakHours[index]);
  };

  const savePeakHour = () => {
    if (editingPeakHour !== null && newPeakHour.trim()) {
      const updatedPeakHours = [...peakHours];
      updatedPeakHours[editingPeakHour] = newPeakHour;
      setPeakHours(updatedPeakHours);
      setEditingPeakHour(null);
      toast.success('Peak hours updated');
    } else {
      toast.error('Please enter valid peak hours');
    }
  };

  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Sync with calendar data
  useEffect(() => {
    try {
      const today = formatDate(new Date());
      
      // Update energy levels in calendar data
      const energyLevelsData = localStorage.getItem("energy-levels");
      if (energyLevelsData) {
        const savedEnergyLevels = JSON.parse(energyLevelsData);
        savedEnergyLevels[today] = energyLevel;
        localStorage.setItem("energy-levels", JSON.stringify(savedEnergyLevels));
      } else {
        // Initialize if it doesn't exist
        const newEnergyLevels = { [today]: energyLevel };
        localStorage.setItem("energy-levels", JSON.stringify(newEnergyLevels));
      }
      
      // Update breaks in calendar data
      const breaksData = localStorage.getItem("breaks");
      if (breaksData) {
        const savedBreaks = JSON.parse(breaksData);
        savedBreaks[today] = breaks;
        localStorage.setItem("breaks", JSON.stringify(savedBreaks));
      } else {
        // Initialize if it doesn't exist
        const newBreaks = { [today]: breaks };
        localStorage.setItem("breaks", JSON.stringify(newBreaks));
      }
    } catch (error) {
      console.error("Error updating calendar data:", error);
    }
  }, [energyLevel, breaks]);

  // Sync from calendar when component mounts
  useEffect(() => {
    try {
      const today = formatDate(new Date());
      
      // Get energy level from calendar data
      const energyLevelsData = localStorage.getItem("energy-levels");
      if (energyLevelsData) {
        const savedEnergyLevels = JSON.parse(energyLevelsData);
        if (savedEnergyLevels[today] !== undefined) {
          setEnergyLevel(savedEnergyLevels[today]);
        }
      }
      
      // Get breaks from calendar data
      const breaksData = localStorage.getItem("breaks");
      if (breaksData) {
        const savedBreaks = JSON.parse(breaksData);
        if (savedBreaks[today] && savedBreaks[today].length > 0) {
          setBreaks(savedBreaks[today]);
        }
      }
    } catch (error) {
      console.error("Error synchronizing with calendar data:", error);
    }
  }, []);

  return (
    <Card className="shadow-subtle overflow-hidden">
      <CardContent className="p-0">
        {/* Energy Level */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2 mb-2">
            <Battery className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Current Energy Level</h3>
          </div>
          
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">1</span>
              <span 
                className={cn(
                  "text-sm font-medium px-2 py-0.5 rounded-full",
                  getEnergyColor()
                )}
              >
                {getEnergyLabel()} ({energyLevel}/10)
              </span>
              <span className="text-xs font-medium text-muted-foreground">10</span>
            </div>
            
            <Slider
              value={[energyLevel]}
              min={1}
              max={10}
              step={1}
              onValueChange={value => setEnergyLevel(value[0])}
              className="py-1"
            />
          </div>
        </div>
        
        {/* Peak Performance Hours - with ability to edit */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Peak Performance Hours</h3>
            </div>
            <div className="text-xs text-muted-foreground hover:text-foreground cursor-help">
              When you work best
            </div>
          </div>
          
          <div className="space-y-2">
            {peakHours.map((hour, index) => (
              <div 
                key={index}
                className="rounded-md bg-primary/5 px-3 py-2 text-sm relative group"
              >
                {editingPeakHour === index ? (
                  <div className="flex space-x-2">
                    <Input 
                      value={newPeakHour}
                      onChange={(e) => setNewPeakHour(e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Format: 9:00 AM - 11:00 AM"
                    />
                    <button 
                      onClick={savePeakHour}
                      className="px-2 py-1 bg-primary text-xs rounded text-primary-foreground"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    {hour}
                    <button 
                      onClick={() => startEditPeakHour(index)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Planned Breaks - with working Add Break button */}
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Coffee className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Planned Breaks</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {breaks.map((breakTime, index) => (
              <div 
                key={index}
                className="rounded-md bg-accent px-3 py-2 text-sm text-center"
              >
                {breakTime}
              </div>
            ))}
            
            {isAddingBreak ? (
              <div className="col-span-2 flex space-x-2">
                <Input
                  value={newBreak}
                  onChange={(e) => setNewBreak(e.target.value)}
                  placeholder="e.g., 2:30 PM"
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddBreak}
                  size="sm"
                >
                  Add
                </Button>
              </div>
            ) : (
              <button 
                onClick={handleAddBreak}
                className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors flex items-center justify-center"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Break
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnergyTracker;
