"use client";

import { useState } from "react";
import { API } from "../app/api";

interface TopicFormProps {
  onAdded?: () => void;
}

export default function TopicForm({ onAdded }: TopicFormProps) {
  const [title, setTitle] = useState("");

  const addTopic = async () => {
    if (!title.trim()) return;

    await API.post("/topics", { title });
    setTitle("");
    if (onAdded) onAdded();
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        Add Topic
      </h2>

      <div className="flex gap-3">
        <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter topic name..."
              className="
                flex-grow px-4 py-2 rounded-lg
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium transition-all"
        >
          Add
        </button>
      </div>
    </div>
  );
}
