
import { useLocalStorage } from "./use-local-storage";

export interface Habit {
  id: number;
  name: string;
  streak: number;
  completed: boolean;
  category: string;
  icon?: string; // Changed from any to string to prevent type issues
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
    setHabits(habits.map(habit => 
      habit.id === id 
        ? { 
            ...habit, 
            completed: !habit.completed,
            streak: !habit.completed ? habit.streak + 1 : habit.streak - 1
          } 
        : habit
    ));
  };

  const removeHabit = (id: number) => {
    setHabits(habits.filter(habit => habit.id !== id));
  };

  return {
    habits,
    addHabit,
    toggleHabit,
    removeHabit
  };
}
