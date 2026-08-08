import React from 'react'

export default function RepoStatus({ repoState }){
  if (!repoState) return null

  if (repoState.status === 'idle') {
    return <div className="text-sm text-slate-600">No repository analyzed yet.</div>
  }

  if (repoState.status === 'processing') {
    return <div className="text-sm text-indigo-600">Analyzing repository...</div>
  }

  if (repoState.status === 'error') {
    return <div className="text-sm text-red-600">Unable to analyze repository: {repoState.error}</div>
  }

  return (
    <div className="space-y-1 text-sm">
      <div className="font-medium">Repository analyzed successfully</div>
      <div>Repo: <span className="font-mono">{repoState.repoName}</span></div>
      <div>Files: {repoState.files} • Chunks: {repoState.chunks}</div>
    </div>
  )
}
