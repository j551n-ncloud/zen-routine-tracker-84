
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Sample habit completion data
const habitCompletionData = {
  "2023-06-10": 3,  // completed 3 habits
  "2023-06-11": 2,
  "2023-06-12": 4,
  "2023-06-13": 1,
  "2023-06-14": 5,
  "2023-06-15": 0,  // no habits completed
  "2023-06-16": 2,
};

interface MonthlyViewProps {
  className?: string;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({ className }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Function to customize day rendering
  const customDayRender = (day: Date, isSelected: boolean) => {
    // Format date to match the keys in habitCompletionData
    const dateKey = day.toISOString().split('T')[0];
    
    // Get completion count for this day (if any)
    const completionCount = habitCompletionData[dateKey] || 0;
    
    // Determine color based on habit completion count
    const getColor = () => {
      if (completionCount === 0) return "bg-muted";
      if (completionCount < 3) return "bg-blue-400";
      if (completionCount < 5) return "bg-green-400";
      return "bg-purple-400";
    };
    
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        {/* Background indicator based on habit completion */}
        {completionCount > 0 && (
          <div 
            className={cn(
              "absolute inset-0 opacity-20 rounded-sm",
              getColor()
            )}
          />
        )}
        
        {/* Day number */}
        <span>{day.getDate()}</span>
        
        {/* Dot indicator for completion */}
        {completionCount > 0 && (
          <div className="absolute bottom-1 left-0 right-0 flex justify-center">
            <div 
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                getColor()
              )}
            />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className={cn("shadow-subtle", className)}>
      <CardContent className="p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md overflow-hidden"
          classNames={{
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
          }}
          components={{
            Day: ({ day, isSelected }) => customDayRender(day, isSelected),
          }}
        />
      </CardContent>
    </Card>
  );
};

export default MonthlyView;
