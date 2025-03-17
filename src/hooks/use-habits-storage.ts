import { useDataStorage } from "./use-data-storage";
import { format } from "date-fns";

export interface Habit {
  id: number;
  name: string;
  streak: number;
  completed: boolean;
  category: string;
  icon?: string;
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
  // Use useDataStorage instead of useLocalStorage for server syncing
  const { data: habits, setData: setHabits } = useDataStorage<Habit[]>("zen-tracker-habits", initialHabits);
  const { data: dailyHabitStatus, setData: setDailyHabitStatus } = useDataStorage<DailyHabitStatus>(
    "zen-tracker-daily-habits", 
    {}
  );
  // For calendar habits
  const { data: calendarHabits, setData: setCalendarHabits } = useDataStorage<Record<string, any[]>>("calendar-habits", {});

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
    
    const updatedHabits = [...habits, newHabit];
    setHabits(updatedHabits);
    
    // Sync with calendar habits
    syncNewHabitToCalendar(newHabit);
    
    return newId;
  };

  const syncNewHabitToCalendar = (newHabit: Habit) => {
    // Add the new habit to all existing calendar days
    const updatedCalendarHabits = { ...calendarHabits };
    
    Object.keys(updatedCalendarHabits).forEach(date => {
      updatedCalendarHabits[date] = [
        ...updatedCalendarHabits[date],
        { id: newHabit.id, name: newHabit.name, completed: false }
      ];
    });
    
    setCalendarHabits(updatedCalendarHabits);
  };

  const toggleHabit = (id: number) => {
    // Update the main habits state
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

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
    syncHabitToggleToCalendar(id, !habit.completed, dateKey);
  };

  const syncHabitToggleToCalendar = (id: number, completed: boolean, dateKey: string) => {
    const updatedCalendarHabits = { ...calendarHabits };
    
    if (updatedCalendarHabits[dateKey]) {
      const habitIndex = updatedCalendarHabits[dateKey].findIndex(h => h.id === id);
      
      if (habitIndex !== -1) {
        // Update existing habit
        updatedCalendarHabits[dateKey][habitIndex].completed = completed;
      } else {
        // Add habit if it doesn't exist
        const habit = habits.find(h => h.id === id);
        if (habit) {
          updatedCalendarHabits[dateKey].push({
            id: habit.id,
            name: habit.name,
            completed: completed
          });
        }
      }
      
      setCalendarHabits(updatedCalendarHabits);
    }
  };

  const removeHabit = (id: number) => {
    setHabits(habits.filter(habit => habit.id !== id));
    
    // Remove habit from daily status
    const newDailyHabitStatus = { ...dailyHabitStatus };
    Object.keys(newDailyHabitStatus).forEach(date => {
      if (newDailyHabitStatus[date][id]) {
        delete newDailyHabitStatus[date][id];
      }
    });
    setDailyHabitStatus(newDailyHabitStatus);
    
    // Remove from calendar-habits
    syncHabitRemovalToCalendar(id);
  };

  const syncHabitRemovalToCalendar = (id: number) => {
    const updatedCalendarHabits = { ...calendarHabits };
    
    Object.keys(updatedCalendarHabits).forEach(date => {
      updatedCalendarHabits[date] = updatedCalendarHabits[date].filter(h => h.id !== id);
    });
    
    setCalendarHabits(updatedCalendarHabits);
  };

  const updateHabit = (id: number, updates: Partial<Omit<Habit, "id">>) => {
    const updatedHabits = habits.map(habit => 
      habit.id === id 
        ? { ...habit, ...updates } 
        : habit
    );
    
    setHabits(updatedHabits);
    
    // Sync to calendar habits
    if (updates.name) {
      syncHabitUpdateToCalendar(id, updates);
    }
  };

  const syncHabitUpdateToCalendar = (id: number, updates: Partial<Omit<Habit, "id">>) => {
    const updatedCalendarHabits = { ...calendarHabits };
    
    Object.keys(updatedCalendarHabits).forEach(date => {
      updatedCalendarHabits[date] = updatedCalendarHabits[date].map(h => 
        h.id === id 
          ? { ...h, name: updates.name || h.name } 
          : h
      );
    });
    
    setCalendarHabits(updatedCalendarHabits);
  };

  return {
    habits,
    addHabit,
    toggleHabit,
    removeHabit,
    updateHabit
  };
}
