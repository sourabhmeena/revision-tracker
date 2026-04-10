"use client";

import Navigation from "../components/Navigation";
import TopicForm from "../components/TopicForm";
import TodayWidget from "../components/TodayWidget";
import useAuth from "./useAuth";

export default function Home() {
  const isLoggedIn = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-xl dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <TodayWidget />
          <TopicForm />
        </div>
      </div>
    </>
  );
}
