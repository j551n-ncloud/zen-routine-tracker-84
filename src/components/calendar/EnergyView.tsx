
import React from "react";
import { Battery, Coffee } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface EnergyViewProps {
  energyLevel: number;
  breaks: string[];
}

const EnergyView: React.FC<EnergyViewProps> = ({ energyLevel, breaks }) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Energy Level</span>
          <span className="text-sm">{energyLevel}/10</span>
        </div>
        <div className="h-2 bg-muted rounded overflow-hidden">
          <div 
            className="h-full bg-primary" 
            style={{ width: `${(energyLevel/10) * 100}%` }}
          />
        </div>
      </div>
      
      <Separator />
      
      <div>
        <div className="flex items-center mb-2">
          <Coffee className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Break Times</span>
        </div>
        
        {breaks && breaks.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {breaks.map((breakTime, index) => (
              <div 
                key={index}
                className="rounded-md bg-accent/50 px-3 py-2 text-sm text-center"
              >
                {breakTime}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-muted-foreground">
            <p className="text-sm">No breaks scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnergyView;
