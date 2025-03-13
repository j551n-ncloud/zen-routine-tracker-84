import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/layout/AppLayout";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Activity, BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon } from "lucide-react";

// Sample colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Time periods
const TIME_PERIODS = ["Last 7 Days", "Last 30 Days", "Last 90 Days"];

const Insights = () => {
  const [habitData] = useLocalStorage("zen-tracker-habits", []);
  const [tasksData] = useLocalStorage("zen-tracker-tasks", []);
  const [energyLevels] = useLocalStorage("energy-levels", {});
  const [selectedPeriod, setSelectedPeriod] = useState("Last 7 Days");

  // Prepare habit completion data
  const habitCompletionData = [
    { name: "Mon", completed: 4, total: 5 },
    { name: "Tue", completed: 3, total: 5 },
    { name: "Wed", completed: 5, total: 5 },
    { name: "Thu", completed: 2, total: 5 },
    { name: "Fri", completed: 3, total: 5 },
    { name: "Sat", completed: 4, total: 5 },
    { name: "Sun", completed: 1, total: 5 },
  ];

  // Prepare task completion data
  const taskCompletionData = [
    { name: "Mon", completed: 7, total: 10, completionRate: 70 },
    { name: "Tue", completed: 5, total: 8, completionRate: 63 },
    { name: "Wed", completed: 9, total: 12, completionRate: 75 },
    { name: "Thu", completed: 4, total: 6, completionRate: 67 },
    { name: "Fri", completed: 6, total: 9, completionRate: 67 },
    { name: "Sat", completed: 3, total: 5, completionRate: 60 },
    { name: "Sun", completed: 2, total: 4, completionRate: 50 },
  ];

  // Prepare habit category distribution
  const habitCategoryData = [
    { name: "Health", value: 5 },
    { name: "Fitness", value: 3 },
    { name: "Learning", value: 4 },
    { name: "Sleep", value: 2 },
    { name: "Mindfulness", value: 3 },
  ];

  // Prepare energy level data
  const energyLevelData = [
    { name: "Mon", value: 7 },
    { name: "Tue", value: 5 },
    { name: "Wed", value: 8 },
    { name: "Thu", value: 6 },
    { name: "Fri", value: 4 },
    { name: "Sat", value: 9 },
    { name: "Sun", value: 7 },
  ];

  // Streak data
  const streakData = [
    { name: "Drink Water", streak: 12 },
    { name: "Exercise", streak: 5 },
    { name: "Read Book", streak: 8 },
    { name: "8h Sleep", streak: 3 },
    { name: "Meditation", streak: 15 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map(period => (
                  <SelectItem key={period} value={period}>{period}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="habits">
              <BarChart2 className="h-4 w-4 mr-2" />
              Habits
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <LineChartIcon className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="energy">
              <PieChartIcon className="h-4 w-4 mr-2" />
              Energy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Habit Completion</CardTitle>
                  <CardDescription>Daily habit completion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={habitCompletionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#e5e7eb" name="Total Habits" />
                      <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Task Completion</CardTitle>
                  <CardDescription>Daily task completion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={taskCompletionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#e5e7eb" name="Total Tasks" />
                      <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Habit Categories</CardTitle>
                  <CardDescription>Distribution of habits by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={habitCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {habitCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Energy Levels</CardTitle>
                  <CardDescription>Daily energy level tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={energyLevelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                        name="Energy Level"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="habits" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Habit Streaks</CardTitle>
                  <CardDescription>Current streak length for each habit</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={streakData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="streak" fill="#3b82f6" name="Current Streak" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Weekly Completion</CardTitle>
                  <CardDescription>Weekly habit completion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={habitCompletionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#3b82f6" 
                        activeDot={{ r: 8 }} 
                        name="Completed Habits"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#e5e7eb" 
                        name="Total Habits"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Task Completion Trend</CardTitle>
                  <CardDescription>Weekly trend of task completion</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={taskCompletionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#3b82f6" 
                        activeDot={{ r: 8 }} 
                        name="Completed Tasks"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#e5e7eb" 
                        name="Total Tasks"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Completion Rate</CardTitle>
                  <CardDescription>Daily completion percentage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={taskCompletionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar 
                        dataKey="completionRate" 
                        fill="#3b82f6" 
                        name="Completion Rate (%)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="energy" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Energy Level Trend</CardTitle>
                  <CardDescription>Weekly energy level tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={energyLevelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                        name="Energy Level"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card className="shadow-subtle">
                <CardHeader>
                  <CardTitle>Energy vs. Productivity</CardTitle>
                  <CardDescription>Correlation between energy and completed tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={energyLevelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" domain={[0, 10]} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 12]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        name="Energy Level"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#3b82f6" 
                        name="Tasks Completed"
                        data={taskCompletionData}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Insights;
