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

// ---------- Optimistic revision toggle ----------

export async function optimisticToggleRevision({
  revisionId,
  newCompleted,
  topicId,
  isoDate,
}: {
  revisionId: string;
  newCompleted: boolean;
  topicId: string;
  isoDate: string;
}) {
  // Derive the actual delta from the cached prior boolean instead of trusting
  // the caller. If the revision is already in the target state (e.g. the
  // caller used a stale `item.completed` from a frozen closure during a slow
  // API call), this returns 0 and the count doesn't drift. Makes the entire
  // optimistic update idempotent under any number of duplicate calls.
  let actualDelta = newCompleted ? 1 : -1;

  mutate(
    `/revision-date/${isoDate}`,
    (cur: ModalData | undefined) => {
      if (!cur) return cur;
      const prior = cur.topics.find((t) => t.revision_id === revisionId);
      if (prior && prior.completed === newCompleted) {
        // Cache already reflects the target state — this tap is a no-op.
        actualDelta = 0;
        return cur;
      }
      return {
        ...cur,
        topics: cur.topics.map((t) =>
          t.revision_id === revisionId ? { ...t, completed: newCompleted } : t
        ),
      };
    },
    false,
  );

  if (actualDelta !== 0) {
    mutate(
      "/revisions",
      (cur: RevisionListItem[] | undefined) => {
        if (!cur) return cur;
        return cur.map((r) =>
          r.iso_date === isoDate
            ? { ...r, done: Math.max(0, Math.min(r.total, r.done + actualDelta)) }
            : r
        );
      },
      false,
    );

    mutate(
      "/topics",
      (cur: TopicSummary[] | undefined) => {
        if (!cur) return cur;
        return cur.map((t) => {
          if (t.id !== topicId) return t;
          const completed = Math.max(
            0,
            Math.min(t.total_revisions, t.completed_revisions + actualDelta),
          );
          return {
            ...t,
            completed_revisions: completed,
            progress_percent: t.total_revisions > 0
              ? Math.round((completed / t.total_revisions) * 100)
              : 0,
          };
        });
      },
      false,
    );
  }

  try {
    // Skip the network call when the cache says nothing changed.
    // Avoids burning Render hours on no-op PATCHes during rapid taps.
    if (actualDelta !== 0) {
      await API.patch(`/revision/${revisionId}`, { completed: newCompleted });
      mutate("/streaks");
    }
  } catch (err) {
    mutate(`/revision-date/${isoDate}`);
    mutate("/revisions");
    mutate("/topics");
    mutate("/streaks");
    throw err;
  }
}

// ---------- Single-call full refresh ----------

export async function refreshAll() {
  const { data } = await API.get("/refresh");
  const today = localIso();
  mutate("/topics", data.topics, false);
  mutate("/revisions", data.revisions, false);
  mutate("/streaks", data.streaks, false);
  mutate(`/revision-date/${today}`, data.today, false);
}

export function invalidateSettings() {
  mutate("/settings");
}
