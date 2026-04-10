"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import TopicScheduleEditor from "../../components/TopicScheduleEditor";
import ConfirmModal from "../../components/ConfirmModal";
import InputModal from "../../components/InputModal";
import { API } from "../api";
import useAuth from "../useAuth";
import { useTopics, refreshAll } from "../../hooks/useAPI";
import type { TopicSummary } from "../types";

type SortKey = "newest" | "alphabetical" | "most_progress" | "least_progress";

export default function TopicsPage() {
  const isLoggedIn = useAuth();
  const { data: topics = [], isLoading: loading } = useTopics();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editChapter, setEditChapter] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("");
  const [newTopicChapter, setNewTopicChapter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [scheduleTopic, setScheduleTopic] = useState<TopicSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TopicSummary | null>(null);
  const [extendTarget, setExtendTarget] = useState<TopicSummary | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterChapter, setFilterChapter] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    topics.forEach((t) => { if (t.category) cats.add(t.category); });
    return Array.from(cats).sort();
  }, [topics]);

  const chapters = useMemo(() => {
    const chs = new Set<string>();
    topics.forEach((t) => { if (t.chapter) chs.add(t.chapter); });
    return Array.from(chs).sort();
  }, [topics]);

  const filteredTopics = useMemo(() => {
    let result = [...topics];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.chapter && t.chapter.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== "all") {
      result = result.filter((t) => t.category === filterCategory);
    }
    if (filterChapter !== "all") {
      result = result.filter((t) => t.chapter === filterChapter);
    }
    switch (sortBy) {
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "most_progress":
        result.sort((a, b) => b.progress_percent - a.progress_percent);
        break;
      case "least_progress":
        result.sort((a, b) => a.progress_percent - b.progress_percent);
        break;
      default:
        break;
    }
    return result;
  }, [topics, search, sortBy, filterCategory, filterChapter]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) return;

    try {
      await API.post("/topics", {
        title: newTopicTitle,
        category: newTopicCategory.trim() || null,
        chapter: newTopicChapter.trim() || null,
      });
      showToast("success", `"${newTopicTitle}" added!`);
      setNewTopicTitle("");
      setNewTopicCategory("");
      setNewTopicChapter("");
      setShowAddForm(false);
      await refreshAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast("error", msg || "Failed to add topic");
    }
  };

  const handleUpdateTopic = async (id: string) => {
    if (!editTitle.trim()) return;

    try {
      await API.patch(`/topics/${id}`, {
        title: editTitle,
        category: editCategory.trim() || "",
        chapter: editChapter.trim() || "",
        description: editDescription.trim() || "",
      });
      setEditingId(null);
      setEditTitle("");
      setEditCategory("");
      setEditChapter("");
      setEditDescription("");
      await refreshAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast("error", msg || "Failed to update topic");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/topics/${deleteTarget.id}`);
      await refreshAll();
      showToast("success", `"${deleteTarget.title}" deleted`);
    } catch {
      showToast("error", "Failed to delete topic");
    }
    setDeleteTarget(null);
  };

  const confirmExtend = async (years: string) => {
    if (!extendTarget) return;
    const n = Number(years);
    if (isNaN(n) || n <= 0) return;

    try {
      const res = await API.post(`/topics/${extendTarget.id}/extend-revisions?years=${n}`);
      showToast("success", `Added ${res.data.revisions_added} revisions for ${years} year(s)`);
      await refreshAll();
    } catch {
      showToast("error", "Failed to extend revisions");
    }
    setExtendTarget(null);
  };

  const startEdit = (topic: TopicSummary) => {
    setEditingId(topic.id);
    setEditTitle(topic.title);
    setEditCategory(topic.category || "");
    setEditChapter(topic.chapter || "");
    setEditDescription(topic.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditCategory("");
    setEditChapter("");
    setEditDescription("");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 md:mb-2">
                Manage Topics
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Add, edit, or delete your learning topics
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-5 py-2.5 md:px-6 md:py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 self-start md:self-auto"
            >
              <span className="text-xl">+</span>
              <span>Add New Topic</span>
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-md mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                Add New Topic
              </h3>
              <div className="flex flex-col gap-2 sm:gap-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
                    placeholder="Topic name..."
                    className="min-w-0 flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={newTopicCategory}
                    onChange={(e) => setNewTopicCategory(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
                    placeholder="Category (optional)"
                    list="topics-category-suggestions"
                    className="sm:w-40 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                  <input
                    type="text"
                    value={newTopicChapter}
                    onChange={(e) => setNewTopicChapter(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
                    placeholder="Chapter (optional)"
                    className="sm:w-40 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddTopic}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTopicTitle("");
                      setNewTopicCategory("");
                      setNewTopicChapter("");
                    }}
                    className="px-5 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && topics.length > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics..."
                className="min-w-0 flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 bg-white dark:bg-gray-800"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
              >
                <option value="newest">Newest first</option>
                <option value="alphabetical">A-Z</option>
                <option value="most_progress">Most progress</option>
                <option value="least_progress">Least progress</option>
              </select>
              {categories.length > 0 && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
              {chapters.length > 0 && (
                <select
                  value={filterChapter}
                  onChange={(e) => setFilterChapter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm"
                >
                  <option value="all">All chapters</option>
                  {chapters.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading topics...</p>
            </div>
          ) : topics.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                No topics yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add your first topic to start tracking revisions
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
              >
                Add Your First Topic
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  {editingId === topic.id ? (
                    <div className="flex flex-col gap-2 sm:gap-3">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleUpdateTopic(topic.id)
                          }
                          placeholder="Topic name"
                          className="min-w-0 flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleUpdateTopic(topic.id)
                          }
                          placeholder="Category (optional)"
                          list="topics-category-suggestions"
                          className="sm:w-40 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                        />
                        <input
                          type="text"
                          value={editChapter}
                          onChange={(e) => setEditChapter(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleUpdateTopic(topic.id)
                          }
                          placeholder="Chapter (optional)"
                          className="sm:w-40 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                        />
                      </div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Notes (optional)"
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-y"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateTopic(topic.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-grow min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1 md:mb-2">
                          <Link href={`/topics/${topic.id}`} className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {topic.title}
                          </Link>
                          {(topic.category || topic.chapter) && (
                            <div className="flex items-center gap-1.5">
                              {topic.category && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                  {topic.category}
                                </span>
                              )}
                              {topic.chapter && (
                                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                  {topic.chapter}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {topic.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {topic.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          <span>Created: {topic.created_at_formatted}</span>
                          <span>
                            {topic.completed_revisions} / {topic.total_revisions} revisions
                          </span>
                          {topic.has_custom_schedule && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                              Custom schedule
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Schedule: +{topic.intervals.join(", +")} then every {topic.repeat_interval}d
                        </div>

                        <div className="mt-2 md:mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${topic.progress_percent}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {topic.progress_percent}% completed
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(topic)}
                          className="px-3 md:px-4 py-2 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg transition-colors"
                          title="Edit topic name"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setScheduleTopic(topic)}
                          className="px-3 md:px-4 py-2 bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-lg transition-colors"
                          title="Edit revision schedule"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => setExtendTarget(topic)}
                          className="px-3 md:px-4 py-2 bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900/60 text-green-700 dark:text-green-300 text-sm font-medium rounded-lg transition-colors"
                          title="Extend revisions"
                        >
                          Extend
                        </button>
                        <button
                          onClick={() => setDeleteTarget(topic)}
                          className="px-3 md:px-4 py-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg transition-colors"
                          title="Delete topic"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {topics.length > 0 && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                Infinite Revision System
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <p>&bull; Each topic automatically generates revisions for <strong>5 years</strong> when created</p>
                <p>&bull; Default: +1, +3, +7, +21, +30 days, then <strong>every 30 days indefinitely</strong></p>
                <p>&bull; You can customise the intervals in <strong>Settings</strong></p>
                <p>&bull; Need more? Click the <strong className="text-green-700">Extend</strong> button to add more years</p>
              </div>
            </div>
          )}

          {topics.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-rose-500 via-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-3xl font-bold">{topics.length}</div>
                  <div className="text-blue-100">Total Topics</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {topics.reduce((sum, t) => sum + t.total_revisions, 0)}
                  </div>
                  <div className="text-blue-100">Total Revisions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {topics.reduce((sum, t) => sum + t.completed_revisions, 0)}
                  </div>
                  <div className="text-blue-100">Completed Revisions</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {scheduleTopic && (
        <TopicScheduleEditor
          topicId={scheduleTopic.id}
          topicTitle={scheduleTopic.title}
          currentIntervals={scheduleTopic.intervals}
          currentRepeat={scheduleTopic.repeat_interval}
          hasCustom={scheduleTopic.has_custom_schedule}
          onSaved={async () => {
            setScheduleTopic(null);
            await refreshAll();
          }}
          onClose={() => setScheduleTopic(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Topic"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This will also delete all associated revisions.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {extendTarget && (
        <InputModal
          title="Extend Revisions"
          message={`How many additional years of revisions for "${extendTarget.title}"?`}
          inputType="number"
          defaultValue="1"
          placeholder="Years"
          submitLabel="Extend"
          onSubmit={confirmExtend}
          onCancel={() => setExtendTarget(null)}
        />
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <datalist id="topics-category-suggestions">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
}
