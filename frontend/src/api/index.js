const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function analyzeRepository(repoUrl) {
  const resp = await fetch(`${API_BASE}/api/github/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl })
  })
  const data = await resp.json().catch(() => null)
  if (!resp.ok) {
    const message = data?.error || data?.message || `Status ${resp.status}`
    throw new Error(message)
  }
  return data
}

export async function askQuestion(question) {
  const resp = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  })
  const data = await resp.json().catch(() => null)
  if (!resp.ok) {
    const message = data?.error || data?.message || `Status ${resp.status}`
    throw new Error(message)
  }
  return data
}
