"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { API } from "../../api";
import Navigation from "../../../components/Navigation";
import useAuth from "../../useAuth";
import { optimisticToggleRevision, refreshAll, localIso } from "../../../hooks/useAPI";

interface TopicRevision {
  id: string;
  date: string;
  date_formatted: string;
  completed: boolean;
}

interface TopicDetail {
  id: string;
  title: string;
  category: string | null;
  chapter: string | null;
  description: string | null;
  created_at: string;
  created_at_formatted: string;
  total_revisions: number;
  completed_revisions: number;
  revisions: TopicRevision[];
}

const fetcher = (url: string) => API.get(url).then((r) => r.data);

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isLoggedIn = useAuth();
  const { data: topic, isLoading, mutate } = useSWR<TopicDetail>(
    id ? `/topics/${id}` : null,
    fetcher
  );

  const [editingDetails, setEditingDetails] = useState(false);
  const [editChapter, setEditChapter] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const startEditDetails = () => {
    setEditChapter(topic?.chapter || "");
    setEditDescription(topic?.description || "");
    setEditingDetails(true);
  };

  const saveDetails = async () => {
    const ch = editChapter.trim() || null;
    const desc = editDescription.trim() || null;
    await API.patch(`/topics/${id}`, {
      chapter: ch ?? "",
      description: desc ?? "",
    });
    mutate(
      (cur) => cur && { ...cur, chapter: ch, description: desc },
      false,
    );
    await refreshAll();
    setEditingDetails(false);
  };

  const toggleRevision = async (revisionId: string, completed: boolean, revDate: string) => {
    const newCompleted = !completed;
    mutate(
      (cur) =>
        cur && {
          ...cur,
          completed_revisions: cur.completed_revisions + (newCompleted ? 1 : -1),
          revisions: cur.revisions.map((r) =>
            r.id === revisionId ? { ...r, completed: newCompleted } : r
          ),
        },
      false,
    );
    await optimisticToggleRevision({
      revisionId,
      newCompleted,
      topicId: id,
      isoDate: revDate,
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
          <div className="max-w-3xl mx-auto text-center py-20 text-gray-500 dark:text-gray-400">
            Loading topic...
          </div>
        </div>
      </>
    );
  }

  if (!topic) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
          <div className="max-w-3xl mx-auto text-center py-20">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Topic not found</h2>
            <button onClick={() => router.push("/topics")} className="text-blue-600 dark:text-blue-400 hover:underline">
              Back to Topics
            </button>
          </div>
        </div>
      </>
    );
  }

  const progress = topic.total_revisions > 0
    ? Math.round((topic.completed_revisions / topic.total_revisions) * 100)
    : 0;

  const todayIso = localIso();

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push("/topics")}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            &larr; Back to Topics
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 md:p-8 border border-gray-200 dark:border-gray-700 shadow-md mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">{topic.title}</h1>
              {topic.category && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                  {topic.category}
                </span>
              )}
              {topic.chapter && (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                  {topic.chapter}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Created {topic.created_at_formatted}</p>

            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{progress}%</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {topic.completed_revisions} of {topic.total_revisions} revisions completed
            </p>
          </div>

          {editingDetails ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-md mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Edit Details</h3>
              <input
                value={editChapter}
                onChange={(e) => setEditChapter(e.target.value)}
                placeholder="Chapter (e.g. Ch. 5-7)"
                className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Notes — focus areas, page numbers, key concepts..."
                rows={4}
                className="w-full mb-3 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-y"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveDetails}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingDetails(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 md:p-6 border border-gray-200 dark:border-gray-700 shadow-md mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</h3>
                <button
                  onClick={startEditDetails}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit
                </button>
              </div>
              {topic.chapter && (
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                  {topic.chapter}
                </p>
              )}
              {topic.description ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {topic.description}
                </p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                  No notes yet. Click Edit to add chapter &amp; notes.
                </p>
              )}
            </div>
          )}

          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Revision Timeline</h2>

          <div className="space-y-2">
            {topic.revisions.map((r) => {
              const isOverdue = !r.completed && r.date < todayIso;
              const isToday = r.date === todayIso;

              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    r.completed
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                      : isOverdue
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                      : isToday
                      ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-600 ring-1 ring-violet-400"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <button
                    onClick={() => toggleRevision(r.id, r.completed, r.date)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      r.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 dark:border-gray-500 hover:border-violet-500"
                    }`}
                  >
                    {r.completed && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${r.completed ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-200"}`}>
                      {r.date_formatted}
                    </span>
                  </div>

                  {isToday && !r.completed && (
                    <span className="text-xs bg-violet-500 text-white px-2 py-0.5 rounded-full font-medium">Today</span>
                  )}
                  {isOverdue && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">Overdue</span>
                  )}
                  {r.completed && (
                    <span className="text-xs text-green-600 font-medium">Done</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
