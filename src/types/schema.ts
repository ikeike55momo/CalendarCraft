export interface Event {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  workType: 'office' | 'remote';
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  projectId?: string;
  tag?: string;
  dueDate?: string;
  detail?: string;
  status: 'open' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  attendanceLog: {
    clockIn?: string;
    clockOut?: string;
    breaks?: Array<{
      start: string;
      end?: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
} 