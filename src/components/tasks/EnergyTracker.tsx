
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Battery, Clock, Coffee } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const EnergyTracker: React.FC = () => {
  const [energyLevel, setEnergyLevel] = useState(7);
  const [peakHours, setPeakHours] = useState(['9:00 AM - 11:00 AM', '4:00 PM - 6:00 PM']);
  const [breaks, setBreaks] = useState(['11:30 AM', '3:30 PM']);

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
        
        {/* Peak Performance Hours */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Peak Performance Hours</h3>
          </div>
          
          <div className="space-y-2">
            {peakHours.map((hour, index) => (
              <div 
                key={index}
                className="rounded-md bg-primary/5 px-3 py-2 text-sm"
              >
                {hour}
              </div>
            ))}
          </div>
        </div>
        
        {/* Planned Breaks */}
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
            
            <button 
              className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
            >
              Add Break
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnergyTracker;
