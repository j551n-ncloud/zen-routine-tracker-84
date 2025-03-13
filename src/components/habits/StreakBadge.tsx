
import React from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  count: number;
  className?: string;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ count, className }) => {
  // Determine color based on streak count
  const getColor = () => {
    if (count < 3) return "bg-muted text-muted-foreground";
    if (count < 7) return "bg-blue-100 text-blue-600";
    if (count < 14) return "bg-green-100 text-green-600";
    if (count < 30) return "bg-orange-100 text-orange-600";
    return "bg-purple-100 text-purple-600";
  };

  // Check if it's a milestone streak
  const isMilestone = [7, 14, 21, 30, 60, 90, 100, 365].includes(count);

  return (
    <div 
      className={cn(
        "rounded-full flex items-center px-2.5 py-1",
        getColor(),
        isMilestone && "animate-pulse-soft",
        className
      )}
    >
      <Flame 
        className={cn(
          "h-3.5 w-3.5 mr-1",
          count >= 7 && "animate-float"
        )} 
      />
      <span className="text-xs font-semibold">{count}</span>
    </div>
  );
};

export default StreakBadge;
