import { BookOpen, Bot, CircleHelp, Clock3, Edit3, ExternalLink, FileText, Laptop, LockKeyhole, Network, Play, Plus, Search, ShieldCheck, Terminal, Trash2, UsersRound, Video, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'http://localhost:5227/api'
const quickSearches = ['VPN', 'Password Reset', 'Outlook', 'MFA', 'Laptop', 'Phishing']
const categoryIcons = { lock: LockKeyhole, network: Network, terminal: Terminal, laptop: Laptop, shield: ShieldCheck, users: UsersRound }
const stopWords = new Set(['i', 'have', 'an', 'a', 'the', 'in', 'my', 'it', 'is', 'are', 'can', 'cant', 'cannot', 'to', 'for', 'with', 'of', 'on', 'and', 'or', 'this', 'that', 'issue', 'problem'])
const itKeywords = new Set(['email', 'outlook', 'password', 'login', 'access', 'vpn', 'wifi', 'internet', 'network', 'laptop', 'keyboard', 'screen', 'phishing', 'mfa', 'account', 'printer', 'software'])
const keywordSynonyms = {
  email: ['outlook', 'mail', 'inbox'], outlook: ['email', 'mail', 'inbox'],
  login: ['password', 'account', 'permission'], access: ['password', 'account', 'permission'], password: ['login', 'access', 'account', 'permission'], account: ['login', 'access', 'password', 'permission'],
  vpn: ['network', 'connection'], wifi: ['network'], internet: ['network'], phishing: ['security', 'suspicious email'],
  laptop: ['hardware'], screen: ['hardware'], keyboard: ['hardware'],
}

const getTags = (tags) => (Array.isArray(tags) ? tags : String(tags || '').split(',')).map((tag) => tag.trim()).filter(Boolean)
const preview = (value, length = 135) => { const text = String(value || '').trim(); return text.length > length ? `${text.slice(0, length).trim()}…` : text || 'No preview available.' }
const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const getYouTubeThumbnail = (url) => {
  try {
    const parsedUrl = new URL(url)
    const videoId = parsedUrl.hostname.includes('youtu.be')
      ? parsedUrl.pathname.split('/').filter(Boolean)[0]
      : parsedUrl.searchParams.get('v') || parsedUrl.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1]

    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
  } catch { return '' }
}
const getTroubleshootingSteps = (content) => String(content || '')
  .replace(/\s+/g, ' ')
  .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  ?.map((sentence) => sentence.trim())
  .filter(Boolean)
  .slice(0, 5) || []
const tokenize = (value) => String(value || '').toLowerCase().replace(/wi-fi/g, 'wifi').replace(/can't/g, 'cannot').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
const extractKnowledgeKeywords = (question) => [...new Set(tokenize(question).filter((word) => !stopWords.has(word) && itKeywords.has(word)))]
const expandKeywords = (keywords) => [...new Set(keywords.flatMap((keyword) => [keyword, ...(keywordSynonyms[keyword] || [])]))]
const hasKeyword = (text, keyword) => tokenize(text).includes(keyword) || String(text || '').toLowerCase().includes(keyword)
const rankKnowledgeArticles = (articles, categories, question) => {
  const keywords = expandKeywords(extractKnowledgeKeywords(question))
  if (!keywords.length) return []
  const categoriesById = new Map(categories.map((category) => [Number(category.id), category.name || '']))
  return articles.map((article) => {
    const category = categoriesById.get(Number(article.categoryId)) || ''
    const score = keywords.reduce((total, keyword) => total + (hasKeyword(article.title, keyword) ? 12 : 0) + (hasKeyword(category, keyword) ? 6 : 0) + (hasKeyword(article.content, keyword) ? 3 : 0), 0)
    return { article, score }
  }).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score || String(left.article.title).localeCompare(String(right.article.title))).map(({ article }) => article)
}

function KnowledgeBase() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role') || 'Employee'
  const isAdmin = role === 'Admin'
  const [categories, setCategories] = useState([])
  const [allArticles, setAllArticles] = useState([])
  const [popularArticles, setPopularArticles] = useState([])
  const [recentArticles, setRecentArticles] = useState([])
  const [videos, setVideos] = useState([])
  const [results, setResults] = useState([])
  const [resultLabel, setResultLabel] = useState('')
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [articleModal, setArticleModal] = useState(null)
  const [editor, setEditor] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiMessages, setAiMessages] = useState([])
  const [aiFeedback, setAiFeedback] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  const categoryById = useMemo(() => new Map(categories.map((item) => [Number(item.id), item])), [categories])
  const categoryName = (categoryId) => categoryById.get(Number(categoryId))?.name || 'General'

  async function request(path, options) {
    const response = await fetch(`${API_BASE_URL}/KnowledgeBase/${path}`, options)
    if (!response.ok) throw new Error(await response.text() || 'Request failed.')
    const contentType = response.headers.get('content-type') || ''
    return contentType.includes('application/json') ? response.json() : null
  }

  async function refreshData() {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const [categoryData, articleData, popularData, recentData, videoData] = await Promise.all([
        request('categories'), request('articles'), request('articles/popular'), request('articles/recent'), request('videos'),
      ])
      setCategories(Array.isArray(categoryData) ? categoryData : [])
      setAllArticles(Array.isArray(articleData) ? articleData : [])
      setPopularArticles(Array.isArray(popularData) ? popularData : [])
      setRecentArticles(Array.isArray(recentData) ? recentData : [])
      setVideos(Array.isArray(videoData) ? videoData : [])
    } catch (error) {
      console.log(error)
      setErrorMessage('Unable to load the Knowledge Base. Please try again.')
    } finally { setIsLoading(false) }
  }

  useEffect(() => {
    const loadTimer = window.setTimeout(() => { refreshData() }, 0)
    return () => window.clearTimeout(loadTimer)
    // Initial load only; refreshData intentionally reads the current endpoint configuration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!aiOpen) return undefined

    const updateTicketButtons = () => {
      document.querySelectorAll('.knowledge-base-ai-feedback button').forEach((button) => {
        if (button.textContent.includes('I still need help')) {
          button.textContent = 'Create Support Ticket'
        }
      })
    }
    const handleTicketButtonClick = (event) => {
      const button = event.target.closest('.knowledge-base-ai-feedback button')
      if (!button || button.textContent !== 'Create Support Ticket') return

      const question = button.closest('.knowledge-base-ai-message-group')?.querySelector('.knowledge-base-ai-user-message')?.textContent?.trim()
      if (!question) return

      event.preventDefault()
      event.stopPropagation()
      setAiOpen(false)
      navigate('/create-ticket', { state: { aiProblemText: question } })
    }

    updateTicketButtons()
    const observer = new MutationObserver(updateTicketButtons)
    observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('click', handleTicketButtonClick, true)
    return () => {
      observer.disconnect()
      document.removeEventListener('click', handleTicketButtonClick, true)
    }
  }, [aiOpen, navigate])

  async function runSearch(value) {
    const keyword = String(value || '').trim()
    setSearchText(keyword)
    setErrorMessage('')
    setIsSearching(true)
    try {
      if (!keyword) {
        setResults(allArticles)
        setResultLabel('All articles')
      } else {
        const data = await request(`articles/search?keyword=${encodeURIComponent(keyword)}`)
        setResults(Array.isArray(data) ? data : [])
        setResultLabel(`Search results for “${keyword}”`)
      }
    } catch (error) { console.log(error); setErrorMessage('Unable to search articles. Please try again.'); setResults([]) } finally { setIsSearching(false) }
  }

  function handleSearch(event) { event.preventDefault(); runSearch(searchText) }
  async function filterCategory(category) {
    setErrorMessage(''); setIsSearching(true); setResultLabel(category.name)
    try { const data = await request(`articles/category/${category.id}`); setResults(Array.isArray(data) ? data : []) }
    catch (error) { console.log(error); setErrorMessage('Unable to load category articles.'); setResults([]) }
    finally { setIsSearching(false) }
  }
  function clearResults() { setSearchText(''); setResults([]); setResultLabel('') }

  async function openArticle(id) {
    try { const article = await request(`articles/${id}`); setArticleModal(article); await refreshData() }
    catch (error) { console.log(error); setErrorMessage('Unable to load article details.') }
  }

  async function runAiSearch(event) {
    event.preventDefault()
    const question = aiQuestion.trim()
    if (!question) return
    const messageId = `${Date.now()}-${question}`
    window.sessionStorage.setItem('knowledgeBaseTicketProblem', question)
    setAiMessages((messages) => [...messages, { id: messageId, question, isLoading: true, articles: null }])
    setAiQuestion('')
    try {
      const articles = rankKnowledgeArticles(allArticles, categories, question)
      setAiMessages((messages) => messages.map((message) => message.id === messageId ? { ...message, isLoading: false, articles } : message))
    } catch (error) {
      console.log(error)
      setAiMessages((messages) => messages.map((message) => message.id === messageId ? { ...message, isLoading: false, articles: [] } : message))
    }
  }

  function openEditor(type, item = null) { setEditor({ type, item }) }
  async function submitEditor(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const type = editor.type
    const item = editor.item
    const payload = type === 'article'
      ? { title: form.get('title'), content: form.get('content'), categoryId: Number(form.get('categoryId')), tags: form.get('tags'), isPublished: form.get('isPublished') === 'on', createdByUserId: Number(localStorage.getItem('userId') || 1) }
      : type === 'category'
        ? { name: form.get('name'), description: form.get('description'), icon: form.get('icon') }
        : { title: form.get('title'), description: form.get('description'), youTubeUrl: form.get('youTubeUrl'), categoryId: Number(form.get('categoryId')), duration: form.get('duration') }
    setIsSaving(true); setErrorMessage('')
    try {
      await request(`${type === 'category' ? 'categories' : type === 'video' ? 'videos' : 'articles'}${item ? `/${item.id}` : ''}`, { method: item ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      setEditor(null); await refreshData()
    } catch (error) { console.log(error); setErrorMessage(`Unable to ${item ? 'update' : 'create'} ${type}.`) } finally { setIsSaving(false) }
  }

  async function deleteItem(type, id) {
    if (!window.confirm(`Delete this ${type}? This cannot be undone.`)) return
    try { await request(`${type === 'category' ? 'categories' : type === 'video' ? 'videos' : 'articles'}/${id}`, { method: 'DELETE' }); if (articleModal?.id === id) setArticleModal(null); await refreshData() }
    catch (error) { console.log(error); setErrorMessage(`Unable to delete ${type}.`) }
  }
  async function togglePublish(article) {
    try { await request(`articles/${article.id}/${article.isPublished ? 'unpublish' : 'publish'}`, { method: 'PUT' }); setArticleModal(null); await refreshData() }
    catch (error) { console.log(error); setErrorMessage('Unable to update article publication status.') }
  }

  const ArticleCard = ({ article, compact = false }) => <button className={`knowledge-base-article-card${compact ? ' compact' : ''}`} type="button" onClick={() => openArticle(article.id)}>
    <div className="knowledge-base-article-meta"><span>{categoryName(article.categoryId)}</span><span>{Number(article.views || 0).toLocaleString()} views</span></div>
    <h4>{article.title}</h4><p>{preview(article.content, compact ? 95 : 145)}</p>
    {!compact && getTags(article.tags).length > 0 && <div className="knowledge-base-tags">{getTags(article.tags).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>}
  </button>

  return <DashboardLayout><div className="knowledge-base-page">
    <section className="knowledge-base-hero">
      <div className="knowledge-base-eyebrow"><BookOpen size={15} /> SupportOps Knowledge Base</div>
      <h2>How can we help you today?</h2>
      <p>Access our comprehensive repository of guides, FAQs, and troubleshooting protocols designed for enterprise efficiency.</p>
      <form className="knowledge-base-search" onSubmit={handleSearch}><Search size={20} /><input aria-label="Search knowledge base" placeholder="Search guides, troubleshooting steps, and topics..." value={searchText} onChange={(event) => setSearchText(event.target.value)} /><button type="submit">Search</button></form>
      <div className="knowledge-base-quick-searches"><span>Popular:</span>{quickSearches.map((term) => <button type="button" key={term} onClick={() => runSearch(term)}>{term}</button>)}</div>
    </section>

    <section className="knowledge-base-ai-card"><div className="knowledge-base-ai-icon"><Bot size={20} /></div><div><h3>AI Assistant <span>Beta</span></h3><p>Ask a question and get answers from the Knowledge Base.</p></div><button type="button" onClick={() => setAiOpen(true)}>Ask AI</button></section>
    {isAdmin && <div className="knowledge-base-admin-actions"><span>Knowledge Base management</span><button type="button" onClick={() => openEditor('article')}><Plus size={15} /> Add Article</button><button type="button" onClick={() => openEditor('category')}><Plus size={15} /> Add Category</button><button type="button" onClick={() => openEditor('video')}><Plus size={15} /> Add Video</button></div>}
    {errorMessage && <div className="knowledge-base-message error">{errorMessage}</div>}

    {resultLabel && <section className="knowledge-base-results-section"><div className="knowledge-base-section-heading"><div><h3>{resultLabel}</h3><p>{isSearching ? 'Searching…' : `${results.length} ${results.length === 1 ? 'article' : 'articles'} found`}</p></div><button className="knowledge-base-text-button" type="button" onClick={clearResults}>Clear results</button></div>{isSearching ? <div className="knowledge-base-state compact">Loading articles…</div> : results.length ? <div className="knowledge-base-article-grid">{results.map((article) => <ArticleCard key={article.id} article={article} />)}</div> : <div className="knowledge-base-empty">No articles found. Try another keyword or create a support ticket.</div>}</section>}

    {isLoading ? <div className="knowledge-base-state">Loading Knowledge Base…</div> : <>
      <section className="knowledge-base-section"><div className="knowledge-base-section-heading"><div><h3>Knowledge Categories</h3><p>Explore articles organized by the help you need.</p></div></div><div className="knowledge-base-categories">{categories.map((category) => { const Icon = categoryIcons[String(category.icon || '').toLowerCase()] || CircleHelp; const count = allArticles.filter((article) => Number(article.categoryId) === Number(category.id)).length; return <div className="knowledge-base-category-card" key={category.id} role="button" tabIndex="0" onClick={() => filterCategory(category)} onKeyDown={(event) => event.key === 'Enter' && filterCategory(category)}><span className="knowledge-base-category-icon"><Icon size={21} /></span><strong>{category.name}</strong><span>{category.description || 'Helpful support articles and guides.'}</span><em>{count} {count === 1 ? 'article' : 'articles'}</em>{isAdmin && <div className="knowledge-base-item-actions" onClick={(event) => event.stopPropagation()}><button type="button" aria-label={`Edit ${category.name}`} onClick={() => openEditor('category', category)}><Edit3 size={14} /></button><button type="button" aria-label={`Delete ${category.name}`} onClick={() => deleteItem('category', category.id)}><Trash2 size={14} /></button></div>}</div> })}</div></section>
      <section className="knowledge-base-feature-grid"><article className="knowledge-base-panel knowledge-base-popular-panel"><div className="knowledge-base-section-heading"><div><h3>Popular Articles</h3><p>Most viewed by your team.</p></div></div><div className="knowledge-base-popular-list">{popularArticles.length ? popularArticles.slice(0, 4).map((article) => <div className="knowledge-base-admin-wrap" key={article.id}><ArticleCard article={article} compact />{isAdmin && <div className="knowledge-base-card-actions"><button type="button" aria-label={`Edit ${article.title}`} onClick={() => openEditor('article', article)}><Edit3 size={13} /></button><button type="button" aria-label={`Delete ${article.title}`} onClick={() => deleteItem('article', article.id)}><Trash2 size={13} /></button></div>}</div>) : <div className="knowledge-base-empty">No popular articles yet.</div>}</div>{popularArticles.length > 0 && <button className="knowledge-base-view-all" type="button" onClick={() => { setResults(popularArticles); setResultLabel('All popular articles') }}>View All Popular Articles</button>}</article><div className="knowledge-base-side-stack"><article className="knowledge-base-panel knowledge-base-recent-panel"><div className="knowledge-base-section-heading"><div><h3>Recently Added</h3><p>Fresh guidance from SupportOps.</p></div></div><div className="knowledge-base-list">{recentArticles.length ? recentArticles.map((article) => <button className="knowledge-base-list-item" type="button" key={article.id} onClick={() => openArticle(article.id)}><span className="knowledge-base-list-icon"><Clock3 size={16} /></span><div><strong>{article.title}</strong><span>{formatDate(article.createdAt)} · {categoryName(article.categoryId)}</span></div></button>) : <div className="knowledge-base-list-empty">No recent articles yet.</div>}</div></article><article className="knowledge-base-help-card"><h3>Need more help?</h3><p>Can&apos;t find what you&apos;re looking for? Open a support ticket with our support desk.</p><Link to="/create-ticket">Create Support Ticket</Link></article></div></section>
      <section className="knowledge-base-video-section"><div className="knowledge-base-section-heading"><div><h3>Video Guides</h3><p>Quick walkthroughs for common IT tasks.</p></div><Video size={19} /></div><div className="knowledge-base-video-grid">{videos.length ? videos.map((video) => { const thumbnailUrl = getYouTubeThumbnail(video.youTubeUrl); const cardBackground = thumbnailUrl ? `linear-gradient(180deg, rgba(10,18,34,.12), rgba(10,18,34,.15) 42%, rgba(10,18,34,.9)), url(${thumbnailUrl})` : 'linear-gradient(135deg, #172b4d, #0f172a 58%, #1d4ed8)'; return <div className="knowledge-base-video-card" key={video.id} style={{ backgroundImage: cardBackground, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}><a href={video.youTubeUrl} target="_blank" rel="noreferrer" aria-label={`Watch ${video.title}`}><span className="knowledge-base-video-play"><Play size={20} fill="currentColor" /></span><span className="knowledge-base-video-category">{categoryName(video.categoryId)}</span><h4 title={video.title}>{video.title}</h4><span className="knowledge-base-video-duration">{video.duration || 'Video'} <ExternalLink size={11} /></span></a>{isAdmin && <div className="knowledge-base-card-actions"><button type="button" aria-label={`Edit ${video.title}`} onClick={() => openEditor('video', video)}><Edit3 size={13} /></button><button type="button" aria-label={`Delete ${video.title}`} onClick={() => deleteItem('video', video.id)}><Trash2 size={13} /></button></div>}</div> }) : <div className="knowledge-base-empty">No video guides available yet.</div>}</div></section>
    </>}
    {articleModal && <ArticleModal article={articleModal} categoryName={categoryName} isAdmin={isAdmin} onClose={() => setArticleModal(null)} onEdit={() => openEditor('article', articleModal)} onDelete={() => deleteItem('article', articleModal.id)} onTogglePublish={() => togglePublish(articleModal)} />}
    {aiOpen && <AiModal question={aiQuestion} setQuestion={setAiQuestion} messages={aiMessages} feedback={aiFeedback} onFeedback={(messageId, value) => setAiFeedback((current) => ({ ...current, [messageId]: value }))} onSubmit={runAiSearch} onClose={() => { setAiOpen(false); setAiMessages([]); setAiQuestion(''); setAiFeedback({}) }} onOpenArticle={openArticle} onCreateTicket={(question) => { setAiOpen(false); navigate('/create-ticket', { state: { aiProblemText: question } }) }} categoryName={categoryName} />}
    {editor && <EditorModal editor={editor} categories={categories} saving={isSaving} onClose={() => setEditor(null)} onSubmit={submitEditor} />}
  </div></DashboardLayout>
}

function ArticleModal({ article, categoryName, isAdmin, onClose, onEdit, onDelete, onTogglePublish }) { return <div className="knowledge-base-modal-backdrop" role="presentation" onMouseDown={onClose}><article className="knowledge-base-modal article" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="knowledge-base-modal-close" type="button" onClick={onClose}><X size={19} /></button><span className="knowledge-base-article-badge">{categoryName(article.categoryId)}</span><h2>{article.title}</h2><div className="knowledge-base-detail-meta"><span>{Number(article.views || 0).toLocaleString()} views</span><span>Created {formatDate(article.createdAt)}</span>{article.updatedAt && <span>Updated {formatDate(article.updatedAt)}</span>}</div><div className="knowledge-base-detail-content">{article.content}</div>{getTags(article.tags).length > 0 && <div className="knowledge-base-tags">{getTags(article.tags).map((tag) => <span key={tag}>{tag}</span>)}</div>}<div className="knowledge-base-modal-footer"><Link to="/create-ticket">Create Ticket</Link>{isAdmin && <div><button type="button" onClick={onEdit}>Edit</button><button type="button" onClick={onTogglePublish}>{article.isPublished ? 'Unpublish' : 'Publish'}</button><button type="button" className="danger" onClick={onDelete}>Delete</button></div>}</div></article></div> }
function AiModal({ question, setQuestion, messages, feedback, onFeedback, onSubmit, onClose, onOpenArticle, categoryName }) { return <div className="knowledge-base-modal-backdrop" role="presentation" onMouseDown={onClose}><article className="knowledge-base-modal ai" role="dialog" aria-modal="true" aria-label="AI Knowledge Assistant" onMouseDown={(event) => event.stopPropagation()}><header className="knowledge-base-ai-modal-header"><div><h2><Bot size={20} /> AI Knowledge Assistant <span>Beta</span></h2><p>Searches the SupportOps Knowledge Base for relevant guides.</p></div><button className="knowledge-base-modal-close" type="button" onClick={onClose}><X size={19} /></button></header><div className="knowledge-base-ai-chat">{messages.length === 0 ? <div className="knowledge-base-ai-empty"><Bot size={23} /><strong>How can I help?</strong><span>Ask a question and I&apos;ll look through the Knowledge Base for matching articles.</span></div> : messages.map((message) => { const sourceArticle = message.articles?.[0]; const relatedArticles = message.articles?.slice(1) || []; const steps = getTroubleshootingSteps(sourceArticle?.content); const responseFeedback = feedback[message.id]; return <div className="knowledge-base-ai-message-group" key={message.id}><div className="knowledge-base-ai-user-message">{message.question}</div><div className="knowledge-base-ai-response">{message.isLoading ? <span className="knowledge-base-ai-searching">Searching the Knowledge Base…</span> : sourceArticle ? <><strong>Based on the Knowledge Base, here are suggested steps:</strong>{steps.length > 0 ? <ol className="knowledge-base-ai-steps">{steps.map((step, index) => <li key={`${sourceArticle.id}-${index}`}>{step}</li>)}</ol> : <p>{preview(sourceArticle.content, 220)}</p>}<article className="knowledge-base-ai-source-card"><div className="knowledge-base-ai-source-heading"><span className="knowledge-base-ai-source-icon"><FileText size={16} /></span><strong>Source Article</strong></div><div className="knowledge-base-ai-source-meta"><span>{categoryName(sourceArticle.categoryId)}</span><small>{Number(sourceArticle.views || 0).toLocaleString()} views</small></div><h3>{sourceArticle.title}</h3><button type="button" onClick={() => { onClose(); onOpenArticle(sourceArticle.id) }}>Open Article</button></article>{relatedArticles.length > 0 && <><span className="knowledge-base-ai-section-label">Related Articles</span><div className="knowledge-base-ai-related-list">{relatedArticles.map((article) => <article key={article.id}><div><h3>{article.title}</h3><p>{preview(article.content, 90)}</p></div><button type="button" onClick={() => { onClose(); onOpenArticle(article.id) }}>Open</button></article>)}</div></>}<div className="knowledge-base-ai-feedback">{responseFeedback === 'helped' ? <span className="success">Glad this helped.</span> : responseFeedback === 'ticket' ? <div><span>Would you like to create a support ticket?</span><Link to="/create-ticket" onClick={onClose}>Create Ticket</Link></div> : <><span>Did this solve your problem?</span><div><button type="button" onClick={() => onFeedback(message.id, 'helped')}>👍 This solved my problem</button><button type="button" onClick={() => onFeedback(message.id, 'ticket')}>👎 I still need help</button></div></>}</div></> : <><p>I could not find this in the Knowledge Base. Please create a support ticket.</p><Link to="/create-ticket" onClick={onClose}>Create Support Ticket</Link></>}</div></div> })}</div><form className="knowledge-base-ai-composer" onSubmit={onSubmit}><input autoFocus value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question about an IT issue..." /><button type="submit" disabled={!question.trim()}><Search size={15} /> Send</button></form><small>OpenAI integration can be enabled once an API key is provided.</small></article></div> }
function EditorModal({ editor, categories, saving, onClose, onSubmit }) { const { type, item } = editor; const title = `${item ? 'Edit' : 'Add'} ${type}`; return <div className="knowledge-base-modal-backdrop" role="presentation" onMouseDown={onClose}><form className="knowledge-base-modal editor" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}><button className="knowledge-base-modal-close" type="button" onClick={onClose}><X size={19} /></button><h2>{title}</h2>{type === 'article' && <><label>Title<input name="title" defaultValue={item?.title || ''} required /></label><label>Content<textarea name="content" defaultValue={item?.content || ''} required /></label><label>Category<CategorySelect categories={categories} value={item?.categoryId} /></label><label>Tags<input name="tags" defaultValue={item?.tags || ''} placeholder="vpn, network, remote access" /></label><label className="knowledge-base-checkbox"><input name="isPublished" type="checkbox" defaultChecked={item ? item.isPublished : true} /> Published</label></>}{type === 'category' && <><label>Name<input name="name" defaultValue={item?.name || ''} required /></label><label>Description<textarea name="description" defaultValue={item?.description || ''} required /></label><label>Icon<input name="icon" defaultValue={item?.icon || ''} placeholder="lock, network, terminal, laptop, shield, users" /></label></>}{type === 'video' && <><label>Title<input name="title" defaultValue={item?.title || ''} required /></label><label>Description<textarea name="description" defaultValue={item?.description || ''} required /></label><label>YouTube URL<input type="url" name="youTubeUrl" defaultValue={item?.youTubeUrl || ''} required /></label><label>Category<CategorySelect categories={categories} value={item?.categoryId} /></label><label>Duration<input name="duration" defaultValue={item?.duration || ''} placeholder="5:00" /></label></>}<button className="knowledge-base-form-submit" disabled={saving} type="submit">{saving ? 'Saving…' : item ? 'Save changes' : `Add ${type}`}</button></form></div> }
function CategorySelect({ categories, value }) { return <select name="categoryId" defaultValue={value || ''} required><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select> }
export default KnowledgeBase
