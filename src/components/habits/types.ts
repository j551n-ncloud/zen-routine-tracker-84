
export interface DayProps {
  date: Date;
  isCurrentMonth?: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  events?: Array<{
    id: string;
    name: string;
    completed: boolean;
  }>;
}
