import React from 'react'

export default function SourcesList({ sources }){
  if (!sources || sources.length === 0) return null

  return (
    <div className="bg-slate-50 border rounded p-3">
      <div className="font-medium mb-2">Sources</div>
      <ul className="text-sm space-y-1">
        {sources.map((s, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span className="text-slate-500">📄</span>
            <span className="font-mono text-xs">{s.file}</span>
            <span className="text-slate-400 ml-2">{typeof s.chunk !== 'undefined' ? `chunk: ${s.chunk}` : ''}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
