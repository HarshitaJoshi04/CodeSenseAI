import React, { useState } from "react";
import Header from "./components/Header";
import RepoForm from "./components/RepoForm";
import RepoStatus from "./components/RepoStatus";
import ChatPanel from "./components/ChatPanel";
import ChatHistory from "./components/ChatHistory";
import HistoryPage from "./components/HistoryPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  // RESTORE CURRENT REPOSITORY AFTER REFRESH

  const [repoState, setRepoState] = useState({
    status: localStorage.getItem("currentSessionId") ? "success" : "idle",

    repoName: localStorage.getItem("currentRepoName") || null,

    files: Number(localStorage.getItem("currentRepoFiles")) || 0,

    chunks: Number(localStorage.getItem("currentRepoChunks")) || 0,

    error: null,
  });

  // RESTORE CURRENT CHAT SESSION AFTER REFRESH

  const [chatContext, setChatContext] = useState({
    processed: !!localStorage.getItem("currentSessionId"),

    repoName: localStorage.getItem("currentRepoName") || null,

    repositoryId: localStorage.getItem("currentRepositoryId") || null,

    sessionId: localStorage.getItem("currentSessionId") || null,
  });

  // NEW ANALYSIS

  const handleNewAnalysis = () => {
    // Clear ONLY current active repository/session
    localStorage.removeItem("currentSessionId");
    localStorage.removeItem("currentRepositoryId");
    localStorage.removeItem("currentRepoName");
    localStorage.removeItem("currentRepoFiles");
    localStorage.removeItem("currentRepoChunks");

    // Reset repository UI
    setRepoState({
      status: "idle",
      repoName: null,
      files: 0,
      chunks: 0,
      error: null,
    });

    // Reset chat context
    setChatContext({
      processed: false,
      repositoryId: null,
      sessionId: null,
      repoName: null,
    });

    setCurrentPage("home");
  };

  // SELECT EXISTING SESSION

  const handleSelectSession = (session) => {
    if (!session) {
      setChatContext({
        processed: false,
        repositoryId: null,
        sessionId: null,
        repoName: null,
      });

      return;
    }

    console.log("SELECTED SESSION:", session);

    const repositoryId = session.repositoryId?._id || session.repositoryId;

    const repoName = session.repositoryId?.repoName || null;

    const sessionId = session._id;

    // RESTORE CHAT CONTEXT

    setChatContext({
      processed: true,
      repositoryId,
      sessionId,
      repoName,
    });

    // RESTORE REPOSITORY UI

    setRepoState((prev) => ({
      ...prev,

      status: "success",

      repoName: repoName || prev.repoName,

      error: null,
    }));

    // SAVE CURRENT SESSION

    localStorage.setItem("currentSessionId", sessionId);

    localStorage.setItem("currentRepositoryId", repositoryId);

    if (repoName) {
      localStorage.setItem("currentRepoName", repoName);
    }

    setCurrentPage("home");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onNewAnalysis={handleNewAnalysis}
      />

      <main className="container mx-auto px-4 py-6">
        {currentPage === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-1 bg-white rounded shadow p-4">
              <h3 className="text-lg font-semibold mb-3">
                Analyze your GitHub Repository
              </h3>

              <RepoForm
                setRepoState={setRepoState}
                setChatContext={setChatContext}
              />

              <div className="mt-4">
                <RepoStatus repoState={repoState} />

                <ChatHistory
                  repositoryId={chatContext.repositoryId}
                  activeSessionId={chatContext.sessionId}
                  onSelectSession={handleSelectSession}
                />
              </div>
            </section>

            <section className="lg:col-span-2 bg-white rounded shadow p-4 flex flex-col">
              <h3 className="text-lg font-semibold mb-3">AI Chat</h3>

              <ChatPanel chatContext={chatContext} repoState={repoState} />
            </section>
          </div>
        )}

        {currentPage === "history" && (
          <HistoryPage onSelectSession={handleSelectSession} />
        )}
      </main>
    </div>
  );
}
