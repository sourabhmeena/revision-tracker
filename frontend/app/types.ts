export interface RevisionTopic {
  revision_id: string;
  topic_id: string;
  title: string;
  category: string | null;
  chapter: string | null;
  description: string | null;
  completed: boolean;
}

export interface ModalData {
  iso_date: string;
  date: string;
  topics: RevisionTopic[];
  progress_percent?: number;
}

export interface RevisionListItem {
  iso_date: string;
  date: string;
  done: number;
  total: number;
  progress_percent?: number;
}

export interface TopicSummary {
  id: string;
  title: string;
  category: string | null;
  chapter: string | null;
  description: string | null;
  created_at: string;
  created_at_formatted: string;
  total_revisions: number;
  completed_revisions: number;
  progress_percent: number;
  has_custom_schedule: boolean;
  intervals: number[];
  repeat_interval: number;
}

export interface ScheduleBlock {
  id: string;
  weekday: number; // 0=Mon … 6=Sun
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  title: string;
  description: string | null;
  color: string | null;
}

export interface BlockCompletion {
  block_id: string;
  date: string; // ISO "YYYY-MM-DD"
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  next_milestone: {
    target: number;
    progress: number;
    days_remaining: number;
  };
  streak_dates: string[];
}
