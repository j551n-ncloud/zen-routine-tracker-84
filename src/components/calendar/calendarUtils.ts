
// Sample data structure for new users
export const sampleData: Record<string, CalendarDayData> = {
  "2023-07-15": {
    tasks: [
      { id: 1, title: "Team meeting", completed: true },
      { id: 2, title: "Send weekly report", completed: false }
    ],
    habits: [
      { id: 1, name: "Exercise", completed: true },
      { id: 2, name: "Read", completed: true },
      { id: 3, name: "Meditate", completed: false }
    ],
    energy: 8,
    breaks: ["11:30 AM", "3:30 PM"]
  },
  "2023-07-16": {
    tasks: [
      { id: 3, title: "Client call", completed: true }
    ],
    habits: [
      { id: 1, name: "Exercise", completed: false },
      { id: 2, name: "Read", completed: true }
    ],
    energy: 6,
    breaks: ["1:00 PM"]
  }
};

export const formatDate = (date: Date | undefined): string => {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export interface CalendarDayData {
  tasks: Array<{
    id: number;
    title: string;
    completed: boolean;
  }>;
  habits: Array<{
    id: number;
    name: string;
    completed: boolean;
  }>;
  energy: number;
  breaks: string[];
}

export const getSelectedDateData = (
  date: Date | undefined, 
  savedTasks: Record<string, any[]>,
  savedHabits: Record<string, any[]>,
  savedEnergyLevels: Record<string, number>,
  savedBreaks: Record<string, string[]>
): CalendarDayData => {
  const formattedDate = formatDate(date);
  
  // Start with an empty data structure
  const data: CalendarDayData = {
    tasks: [],
    habits: [],
    energy: 0,
    breaks: []
  };
  
  // If we have sample data for this date, use it as a starting point
  if (sampleData[formattedDate]) {
    Object.assign(data, sampleData[formattedDate]);
  }
  
  // Override with any saved data
  if (savedTasks[formattedDate]) {
    data.tasks = savedTasks[formattedDate];
  }
  
  if (savedHabits[formattedDate]) {
    data.habits = savedHabits[formattedDate];
  }
  
  if (savedEnergyLevels[formattedDate] !== undefined) {
    // Ensure energy level is a number
    data.energy = Number(savedEnergyLevels[formattedDate]) || 0;
  }
  
  if (savedBreaks[formattedDate]) {
    data.breaks = savedBreaks[formattedDate];
  }

  // Get tasks for the selected date
  try {
    if (date) {
      const tasksData = localStorage.getItem("zen-tracker-tasks");
      if (tasksData) {
        const allTasks = JSON.parse(tasksData);
        // Find tasks due on the selected date
        const tasksForDate = allTasks.filter((task: any) => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          const selectedDate = new Date(date);
          selectedDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === selectedDate.getTime();
        });
        
        // Only override if we don't already have tasks for this date
        if (tasksForDate.length > 0 && !savedTasks[formattedDate]) {
          data.tasks = tasksForDate.map((task: any) => ({
            id: task.id,
            title: task.title,
            completed: task.completed
          }));
        }
      }
    }
  } catch (error) {
    console.error("Error getting tasks from localStorage:", error);
  }

  // Get habits with their daily completion status
  try {
    const habitsData = localStorage.getItem("zen-tracker-habits");
    const dailyHabitsData = localStorage.getItem("zen-tracker-daily-habits");
    
    if (habitsData) {
      const allHabits = JSON.parse(habitsData);
      let dailyStatuses = {};
      
      if (dailyHabitsData) {
        dailyStatuses = JSON.parse(dailyHabitsData);
      }
      
      // Use the daily status for the selected date if available
      const dailyStatus = formattedDate && dailyStatuses[formattedDate] 
        ? dailyStatuses[formattedDate] 
        : {};
      
      // Convert habits to the expected format with completion status for the selected date
      const habitsForDate = allHabits.map((habit: any) => ({
        id: habit.id,
        name: habit.name,
        completed: dailyStatus[habit.id] || false
      }));
      
      // Only use these habits if we don't already have habits for this date
      if (habitsForDate.length > 0 && !savedHabits[formattedDate]) {
        data.habits = habitsForDate;
      } else if (habitsForDate.length > 0 && savedHabits[formattedDate]) {
        // Update names for existing habits in case they were edited
        data.habits = savedHabits[formattedDate].map(savedHabit => {
          const updatedHabit = habitsForDate.find((h: any) => h.id === savedHabit.id);
          return updatedHabit ? { ...savedHabit, name: updatedHabit.name } : savedHabit;
        });
        
        // Add any new habits that don't exist in savedHabits
        const savedHabitIds = new Set(data.habits.map(h => h.id));
        const newHabits = habitsForDate.filter((h: any) => !savedHabitIds.has(h.id));
        
        if (newHabits.length > 0) {
          data.habits = [...data.habits, ...newHabits];
        }
        
        // Remove habits that no longer exist in the global habits store
        const globalHabitIds = new Set(allHabits.map((h: any) => h.id));
        data.habits = data.habits.filter(h => globalHabitIds.has(h.id));
      }
    }
  } catch (error) {
    console.error("Error getting habits from localStorage:", error);
  }
  
  return data;
};
