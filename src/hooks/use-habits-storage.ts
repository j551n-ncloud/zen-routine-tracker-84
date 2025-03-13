
import { useLocalStorage } from "./use-local-storage";
import { format } from "date-fns";

export interface Habit {
  id: number;
  name: string;
  streak: number;
  completed: boolean;
  category: string;
  icon?: string; // Changed from any to string to prevent type issues
}

// Interface for storing daily habit status
interface DailyHabitStatus {
  [date: string]: {
    [habitId: number]: boolean;
  };
}

// Initial habit data for new users
const initialHabits: Habit[] = [
  { 
    id: 1, 
    name: "Drink Water", 
    streak: 12, 
    completed: false, 
    category: "health"
  },
  { 
    id: 2, 
    name: "Exercise", 
    streak: 5, 
    completed: false, 
    category: "fitness"
  },
  { 
    id: 3, 
    name: "Read Book", 
    streak: 8, 
    completed: false, 
    category: "learning"
  },
  { 
    id: 4, 
    name: "8h Sleep", 
    streak: 3, 
    completed: false, 
    category: "sleep"
  },
  { 
    id: 5, 
    name: "Meditation", 
    streak: 15, 
    completed: false, 
    category: "mindfulness"
  },
];

export function useHabitsStorage() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("zen-tracker-habits", initialHabits);
  const [dailyHabitStatus, setDailyHabitStatus] = useLocalStorage<DailyHabitStatus>(
    "zen-tracker-daily-habits", 
    {}
  );

  const addHabit = (habit: Omit<Habit, "id" | "streak" | "completed">) => {
    const newId = Math.max(...habits.map(h => h.id), 0) + 1;
    
    const newHabit: Habit = {
      id: newId,
      name: habit.name,
      category: habit.category,
      streak: 0,
      completed: false,
      ...(habit.icon ? { icon: habit.icon } : {})
    };
    
    setHabits([...habits, newHabit]);
    return newId;
  };

  const toggleHabit = (id: number) => {
    // Update the main habits state
    setHabits(habits.map(habit => 
      habit.id === id 
        ? { 
            ...habit, 
            completed: !habit.completed,
            streak: !habit.completed ? habit.streak + 1 : Math.max(habit.streak - 1, 0)
          } 
        : habit
    ));
    
    // Also update the daily habit status for today
    const today = new Date();
    const dateKey = format(today, "yyyy-MM-dd");
    
    // Get current habit status
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    // Create a new object to avoid direct state mutation
    const newDailyHabitStatus = { ...dailyHabitStatus };
    
    // Initialize the date entry if it doesn't exist
    if (!newDailyHabitStatus[dateKey]) {
      newDailyHabitStatus[dateKey] = {};
    }
    
    // Set the new completion status (opposite of current)
    newDailyHabitStatus[dateKey][id] = !habit.completed;
    
    // Update state
    setDailyHabitStatus(newDailyHabitStatus);
    
    // Also update calendar-habits if it exists
    try {
      const calendarHabitsData = localStorage.getItem("calendar-habits");
      if (calendarHabitsData) {
        const calendarHabits = JSON.parse(calendarHabitsData);
        if (calendarHabits[dateKey]) {
          const updatedHabits = calendarHabits[dateKey].map((h: any) => 
            h.id === id ? { ...h, completed: !habit.completed } : h
          );
          calendarHabits[dateKey] = updatedHabits;
          localStorage.setItem("calendar-habits", JSON.stringify(calendarHabits));
        }
      }
    } catch (error) {
      console.error("Error updating calendar-habits:", error);
    }
  };

  const removeHabit = (id: number) => {
    setHabits(habits.filter(habit => habit.id !== id));
  };

  const updateHabit = (id: number, updates: Partial<Omit<Habit, "id">>) => {
    setHabits(habits.map(habit => 
      habit.id === id 
        ? { ...habit, ...updates } 
        : habit
    ));
  };

  return {
    habits,
    addHabit,
    toggleHabit,
    removeHabit,
    updateHabit
  };
}
