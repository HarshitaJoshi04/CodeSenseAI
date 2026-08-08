import React, { useState } from 'react'

export default function MessageInput({ onSend, disabled }){
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 rounded border-slate-200 p-2"
        placeholder={disabled ? 'Thinking...' : 'Ask about your repository...'}
        disabled={disabled}
        aria-label="Ask about your repository"
      />
      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={disabled || !text.trim()}>
        {disabled ? 'Thinking...' : 'Send'}
      </button>
    </form>
  )
}
