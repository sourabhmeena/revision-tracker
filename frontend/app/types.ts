export interface RevisionTopic {
  revision_id: string;
  topic_id: string;
  title: string;
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
  created_at: string;
  created_at_formatted: string;
  total_revisions: number;
  completed_revisions: number;
  progress_percent: number;
  has_custom_schedule: boolean;
  intervals: number[];
  repeat_interval: number;
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
