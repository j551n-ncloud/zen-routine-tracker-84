
// Sample data structure for new users
export const sampleData = {
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
    data.energy = savedEnergyLevels[formattedDate];
  }
  
  if (savedBreaks[formattedDate]) {
    data.breaks = savedBreaks[formattedDate];
  }

  // Import current habits and their completion status
  try {
    const habitsData = localStorage.getItem("zen-tracker-habits");
    if (habitsData) {
      const allHabits = JSON.parse(habitsData);
      // Add any habits not already in the data
      const existingHabitIds = new Set(data.habits.map(h => h.id));
      const habitsToAdd = allHabits.filter(h => !existingHabitIds.has(h.id))
        .map(h => ({
          id: h.id,
          name: h.name,
          completed: h.completed
        }));
      
      data.habits = [...data.habits, ...habitsToAdd];
    }
  } catch (error) {
    console.error("Error getting habits from localStorage:", error);
  }
  
  return data;
};
