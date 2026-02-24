import { useState, useRef, useCallback, useEffect } from 'react'
import hljs from 'highlight.js/lib/core'
import { syntaxHighlight } from '../utils.ts'

// Register GraphQL language for highlight.js
hljs.registerLanguage('graphql', () => ({
  name: 'GraphQL',
  aliases: ['gql'],
  keywords: {
    keyword: 'type input enum union interface implements extend schema directive scalar fragment query mutation subscription on',
    literal: 'true false null',
  },
  contains: [
    hljs.HASH_COMMENT_MODE,
    hljs.QUOTE_STRING_MODE,
    hljs.NUMBER_MODE,
    { className: 'meta', begin: '\\@[a-zA-Z_]\\w*' },
    { className: 'type', begin: '\\b(ID|String|Int|Float|Boolean|Date)\\b' },
    { className: 'attr', begin: '[a-zA-Z_]\\w*(?=\\s*:)' },
    { className: 'punctuation', begin: '[!{}()\\[\\]:=|]' },
    { className: 'variable', begin: '\\$[a-zA-Z_]\\w*' },
  ],
}))

// Types
interface GraphQLResponse {
  data?: Record<string, unknown>
  errors?: Array<{ message: string }>
}

interface StreamController {
  close: () => void
}

// Get the base URL for API calls
const BASE_URL = window.location.origin + '/demo-graphql'

// Default query and mutation templates
const DEFAULT_QUERY = `{
  Author(id: "author-1") {
    id
    name
    bio
    books {
      id
      title
      publishedYear
    }
  }
}`

const DEFAULT_MUTATION = `mutation {
  updateAuthor(id: "author-1", data: {
    bio: "English novelist known for Pride and Prejudice, Sense and Sensibility, Emma, and more. Her works earned her a place as one of the most widely read writers in English literature."
  }) {
    id
    name
    bio
  }
}`

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p>{message}</p>
    </div>
  )
}

// Play icon SVG
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

// Subscribe icon SVG
function SubscribeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

// Highlighted code editor — transparent textarea over a highlighted pre
function CodeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const codeRef = useRef<HTMLElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.textContent = value
      codeRef.current.removeAttribute('data-highlighted')
      hljs.highlightElement(codeRef.current)
    }
  }, [value])

  const handleScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop
      preRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  return (
    <div className="code-editor-wrap">
      <pre ref={preRef} className="code-editor-highlight"><code ref={codeRef} className="language-graphql">{value}</code></pre>
      <textarea
        ref={textareaRef}
        className="code-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
      />
    </div>
  )
}

// Panel component
interface PanelProps {
  title: string
  badge: string
  badgeSuccess?: boolean
  children: React.ReactNode
}

function Panel({ title, badge, badgeSuccess, children }: PanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        <span className={`panel-badge ${badgeSuccess ? 'success' : ''}`}>{badge}</span>
      </div>
      <div className="panel-content">
        {children}
      </div>
    </div>
  )
}

// Results panel component
interface ResultsPanelProps {
  result: GraphQLResponse | null
  badge: string
  badgeSuccess?: boolean
  emptyMessage: string
}

function ResultsPanel({ result, badge, badgeSuccess, emptyMessage }: ResultsPanelProps) {
  return (
    <Panel title="Results" badge={badge} badgeSuccess={badgeSuccess}>
      <div className="results-container">
        {result === null ? (
          <EmptyState message={emptyMessage} />
        ) : result.errors ? (
          <pre className="results-pre error-text">
            {JSON.stringify(result.errors, null, 2)}
          </pre>
        ) : (
          <pre
            className="results-pre"
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(JSON.stringify(result.data, null, 2))
            }}
          />
        )}
      </div>
    </Panel>
  )
}

export function GraphqlPage() {
  // Query state
  const [queryText, setQueryText] = useState(DEFAULT_QUERY)
  const [queryResult, setQueryResult] = useState<GraphQLResponse | null>(null)
  const [queryBadge, setQueryBadge] = useState('Ready')
  const [queryBadgeSuccess, setQueryBadgeSuccess] = useState(false)

  // Mutation state
  const [mutationText, setMutationText] = useState(DEFAULT_MUTATION)
  const [mutationResult, setMutationResult] = useState<GraphQLResponse | null>(null)
  const [mutationBadge, setMutationBadge] = useState('Ready')
  const [mutationBadgeSuccess, setMutationBadgeSuccess] = useState(false)

  // Subscription state
  const [isSubscribed, setIsSubscribed] = useState(false)
  const subscriptionRef = useRef<StreamController | null>(null)

  // Run a GraphQL query
  const runQuery = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      })

      const data: GraphQLResponse = await response.json()

      if (data.errors) {
        setQueryResult(data)
        setQueryBadge('Error')
        setQueryBadgeSuccess(false)
      } else {
        setQueryResult(data)
        setQueryBadge('Ready')
        setQueryBadgeSuccess(false)
      }
    } catch (error) {
      setQueryResult({
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }]
      })
      setQueryBadge('Error')
      setQueryBadgeSuccess(false)
    }
  }, [queryText])

  // Run a GraphQL mutation
  const runMutation = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutationText })
      })

      const data: GraphQLResponse = await response.json()

      if (data.errors) {
        setMutationResult(data)
        setMutationBadge('Error')
        setMutationBadgeSuccess(false)
      } else {
        setMutationResult(data)
        setMutationBadge('Success')
        setMutationBadgeSuccess(true)
        setTimeout(() => {
          setMutationBadge('Ready')
          setMutationBadgeSuccess(false)
        }, 2000)
      }
    } catch (error) {
      setMutationResult({
        errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }]
      })
      setMutationBadge('Error')
      setMutationBadgeSuccess(false)
    }
  }, [mutationText])

  // Toggle subscription
  const toggleSubscription = useCallback(async () => {
    // If already subscribed, close the connection
    if (subscriptionRef.current) {
      subscriptionRef.current.close()
      subscriptionRef.current = null
      setIsSubscribed(false)
      return
    }

    // First run the query
    await runQuery()

    // Extract table from query
    const tableMatch = queryText.match(/\{\s*(\w+)/)
    if (!tableMatch) {
      alert('Could not determine table from query')
      return
    }

    const tableName = tableMatch[1]
    const subscriptionQuery = `subscription { ${tableName} { id name } }`

    try {
      const response = await fetch(`${BASE_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ query: subscriptionQuery })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      setIsSubscribed(true)

      let isClosed = false
      subscriptionRef.current = {
        close: () => {
          isClosed = true
          reader.cancel()
        }
      }

      let buffer = ''

      const processStream = async () => {
        try {
          while (!isClosed) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            let idx: number
            while ((idx = buffer.indexOf('\n\n')) !== -1) {
              const eventText = buffer.substring(0, idx)
              buffer = buffer.substring(idx + 2)

              if (!eventText.trim()) continue

              const lines = eventText.split('\n')
              let eventType = 'message'
              let eventData = ''

              for (const line of lines) {
                if (line.startsWith('event: ')) {
                  eventType = line.substring(7).trim()
                } else if (line.startsWith('data: ')) {
                  eventData += line.substring(6)
                }
              }

              if (eventData) {
                handleSubscriptionEvent(eventType, eventData)
              }
            }
          }
        } catch (error) {
          if (!isClosed) {
            console.error('Stream error:', error)
          }
        }
      }

      processStream()
    } catch (error) {
      console.error('Subscription error:', error)
    }
  }, [queryText, runQuery])

  // Handle subscription events — merge SSE data into existing result
  const handleSubscriptionEvent = useCallback((type: string, data: string) => {
    try {
      const record = JSON.parse(data)

      setQueryResult(prev => {
        if (!prev?.data) return prev

        // Find the table key (first key in data)
        const tableKey = Object.keys(prev.data)[0]
        if (!tableKey) return prev

        const existing = prev.data[tableKey]

        if (Array.isArray(existing)) {
          // Array result — find and update matching record by id
          const updated = existing.map((item: Record<string, unknown>) =>
            item && typeof item === 'object' && 'id' in item && item.id === record.id
              ? { ...item, ...record }
              : item
          )
          return { data: { ...prev.data, [tableKey]: updated } }
        } else if (existing && typeof existing === 'object') {
          // Single record — shallow merge preserves relationship fields
          return { data: { ...prev.data, [tableKey]: { ...(existing as Record<string, unknown>), ...record } } }
        }

        return prev
      })
    } catch (e) {
      console.error('Failed to parse SSE event data:', e)
    }

    setQueryBadge(`Live: ${type}`)
    setQueryBadgeSuccess(true)
    setTimeout(() => {
      setQueryBadge('Ready')
      setQueryBadgeSuccess(false)
    }, 2000)
  }, [])

  return (
    <>
        {/* Top Row: Query + Results */}
        <div className="row">
          <Panel title="Query" badge="Read">
            <CodeEditor value={queryText} onChange={setQueryText} />
          </Panel>

          <div className="action-column">
            <button
              className="btn btn-primary"
              onClick={runQuery}
              title="Run Query"
            >
              <PlayIcon />
            </button>
            <span className="btn-label">Run</span>
            <button
              className={`btn btn-subscribe ${isSubscribed ? 'active' : ''}`}
              onClick={toggleSubscription}
              title="Run & Subscribe"
            >
              <SubscribeIcon />
            </button>
            <span className="btn-label">{isSubscribed ? 'Stop' : 'Subscribe'}</span>
          </div>

          <ResultsPanel
            result={queryResult}
            badge={queryBadge}
            badgeSuccess={queryBadgeSuccess}
            emptyMessage="Run a query to see results"
          />
        </div>

        {/* Bottom Row: Mutation + Results */}
        <div className="row">
          <Panel title="Mutate" badge="Write">
            <CodeEditor value={mutationText} onChange={setMutationText} />
          </Panel>

          <div className="action-column">
            <button
              className="btn btn-primary"
              onClick={runMutation}
              title="Run Mutation"
            >
              <PlayIcon />
            </button>
            <span className="btn-label">Run</span>
          </div>

          <ResultsPanel
            result={mutationResult}
            badge={mutationBadge}
            badgeSuccess={mutationBadgeSuccess}
            emptyMessage="Run a mutation to see results"
          />
        </div>
    </>
  )
}
