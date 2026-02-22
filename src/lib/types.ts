export type Role = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string;
}

export type TaskType = 'boolean' | 'temperature' | 'text';

export interface TaskItem {
  id: string;
  template_id: string;
  description: string;
  type: TaskType;
  required: boolean;
  max_temp?: number;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  description: string;
  recurrence: string;
}

export interface LogEntry {
  id: string;
  session_id: string;
  task_id: string;
  value: string;
  timestamp: string;
}

export interface ChecklistSession {
  id: string;
  template_id: string;
  date: string;
  status: 'pending' | 'completed';
  completed_by?: string;
}
