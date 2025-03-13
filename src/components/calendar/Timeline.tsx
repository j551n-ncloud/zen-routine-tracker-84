
import React from "react";
import { 
  Check, 
  CheckCircle, 
  Clock, 
  Award, 
  Star, 
  Battery, 
  BarChart, 
  Calendar, 
  Target
} from "lucide-react";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/providers/theme-provider";

interface TimelineProps {
  dates: string[];
  timelineTab: string;
  dailyFocus: Record<string, string>;
  dailyPriorities: Record<string, string[]>;
  savedTasks: Record<string, any[]>;
  savedHabits: Record<string, any[]>;
  savedEnergyLevels: Record<string, number>;
  savedBreaks: Record<string, string[]>;
}

const Timeline: React.FC<TimelineProps> = ({
  dates,
  timelineTab,
  dailyFocus,
  dailyPriorities,
  savedTasks,
  savedHabits,
  savedEnergyLevels,
  savedBreaks
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  if (dates.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No historical data available from the past week.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  // Calculate completion stats
  const calculateStats = (date: string) => {
    const tasks = savedTasks[date] || [];
    const habits = savedHabits[date] || [];
    const energy = savedEnergyLevels[date] || 0;
    
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const taskCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const completedHabits = habits.filter(habit => habit.completed).length;
    const totalHabits = habits.length;
    const habitCompletion = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
    
    return {
      taskCompletion,
      habitCompletion,
      completedTasks,
      totalTasks,
      completedHabits,
      totalHabits,
      energy
    };
  };

  return (
    <div className="space-y-8">
      {dates.map((date, index) => {
        const stats = calculateStats(date);
        const focus = dailyFocus[date] || "";
        const priorities = dailyPriorities[date] || [];
        const breaks = savedBreaks[date] || [];
        const tasks = savedTasks[date] || [];
        const habits = savedHabits[date] || [];
        
        return (
          <div key={date} className="relative">
            {/* Date with connecting line */}
            <div className="flex items-start mb-4">
              <div className={`flex flex-col items-center ${index < dates.length - 1 ? 'h-full' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                {index < dates.length - 1 && (
                  <div className={`w-0.5 flex-grow mt-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{formatDate(date)}</h3>
              </div>
            </div>
            
            {timelineTab === 'daily' && (
              <div className="ml-14 space-y-3">
                {/* Daily Focus if available */}
                {focus && (
                  <div className={`p-3 rounded-md ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Daily Focus
                    </h4>
                    <p className={`text-sm px-3 py-2 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                      {focus}
                    </p>
                  </div>
                )}
                
                {/* Top Priorities if available */}
                {priorities.length > 0 && (
                  <div className={`p-3 rounded-md ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Top Priorities
                    </h4>
                    <div className="space-y-1">
                      {priorities.map((priority, idx) => (
                        <div key={idx} className={`text-sm px-3 py-2 rounded flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                          <div className="h-5 w-5 flex items-center justify-center bg-yellow-500/20 rounded-full text-xs mr-2">
                            {idx + 1}
                          </div>
                          {priority}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              
                {breaks.length > 0 && (
                  <div className={`p-3 rounded-md ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Scheduled Breaks
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {breaks.map((breakTime, idx) => (
                        <div key={idx} className={`text-sm px-2 py-1 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                          {breakTime}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {tasks.length > 0 && (
                  <div className={`p-3 rounded-md ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Daily Tasks
                    </h4>
                    <div className="space-y-1">
                      {tasks.map(task => (
                        <div 
                          key={task.id} 
                          className={`text-sm px-3 py-2 rounded flex items-center ${
                            task.completed 
                              ? isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-800' 
                              : isDarkMode ? 'bg-slate-700' : 'bg-white'
                          }`}
                        >
                          {task.completed && <Check className="h-3 w-3 mr-2" />}
                          <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {habits.length > 0 && (
                  <div className={`p-3 rounded-md ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-purple-500" />
                      Habits Tracked
                    </h4>
                    <div className="space-y-1">
                      {habits.map(habit => (
                        <div 
                          key={habit.id} 
                          className={`text-sm px-3 py-2 rounded flex items-center ${
                            habit.completed 
                              ? isDarkMode ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-100 text-purple-800' 
                              : isDarkMode ? 'bg-slate-700' : 'bg-white'
                          }`}
                        >
                          {habit.completed && <Check className="h-3 w-3 mr-2" />}
                          <span className={habit.completed ? 'line-through' : ''}>{habit.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {timelineTab === 'focus' && (
              <div className="ml-14 space-y-3">
                {focus && (
                  <div className={`p-3 rounded-md ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      Daily Focus
                    </h4>
                    <p className={`text-sm px-3 py-2 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                      {focus}
                    </p>
                  </div>
                )}
                
                {priorities.length > 0 && (
                  <div className={`p-3 rounded-md ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      Top Priorities
                    </h4>
                    <div className="space-y-1">
                      {priorities.map((priority, idx) => (
                        <div key={idx} className={`text-sm px-3 py-2 rounded flex items-center ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                          <div className="h-5 w-5 flex items-center justify-center bg-yellow-500/20 rounded-full text-xs mr-2">
                            {idx + 1}
                          </div>
                          {priority}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {timelineTab === 'stats' && (
              <div className="ml-14 space-y-3">
                <div className={`p-3 rounded-md ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <BarChart className="h-4 w-4 text-blue-500" />
                    Daily Metrics
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Tasks: {stats.completedTasks}/{stats.totalTasks}</span>
                        <span>{Math.round(stats.taskCompletion)}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${stats.taskCompletion}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Habits: {stats.completedHabits}/{stats.totalHabits}</span>
                        <span>{Math.round(stats.habitCompletion)}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div 
                          className="h-full bg-purple-500" 
                          style={{ width: `${stats.habitCompletion}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1 text-xs">
                        <span>Energy Level</span>
                        <span>{stats.energy}/10</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${stats.energy * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {index < dates.length - 1 && <Separator className="my-6" />}
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
