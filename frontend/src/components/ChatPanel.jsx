import React, { useReducer, useState } from 'react'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import SourcesList from './SourcesList'
import { askQuestion } from '../api'

const initialState = { messages: [] , lastSources: null, thinking: false }

function reducer(state, action){
  switch(action.type){
    case 'add_user':
      return { ...state, messages: [...state.messages, { role: 'user', content: action.payload }] }
    case 'add_assistant':
      return { ...state, messages: [...state.messages, { role: 'assistant', content: action.payload }], thinking:false }
    case 'set_thinking':
      return { ...state, thinking: action.payload }
    case 'set_sources':
      return { ...state, lastSources: action.payload }
    default:
      return state
  }
}

export default function ChatPanel({ chatContext, repoState }){
  const [state, dispatch] = useReducer(reducer, initialState)

  const handleSend = async (text) => {
    if (!text || !text.trim()) return
    if (repoState.status !== 'success') {
      alert('Please analyze a repository first')
      return
    }

    dispatch({ type: 'add_user', payload: text })
    dispatch({ type: 'set_thinking', payload: true })

    try {
      const res = await askQuestion(text)

      if (res?.success) {
        dispatch({ type: 'add_assistant', payload: res.answer })
        dispatch({ type: 'set_sources', payload: res.sources })
      } else {
        dispatch({ type: 'add_assistant', payload: 'Unable to get answer from server.' })
      }

    } catch (err) {
      console.error('Chat error', err)
      dispatch({ type: 'add_assistant', payload: `Error: ${err.message}` })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-auto border rounded p-3">
        <MessageList messages={state.messages} />
      </div>

      <div className="mt-3">
        <MessageInput onSend={handleSend} disabled={state.thinking} />
      </div>

      <div className="mt-4">
        <SourcesList sources={state.lastSources} />
      </div>
    </div>
  )
}
