import useSWR, { mutate } from "swr";
import { API } from "../app/api";
import type { TopicSummary, RevisionListItem, StreakData } from "../app/types";

const fetcher = (url: string) => API.get(url).then((r) => r.data);

export function useTopics() {
  return useSWR<TopicSummary[]>("/topics", fetcher);
}

export function useRevisions() {
  return useSWR<RevisionListItem[]>("/revisions", fetcher);
}

export function useStreaks() {
  return useSWR<StreakData>("/streaks", fetcher);
}

interface SettingsData {
  intervals: number[];
  repeat_interval: number;
  is_custom: boolean;
  defaults: {
    intervals: number[];
    repeat_interval: number;
  };
}

export function useSettings() {
  return useSWR<SettingsData>("/settings", fetcher);
}

export function invalidateTopics() {
  mutate("/topics");
  mutate("/revisions");
  mutate("/streaks");
}

export function invalidateSettings() {
  mutate("/settings");
}
