import React, { useState } from 'react'
import Header from './components/Header'
import RepoForm from './components/RepoForm'
import RepoStatus from './components/RepoStatus'
import ChatPanel from './components/ChatPanel'

export default function App() {
  const [repoState, setRepoState] = useState({ status: 'idle', repoName: null, files: 0, chunks: 0, error: null })
  const [chatContext, setChatContext] = useState({ processed: false })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 bg-white rounded shadow p-4">
            <h3 className="text-lg font-semibold mb-3">Analyze your GitHub Repository</h3>
            <RepoForm setRepoState={setRepoState} setChatContext={setChatContext} />
            <div className="mt-4">
              <RepoStatus repoState={repoState} />
            </div>
          </section>

          <section className="lg:col-span-2 bg-white rounded shadow p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-3">AI Chat</h3>
            <ChatPanel chatContext={chatContext} repoState={repoState} />
          </section>
        </div>
      </main>
    </div>
  )
}
