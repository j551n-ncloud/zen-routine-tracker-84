
import { useLocalStorage } from "./use-local-storage";

export interface Task {
  id: number;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate: Date | string;
  startDate?: Date | string;
}

// Initial task data for new users
const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Finish project presentation',
    priority: 'high',
    completed: false,
    startDate: new Date(Date.now()),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
  },
  {
    id: 2,
    title: 'Schedule team meeting',
    priority: 'medium',
    completed: false,
    startDate: new Date(Date.now()),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48), // day after tomorrow
  },
  {
    id: 3,
    title: 'Review weekly metrics',
    priority: 'low',
    completed: true,
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
    dueDate: new Date(), // today
  },
  {
    id: 4,
    title: 'Send client proposal',
    priority: 'high',
    completed: false,
    startDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // yesterday (overdue)
  },
  {
    id: 5,
    title: 'Research new tools',
    priority: 'medium',
    completed: false,
    startDate: new Date(Date.now()),
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
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now
  },
  {
    id: 7,
    title: 'Update documentation',
    priority: 'medium',
    completed: false,
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days from now
  },
  {
    id: 8,
    title: 'Release schedule review',
    priority: 'low',
    completed: false,
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days from now
  },
];

// Helper function to ensure we're working with Date objects
const ensureDate = (dateInput: Date | string): Date => {
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') return new Date(dateInput);
  return new Date();
};

export function useTasksStorage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("zen-tracker-tasks", initialTasks);
  const [upcomingTasks, setUpcomingTasks] = useLocalStorage<Task[]>(
    "zen-tracker-upcoming-tasks", 
    initialUpcomingTasks
  );
  const [calendarTasks, setCalendarTasks] = useLocalStorage<Record<string, any[]>>(
    "calendar-tasks",
    {}
  );

  const addTask = (task: Omit<Task, "id">) => {
    const allTasks = [...tasks, ...upcomingTasks];
    const newId = Math.max(...allTasks.map(t => t.id), 0) + 1;
    
    const taskToAdd = {
      id: newId,
      ...task,
      // Ensure dates are properly formatted
      dueDate: ensureDate(task.dueDate),
      startDate: task.startDate ? ensureDate(task.startDate) : ensureDate(task.dueDate)
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
    
    // Update calendar task data for this date
    updateCalendarTasks(taskToAdd);
    
    return newId;
  };

  const updateCalendarTasks = (task: Task) => {
    const taskDate = ensureDate(task.dueDate);
    const formattedDate = formatDate(taskDate);
    
    const simplifiedTask = {
      id: task.id,
      title: task.title,
      completed: task.completed
    };
    
    const updatedCalendarTasks = { ...calendarTasks };
    
    if (updatedCalendarTasks[formattedDate]) {
      updatedCalendarTasks[formattedDate] = [
        ...updatedCalendarTasks[formattedDate].filter(t => t.id !== task.id),
        simplifiedTask
      ];
    } else {
      updatedCalendarTasks[formattedDate] = [simplifiedTask];
    }
    
    setCalendarTasks(updatedCalendarTasks);
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
      
      // Also update in calendar
      updateTaskCompletionInCalendar(updatedTasks[taskIndex]);
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
        
        // Also update in calendar
        updateTaskCompletionInCalendar(updatedUpcomingTasks[upcomingTaskIndex]);
      }
    }
  };

  // Helper to update a task in the calendar data
  const updateTaskCompletionInCalendar = (task: Task) => {
    const taskDate = ensureDate(task.dueDate);
    const formattedDate = formatDate(taskDate);
    
    const updatedCalendarTasks = { ...calendarTasks };
    
    if (updatedCalendarTasks[formattedDate]) {
      updatedCalendarTasks[formattedDate] = updatedCalendarTasks[formattedDate].map(t =>
        t.id === task.id ? { ...t, completed: task.completed } : t
      );
      
      setCalendarTasks(updatedCalendarTasks);
    }
  };

  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const removeTask = (id: number) => {
    // Check in both lists and remove from the appropriate one
    setTasks(tasks.filter(task => task.id !== id));
    setUpcomingTasks(upcomingTasks.filter(task => task.id !== id));
    
    // Also remove from calendar tasks if present
    removeTaskFromCalendar(id);
  };

  const removeTaskFromCalendar = (id: number) => {
    const updatedCalendarTasks = { ...calendarTasks };
    
    // Look through all dates
    for (const date in updatedCalendarTasks) {
      if (updatedCalendarTasks[date].some(t => t.id === id)) {
        updatedCalendarTasks[date] = updatedCalendarTasks[date].filter(t => t.id !== id);
        setCalendarTasks(updatedCalendarTasks);
        break;
      }
    }
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
