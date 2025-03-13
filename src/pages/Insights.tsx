
import React, { useState, useMemo } from "react";
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
import { useTheme } from "@/providers/theme-provider";
import { formatDate } from "@/components/calendar/calendarUtils";
import { format, subDays, parseISO, isWithinInterval } from "date-fns";
import { Habit } from "@/hooks/use-habits-storage";

// Sample colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
const DARK_MODE_COLORS = ["#61dafb", "#2ecc71", "#f1c40f", "#e74c3c", "#9b59b6"];

// Time periods
const TIME_PERIODS = ["Last 7 Days", "Last 30 Days", "Last 90 Days"];

const Insights = () => {
  const [habitsData] = useLocalStorage<Habit[]>("zen-tracker-habits", []);
  const [tasksData] = useLocalStorage<any[]>("zen-tracker-tasks", []);
  const [energyLevels] = useLocalStorage<Record<string, number>>("energy-levels", {});
  const [calendarTasks] = useLocalStorage<Record<string, any[]>>("calendar-tasks", {});
  const [calendarHabits] = useLocalStorage<Record<string, any[]>>("calendar-habits", {});
  const [dailyHabits] = useLocalStorage<Record<string, Record<string, boolean>>>("zen-tracker-daily-habits", {});
  
  const [selectedPeriod, setSelectedPeriod] = useState("Last 7 Days");
  const { theme } = useTheme();
  
  const isDarkMode = theme === "dark";
  const chartColors = isDarkMode ? DARK_MODE_COLORS : COLORS;

  // Get date range based on selected period
  const getDateRange = () => {
    const endDate = new Date();
    let startDate;
    
    switch (selectedPeriod) {
      case "Last 7 Days":
        startDate = subDays(endDate, 7);
        break;
      case "Last 30 Days":
        startDate = subDays(endDate, 30);
        break;
      case "Last 90 Days":
        startDate = subDays(endDate, 90);
        break;
      default:
        startDate = subDays(endDate, 7);
    }
    
    return { startDate, endDate };
  };

  // Generate array of date keys in the selected range
  const getDateKeysInRange = () => {
    const { startDate, endDate } = getDateRange();
    const dateKeys = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dateKeys.push(formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateKeys;
  };

  // Filter data by date range
  const getFilteredData = () => {
    const { startDate, endDate } = getDateRange();
    const dateRange = { start: startDate, end: endDate };
    
    // Filter calendar data
    const filteredTasks: Record<string, any[]> = {};
    const filteredHabits: Record<string, any[]> = {};
    const filteredEnergy: Record<string, number> = {};
    
    Object.entries(calendarTasks).forEach(([date, tasks]) => {
      try {
        const dateObj = parseISO(date);
        if (isWithinInterval(dateObj, dateRange)) {
          filteredTasks[date] = tasks;
        }
      } catch (e) {
        console.error("Invalid date format", date);
      }
    });
    
    Object.entries(calendarHabits).forEach(([date, habits]) => {
      try {
        const dateObj = parseISO(date);
        if (isWithinInterval(dateObj, dateRange)) {
          filteredHabits[date] = habits;
        }
      } catch (e) {
        console.error("Invalid date format", date);
      }
    });
    
    Object.entries(energyLevels).forEach(([date, energy]) => {
      try {
        const dateObj = parseISO(date);
        if (isWithinInterval(dateObj, dateRange)) {
          filteredEnergy[date] = energy;
        }
      } catch (e) {
        console.error("Invalid date format", date);
      }
    });
    
    return { filteredTasks, filteredHabits, filteredEnergy };
  };

  // Custom tooltip with dark mode support
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-2 rounded-md shadow-md ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} border border-gray-300`}>
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Generate chart data based on real user data
  const generateChartData = useMemo(() => {
    const { filteredTasks, filteredHabits, filteredEnergy } = getFilteredData();
    const dateKeys = getDateKeysInRange();
    
    // Initialize data for each day in range with default values
    const habitData = dateKeys.map(date => {
      const shortDay = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      const habits = filteredHabits[date] || [];
      const completedHabits = habits.filter((h: any) => h.completed).length;
      
      return {
        name: shortDay,
        date,
        completed: completedHabits,
        total: habits.length || 0,
      };
    });
    
    const taskData = dateKeys.map(date => {
      const shortDay = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      const tasks = filteredTasks[date] || [];
      const completedTasks = tasks.filter((t: any) => t.completed).length;
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      return {
        name: shortDay,
        date,
        completed: completedTasks,
        total: totalTasks,
        completionRate: Math.round(completionRate),
      };
    });
    
    const energyData = dateKeys.map(date => {
      const shortDay = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      return {
        name: shortDay,
        date,
        value: filteredEnergy[date] || 0,
      };
    });
    
    // Get habit categories and count
    const habitCategoryMap: Record<string, number> = {};
    habitsData.forEach(habit => {
      if (!habit.category) return;
      
      const category = habit.category.charAt(0).toUpperCase() + habit.category.slice(1);
      habitCategoryMap[category] = (habitCategoryMap[category] || 0) + 1;
    });
    
    const habitCategoryData = Object.entries(habitCategoryMap).map(([name, value]) => ({ name, value }));
    
    // Get streak data
    const streakData = habitsData
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5)
      .map(habit => ({ name: habit.name, streak: habit.streak }));
    
    return { habitData, taskData, energyData, habitCategoryData, streakData };
  }, [selectedPeriod, habitsData, tasksData, calendarTasks, calendarHabits, energyLevels]);

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
                    <BarChart data={generateChartData.habitData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="total" fill={isDarkMode ? "#4B5563" : "#e5e7eb"} name="Total Habits" />
                      <Bar dataKey="completed" fill={isDarkMode ? "#60A5FA" : "#3b82f6"} name="Completed" />
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
                    <BarChart data={generateChartData.taskData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="total" fill={isDarkMode ? "#4B5563" : "#e5e7eb"} name="Total Tasks" />
                      <Bar dataKey="completed" fill={isDarkMode ? "#60A5FA" : "#3b82f6"} name="Completed" />
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
                        data={generateChartData.habitCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {generateChartData.habitCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
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
                    <LineChart data={generateChartData.energyData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={isDarkMode ? "#A78BFA" : "#8884d8"} 
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
                    <BarChart data={generateChartData.streakData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="streak" fill={isDarkMode ? "#60A5FA" : "#3b82f6"} name="Current Streak" />
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
                    <LineChart data={generateChartData.habitData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke={isDarkMode ? "#60A5FA" : "#3b82f6"} 
                        activeDot={{ r: 8 }} 
                        name="Completed Habits"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke={isDarkMode ? "#4B5563" : "#e5e7eb"} 
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
                    <LineChart data={generateChartData.taskData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke={isDarkMode ? "#60A5FA" : "#3b82f6"} 
                        activeDot={{ r: 8 }} 
                        name="Completed Tasks"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke={isDarkMode ? "#4B5563" : "#e5e7eb"} 
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
                    <BarChart data={generateChartData.taskData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="completionRate" 
                        fill={isDarkMode ? "#60A5FA" : "#3b82f6"} 
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
                    <LineChart data={generateChartData.energyData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={isDarkMode ? "#A78BFA" : "#8884d8"} 
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
                    <LineChart data={generateChartData.energyData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" domain={[0, 10]} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 12]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="value" 
                        stroke={isDarkMode ? "#A78BFA" : "#8884d8"} 
                        name="Energy Level"
                      />
                      {generateChartData.taskData.length > 0 && (
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="completed" 
                          stroke={isDarkMode ? "#60A5FA" : "#3b82f6"} 
                          name="Tasks Completed"
                          data={generateChartData.taskData}
                        />
                      )}
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
