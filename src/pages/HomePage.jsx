import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import DiaryCard from '../components/DiaryCard'
import DiaryForm from '../components/DiaryForm'
import Header from '../components/Header'
import PinSettings from '../components/PinSettings'
import TodoPage from './TodoPage'

export default function HomePage({ pinHook }) {
  const { user } = useAuth()
  const [currentTab, setCurrentTab] = useState('diary')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [showPinSettings, setShowPinSettings] = useState(false)
  const [search, setSearch] = useState('')
  const [filterMood, setFilterMood] = useState('')

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (!error) setEntries(data ?? [])
    setLoading(false)
  }, [user.id])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('diary_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const handleEdit = (entry) => {
    setEditEntry(entry)
    setShowForm(true)
  }

  const handleSave = () => {
    setShowForm(false)
    setEditEntry(null)
    fetchEntries()
  }

  const filtered = entries.filter(e => {
    const matchMood = !filterMood || e.mood === filterMood
    const matchSearch = !search ||
      e.content?.toLowerCase().includes(search.toLowerCase()) ||
      e.thanks?.some(t => t?.toLowerCase().includes(search.toLowerCase()))
    return matchMood && matchSearch
  })

  const MOODS = ['😊', '😄', '😐', '😢', '😡', '😴', '🥰', '😰', '🤩', '😌']

  return (
    <div className="app-layout">
      <Header
        onPinSettings={() => setShowPinSettings(true)}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {currentTab === 'todo' && <TodoPage />}

      <main className="main-content" style={{ display: currentTab === 'diary' ? undefined : 'none' }}>
        <div className="toolbar">
          <input
            type="text"
            placeholder="🔍 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          <select
            value={filterMood}
            onChange={e => setFilterMood(e.target.value)}
            className="mood-filter"
          >
            <option value="">전체 기분</option>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="new-btn" onClick={() => { setEditEntry(null); setShowForm(true) }}>
            + 새 일기
          </button>
        </div>

        {loading ? (
          <div className="loading">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <p>📖 아직 일기가 없습니다.</p>
            <p>오늘의 감사한 일을 기록해보세요!</p>
          </div>
        ) : (
          <div className="entries-grid">
            {filtered.map(e => (
              <DiaryCard
                key={e.id}
                entry={e}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <DiaryForm
          entry={editEntry}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditEntry(null) }}
        />
      )}

      {showPinSettings && (
        <PinSettings
          pinSet={pinHook.pinSet}
          setPin={pinHook.setPin}
          removePin={pinHook.removePin}
          onClose={() => setShowPinSettings(false)}
        />
      )}
    </div>
  )
}
