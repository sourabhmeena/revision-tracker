"use client";

import { useState } from "react";
import { API } from "../app/api";
import { invalidateTopics } from "../hooks/useAPI";

export default function TopicForm() {
  const [title, setTitle] = useState("");

  const addTopic = async () => {
    if (!title.trim()) return;

    await API.post("/topics", { title });
    setTitle("");
    invalidateTopics();
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-4 md:p-6 border border-gray-200">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">
        Add Topic
      </h2>

      <div className="flex gap-2 md:gap-3">
        <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter topic name..."
              className="
                min-w-0 flex-1 px-3 md:px-4 py-2 rounded-lg
                border border-gray-300
                focus:border-gray-500
                focus:ring-0
                outline-none
                text-gray-800
                placeholder:text-gray-400
              "
            />

        <button
          onClick={addTopic}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-2 md:py-3 rounded-lg font-medium transition-all shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  );
}
