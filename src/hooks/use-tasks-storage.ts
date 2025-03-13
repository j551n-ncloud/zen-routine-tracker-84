
import { useLocalStorage } from "./use-local-storage";

export interface Task {
  id: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate: Date | string;
}

// Initial task data for new users
const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Finish project presentation',
    priority: 'high',
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
  },
  {
    id: 2,
    title: 'Schedule team meeting',
    priority: 'medium',
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48), // day after tomorrow
  },
  {
    id: 3,
    title: 'Review weekly metrics',
    priority: 'low',
    completed: true,
    dueDate: new Date(), // today
  },
  {
    id: 4,
    title: 'Send client proposal',
    priority: 'high',
    completed: false,
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // yesterday (overdue)
  },
  {
    id: 5,
    title: 'Research new tools',
    priority: 'medium',
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72), // 3 days from now
  },
];

// Upcoming tasks (for the "Upcoming" tab)
const initialUpcomingTasks: Task[] = [
  {
    id: 6,
    title: 'Quarterly planning session',
    priority: 'high',
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now
  },
  {
    id: 7,
    title: 'Update documentation',
    priority: 'medium',
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
  },
  {
    id: 8,
    title: 'Release schedule review',
    priority: 'low',
    completed: false,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days from now
  },
];

// Helper function to ensure we're working with Date objects
const ensureDate = (dateInput: Date | string): Date => {
  return dateInput instanceof Date ? dateInput : new Date(dateInput);
};

export function useTasksStorage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("zen-tracker-tasks", initialTasks);
  const [upcomingTasks, setUpcomingTasks] = useLocalStorage<Task[]>(
    "zen-tracker-upcoming-tasks", 
    initialUpcomingTasks
  );

  const addTask = (task: Omit<Task, "id">) => {
    const allTasks = [...tasks, ...upcomingTasks];
    const newId = Math.max(...allTasks.map(t => t.id), 0) + 1;
    
    const taskToAdd = {
      id: newId,
      ...task
    };

    // Check if task should go in today or upcoming list
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = ensureDate(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    if (taskDate <= threeDaysFromNow) {
      setTasks([...tasks, taskToAdd]);
    } else {
      setUpcomingTasks([...upcomingTasks, taskToAdd]);
    }
    
    return newId;
  };

  const toggleTaskCompletion = (id: number) => {
    // Check if the task is in the main tasks list
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        completed: !updatedTasks[taskIndex].completed
      };
      setTasks(updatedTasks);
    } else {
      // Check in the upcoming tasks list
      const upcomingTaskIndex = upcomingTasks.findIndex(task => task.id === id);
      if (upcomingTaskIndex !== -1) {
        const updatedUpcomingTasks = [...upcomingTasks];
        updatedUpcomingTasks[upcomingTaskIndex] = {
          ...updatedUpcomingTasks[upcomingTaskIndex],
          completed: !updatedUpcomingTasks[upcomingTaskIndex].completed
        };
        setUpcomingTasks(updatedUpcomingTasks);
      }
    }
  };

  const removeTask = (id: number) => {
    // Check in both lists and remove from the appropriate one
    setTasks(tasks.filter(task => task.id !== id));
    setUpcomingTasks(upcomingTasks.filter(task => task.id !== id));
  };

  return {
    tasks,
    upcomingTasks,
    addTask,
    toggleTaskCompletion,
    removeTask,
    setTasks,
    setUpcomingTasks
  };
}
