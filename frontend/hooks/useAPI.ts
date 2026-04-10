import useSWR, { mutate } from "swr";
import { API } from "../app/api";
import type { TopicSummary, RevisionListItem, StreakData, ModalData } from "../app/types";

const fetcher = (url: string) => API.get(url).then((r) => r.data);

export function localIso(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

export function useTodayRevisions() {
  const today = localIso();
  return useSWR<ModalData>(`/revision-date/${today}`, fetcher);
}

export function invalidateTopics() {
  mutate("/topics");
  mutate("/revisions");
  mutate("/streaks");
  const today = localIso();
  mutate(`/revision-date/${today}`);
}

export function invalidateSettings() {
  mutate("/settings");
}
