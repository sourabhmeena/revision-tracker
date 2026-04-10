"use client";

import { useState } from "react";
import Navigation from "../../components/Navigation";
import TopicScheduleEditor from "../../components/TopicScheduleEditor";
import { API } from "../api";
import useAuth from "../useAuth";
import { useTopics, invalidateTopics } from "../../hooks/useAPI";
import type { TopicSummary } from "../types";

export default function TopicsPage() {
  const isLoggedIn = useAuth();
  const { data: topics = [], isLoading: loading } = useTopics();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [scheduleTopic, setScheduleTopic] = useState<TopicSummary | null>(null);

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) return;

    try {
      await API.post("/topics", { title: newTopicTitle });
      setNewTopicTitle("");
      setShowAddForm(false);
      invalidateTopics();
    } catch (error) {
      console.error("Failed to add topic:", error);
      alert("Failed to add topic");
    }
  };

  const handleUpdateTopic = async (id: string) => {
    if (!editTitle.trim()) return;

    try {
      await API.patch(`/topics/${id}`, { title: editTitle });
      setEditingId(null);
      setEditTitle("");
      invalidateTopics();
    } catch (error) {
      console.error("Failed to update topic:", error);
      alert("Failed to update topic");
    }
  };

  const handleDeleteTopic = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all associated revisions.`)) {
      return;
    }

    try {
      await API.delete(`/topics/${id}`);
      invalidateTopics();
    } catch (error) {
      console.error("Failed to delete topic:", error);
      alert("Failed to delete topic");
    }
  };

  const handleExtendRevisions = async (id: string, title: string) => {
    const years = prompt(
      `How many additional years of revisions would you like to generate for "${title}"?`,
      "1"
    );

    if (!years || isNaN(Number(years)) || Number(years) <= 0) {
      return;
    }

    try {
      const res = await API.post(`/topics/${id}/extend-revisions?years=${years}`);
      alert(`Successfully added ${res.data.revisions_added} revisions for ${years} year(s)!`);
      invalidateTopics();
    } catch (error) {
      console.error("Failed to extend revisions:", error);
      alert("Failed to extend revisions");
    }
  };

  const startEdit = (topic: TopicSummary) => {
    setEditingId(topic.id);
    setEditTitle(topic.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
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
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">
                Manage Topics
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Add, edit, or delete your learning topics
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-5 py-2.5 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 self-start md:self-auto"
            >
              <span className="text-xl">+</span>
              <span>Add New Topic</span>
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-md mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Add New Topic
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
                  placeholder="Enter topic name..."
                  className="min-w-0 flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 placeholder-gray-400"
                  autoFocus
                />
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleAddTopic}
                    className="flex-1 sm:flex-none px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTopicTitle("");
                    }}
                    className="flex-1 sm:flex-none px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading topics...</p>
            </div>
          ) : topics.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No topics yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add your first topic to start tracking revisions
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Add Your First Topic
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  {editingId === topic.id ? (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleUpdateTopic(topic.id)
                        }
                        className="min-w-0 flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-0 outline-none text-gray-900 placeholder-gray-400"
                        autoFocus
                      />
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleUpdateTopic(topic.id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 sm:flex-none px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-grow min-w-0">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-1 md:mb-2">
                          {topic.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
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
                        <div className="text-xs text-gray-400 mt-1">
                          Schedule: +{topic.intervals.join(", +")} then every {topic.repeat_interval}d
                        </div>

                        <div className="mt-2 md:mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${topic.progress_percent}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {topic.progress_percent}% completed
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(topic)}
                          className="px-3 md:px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors"
                          title="Edit topic name"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setScheduleTopic(topic)}
                          className="px-3 md:px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-medium rounded-lg transition-colors"
                          title="Edit revision schedule"
                        >
                          Schedule
                        </button>
                        <button
                          onClick={() => handleExtendRevisions(topic.id, topic.title)}
                          className="px-3 md:px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium rounded-lg transition-colors"
                          title="Extend revisions"
                        >
                          Extend
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(topic.id, topic.title)}
                          className="px-3 md:px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
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
            <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                Infinite Revision System
              </h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>&bull; Each topic automatically generates revisions for <strong>5 years</strong> when created</p>
                <p>&bull; Default: +1, +3, +7, +21, +30 days, then <strong>every 30 days indefinitely</strong></p>
                <p>&bull; You can customise the intervals in <strong>Settings</strong></p>
                <p>&bull; Need more? Click the <strong className="text-green-700">Extend</strong> button to add more years</p>
              </div>
            </div>
          )}

          {topics.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
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
          onSaved={() => {
            setScheduleTopic(null);
            invalidateTopics();
          }}
          onClose={() => setScheduleTopic(null)}
        />
      )}
    </>
  );
}
