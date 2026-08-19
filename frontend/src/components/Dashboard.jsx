import React, { useState } from "react";
import { deleteRepository } from "../api";
import Header from "./Header";
import RepoForm from "./RepoForm";
import RepoStatus from "./RepoStatus";
import ChatPanel from "./ChatPanel";
import ChatHistory from "./ChatHistory";
import HistoryPage from "./HistoryPage";
import { useNavigate } from "react-router-dom";
export default function Dashboard() {
const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState("home");

  // RESTORE CURRENT REPOSITORY AFTER REFRESH
  const [repoState, setRepoState] = useState({
    status: localStorage.getItem("currentSessionId")
      ? "success"
      : "idle",

    repoName:
      localStorage.getItem("currentRepoName") || null,

    files:
      Number(localStorage.getItem("currentRepoFiles")) || 0,

    chunks:
      Number(localStorage.getItem("currentRepoChunks")) || 0,

    error: null,
  });

  // RESTORE CURRENT CHAT SESSION AFTER REFRESH
  const [chatContext, setChatContext] = useState({
    processed:
      !!localStorage.getItem("currentSessionId"),

    repoName:
      localStorage.getItem("currentRepoName") || null,

    repositoryId:
      localStorage.getItem("currentRepositoryId") || null,

    sessionId:
      localStorage.getItem("currentSessionId") || null,
  });

  const isAnalyzing = repoState.status === "loading";

  // NEW ANALYSIS
  const handleNewAnalysis = () => {
    localStorage.removeItem("currentSessionId");
    localStorage.removeItem("currentRepositoryId");
    localStorage.removeItem("currentRepoName");
    localStorage.removeItem("currentRepoFiles");
    localStorage.removeItem("currentRepoChunks");

    setRepoState({
      status: "idle",
      repoName: null,
      files: 0,
      chunks: 0,
      error: null,
    });

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
      setChatContext((prev) => ({
        ...prev,
        processed: false,
        sessionId: null,
      }));
      localStorage.removeItem("currentSessionId");
      return;
    }

    console.log("SELECTED SESSION:", session);

    const repositoryId =
      session.repositoryId?._id ||
      session.repositoryId;

    const repoName =
      session.repositoryId?.repoName || null;

    const sessionId = session._id;

    setChatContext({
      processed: true,
      repositoryId,
      sessionId,
      repoName,
    });

    setRepoState((prev) => ({
      ...prev,
      status: "success",
      repoName: repoName || prev.repoName,
      error: null,
    }));

    localStorage.setItem(
      "currentSessionId",
      sessionId
    );

    localStorage.setItem(
      "currentRepositoryId",
      repositoryId
    );

    if (repoName) {
      localStorage.setItem(
        "currentRepoName",
        repoName
      );
    }

    setCurrentPage("home");
  };

  const handleDeleteRepository = async () => {
  const repositoryId = chatContext.repositoryId;

  if (!repositoryId) {
    alert("No repository selected.");
    return;
  }

  const confirmed = window.confirm(
    `Delete ${chatContext.repoName || "this repository"}?\n\n` +
    "This will permanently delete the repository, files, chat history, " +
    "server clone, and AI/vector data."
  );

  if (!confirmed) {
    return;
  }

  try {
    const result = await deleteRepository(repositoryId);

    console.log("DELETE REPOSITORY RESPONSE:", result);

    // Clear local storage
    localStorage.removeItem("currentSessionId");
    localStorage.removeItem("currentRepositoryId");
    localStorage.removeItem("currentRepoName");
    localStorage.removeItem("currentRepoFiles");
    localStorage.removeItem("currentRepoChunks");

    // Reset repository state
    setRepoState({
      status: "idle",
      repoName: null,
      files: 0,
      chunks: 0,
      error: null,
    });

    // Reset chat state
    setChatContext({
      processed: false,
      repositoryId: null,
      sessionId: null,
      repoName: null,
    });

    alert("Repository deleted successfully.");

  } catch (error) {
    console.error("Delete repository error:", error);

    alert(
      error.response?.data?.message ||
      "Failed to delete repository."
    );
  }
};

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  localStorage.removeItem("currentSessionId");
  localStorage.removeItem("currentRepositoryId");
  localStorage.removeItem("currentRepoName");
  localStorage.removeItem("currentRepoFiles");
  localStorage.removeItem("currentRepoChunks");

  navigate("/");
};

return (
  <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-sky-50 to-blue-50 text-slate-800">

    {/* =========================
        HEADER
    ========================== */}
<Header
  currentPage={currentPage}
  onNavigate={setCurrentPage}
  onNewAnalysis={handleNewAnalysis}
  onLogout={handleLogout}
/>

    {/* =========================
        MAIN
    ========================== */}
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

      {/* =========================
          HOME
      ========================== */}
      {currentPage === "home" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[330px_1fr]">

          {/* =========================
              LEFT SIDEBAR
          ========================== */}
          <aside className="space-y-5">

            {/* REPOSITORY CARD */}
            <section className="overflow-hidden rounded-2xl border border-cyan-200 bg-white/90 shadow-lg shadow-cyan-100/60 backdrop-blur">

              <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-100 to-sky-100 px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-cyan-500 to-sky-500 text-lg text-white shadow-md shadow-cyan-200">
                    🌊
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-cyan-900">
                      Repository
                    </h2>

                    <p className="mt-0.5 text-xs text-cyan-700">
                      Analyze a GitHub project
                    </p>
                  </div>

                </div>

              </div>

              <div className="p-5">
                <RepoForm
                  setRepoState={setRepoState}
                  setChatContext={setChatContext}
                />
              </div>

            </section>


            {/* REPOSITORY STATUS */}
            <section className="overflow-hidden rounded-2xl border border-sky-200 bg-white/90 shadow-lg shadow-sky-100/60 backdrop-blur">

              <div className="flex items-center justify-between border-b border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-4">

                <div>

                  <h3 className="text-base font-bold text-sky-900">
                    Repository Status
                  </h3>

                  <p className="mt-1 text-xs text-sky-600">
                    Current analysis
                  </p>

                </div>

                {repoState.status === "success" && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                    ● Ready
                  </span>
                )}

                {isAnalyzing && (
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-600">
                    ● Analyzing
                  </span>
                )}

              </div>

              <div className="p-5">
                <RepoStatus
  repoState={repoState}
  repositoryId={chatContext.repositoryId}
  onDelete={handleDeleteRepository}
/>
              </div>

            </section>


            {/* CHAT HISTORY */}
            <section className="overflow-hidden rounded-2xl border border-cyan-200 bg-white/90 shadow-lg shadow-cyan-100/60 backdrop-blur">

              <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-sky-50 px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                    💬
                  </div>

                  <div>

                    <h3 className="text-base font-bold text-cyan-900">
                      Chat History
                    </h3>

                    <p className="mt-1 text-xs text-cyan-600">
                      Previous conversations
                    </p>

                  </div>

                </div>

              </div>

              <div className="max-h-[350px] overflow-y-auto p-3">
                <ChatHistory
                  repositoryId={chatContext.repositoryId}
                  activeSessionId={chatContext.sessionId}
                  onSelectSession={handleSelectSession}
                />
              </div>

            </section>

          </aside>


          {/* =========================
              CHAT AREA
          ========================== */}
          <section className="flex min-h-[calc(100vh-150px)] flex-col overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-xl shadow-sky-100/70">

            {/* CHAT HEADER */}
            <div className="flex items-center justify-between border-b border-cyan-100 bg-gradient-to-r from-cyan-100 via-sky-100 to-blue-100 px-5 py-4">

              <div>

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-cyan-500 to-sky-500 text-white shadow-md">
                    💧
                  </div>

                  <h1 className="text-lg font-bold text-cyan-950">
                    CodeSense AI
                  </h1>

                  <span className="rounded-full bg-cyan-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                    AI
                  </span>

                </div>

                <p className="mt-1 ml-11 text-xs text-sky-700">
                  {isAnalyzing
                    ? "Scanning your repository..."
                    : "Ask anything about your repository"}
                </p>

              </div>


              {/* ACTIVE REPOSITORY */}
              {chatContext.repoName && (
                <div className="hidden items-center gap-2 rounded-xl border border-cyan-200 bg-white/80 px-3 py-2 shadow-sm sm:flex">

                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />

                  <span className="max-w-[220px] truncate text-xs font-bold text-cyan-800">
                    {chatContext.repoName}
                  </span>

                </div>
              )}

            </div>


            {/* CHAT CONTENT */}
            <div className="min-h-0 flex-1 bg-gradient-to-b from-cyan-50/70 via-sky-50/50 to-blue-50/70">

              <ChatPanel
                chatContext={chatContext}
                repoState={repoState}
              />

            </div>

          </section>

        </div>
      )}


      {/* =========================
          HISTORY PAGE
      ========================== */}
      {currentPage === "history" && (

        <div className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-xl shadow-cyan-100/70">

          {/* HISTORY HEADER */}
          <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-100 via-sky-100 to-blue-100 px-6 py-6">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-b from-cyan-500 to-sky-500 text-xl text-white shadow-lg shadow-cyan-200">
                🌊
              </div>

              <div>

                <h1 className="text-xl font-bold text-cyan-950">
                  Chat History
                </h1>

                <p className="mt-1 text-sm text-sky-700">
                  Browse and continue your previous repository conversations.
                </p>

              </div>

            </div>

          </div>


          {/* HISTORY CONTENT */}
          <div className="bg-gradient-to-b from-white to-cyan-50/40 p-5">

            <HistoryPage
              activeSessionId={chatContext.sessionId}
              onSelectSession={handleSelectSession}
            />

          </div>

        </div>

      )}

    </main>

  </div>
);
}