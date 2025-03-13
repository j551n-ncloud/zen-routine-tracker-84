
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Calendar, CheckCircle, Zap, Award } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

// Sample achievements data
const achievements = [
  { 
    id: 1, 
    title: "Early Bird", 
    description: "Complete 5 habits before 9 AM", 
    icon: <Star className="h-8 w-8 text-yellow-500" />, 
    earned: true, 
    date: "2023-05-15" 
  },
  { 
    id: 2, 
    title: "Habit Master", 
    description: "Maintain a 7-day streak for any habit", 
    icon: <Trophy className="h-8 w-8 text-amber-500" />, 
    earned: true, 
    date: "2023-05-20" 
  },
  { 
    id: 3, 
    title: "Task Champion", 
    description: "Complete 50 tasks", 
    icon: <CheckCircle className="h-8 w-8 text-green-500" />, 
    earned: true, 
    date: "2023-06-01" 
  },
  { 
    id: 4, 
    title: "Consistency King", 
    description: "Log into the app for 30 consecutive days", 
    icon: <Calendar className="h-8 w-8 text-blue-500" />, 
    earned: false, 
    progress: "22/30" 
  },
  { 
    id: 5, 
    title: "Productivity Powerhouse", 
    description: "Complete 10 tasks in a single day", 
    icon: <Zap className="h-8 w-8 text-purple-500" />, 
    earned: false, 
    progress: "7/10" 
  },
  { 
    id: 6, 
    title: "Grand Master", 
    description: "Earn 10 other achievements", 
    icon: <Award className="h-8 w-8 text-rose-500" />, 
    earned: false, 
    progress: "3/10" 
  }
];

const Achievements = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
          <div className="font-medium text-muted-foreground bg-muted py-1.5 px-3 rounded-full">
            Earned: {achievements.filter(a => a.earned).length}/{achievements.length}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={`shadow-subtle transition-all duration-300 hover:shadow-md ${achievement.earned ? "border-green-200" : "opacity-70"}`}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`bg-muted p-2 rounded-lg ${achievement.earned ? "bg-green-50 dark:bg-green-900/20" : ""}`}>
                  {achievement.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  {achievement.earned ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30">
                      Earned on {achievement.date}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30">
                      In Progress: {achievement.progress}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Achievements;
