import React from 'react'

function Message({ msg }){
  const isUser = msg.role === 'user'
  return (
    <div className={`my-2 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'} rounded p-3 max-w-[80%]`}> 
        {msg.content}
      </div>
    </div>
  )
}

export default function MessageList({ messages }){
  return (
    <div className="space-y-2">
      {messages.length === 0 ? (
        <div className="text-sm text-slate-500">Ask something about the analyzed repository to get started.</div>
      ) : (
        messages.map((m, i) => <Message key={i} msg={m} />)
      )}
    </div>
  )
}
