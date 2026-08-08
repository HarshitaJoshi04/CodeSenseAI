import React from 'react'

export default function Header(){
  return (
    <header className="bg-slate-800 text-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded flex items-center justify-center font-bold">CS</div>
          <div>
            <h1 className="text-xl font-semibold">CodeSenseAI</h1>
            <div className="text-sm text-slate-200">Repository-aware developer assistant</div>
          </div>
        </div>
        <div className="text-sm opacity-90">Backend: {import.meta.env.VITE_API_URL || 'http://localhost:5000'}</div>
      </div>
    </header>
  )
}
