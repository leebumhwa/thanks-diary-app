import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const CATEGORY_LABEL = { work: '업무', personal: '개인', study: '공부' }
const CATEGORY_ICON  = { work: '💼', personal: '🙋', study: '📚' }
const CATEGORIES = ['work', 'personal', 'study']

const DEFAULT_KEYWORDS = {
  work: [
    '회의', '보고서', '기획', '발표', '미팅', '업무', '출장', '계약', '프로젝트',
    '거래처', '이메일', '제안서', '검토', '결재', '예산', '마감', '클라이언트',
    '고객', '팀장', '부장', '사장', '부서', '영업', '납기', '견적', '협의', '회사',
  ],
  personal: [
    '운동', '병원', '쇼핑', '약속', '청소', '빨래', '요리', '친구', '가족',
    '여행', '영화', '산책', '저녁', '점심', '아침', '약', '헬스', '미용실',
    '장보기', '집안일', '데이트', '모임', '생일', '결혼식', '청첩장',
  ],
  study: [
    '공부', '강의', '독서', '책', '시험', '과제', '학원', '수업', '인강',
    '복습', '예습', '자격증', '토익', '영어', '프로그래밍', '코딩', '강좌',
    '논문', '학습', '스터디', '튜토리얼', '문제풀이', '강습',
  ],
}

function detectCategory(text, custom = {}) {
  for (const cat of CATEGORIES) {
    const all = [...DEFAULT_KEYWORDS[cat], ...(custom[cat] || [])]
    if (all.some(kw => text.includes(kw))) return cat
  }
  return null
}

function loadCustomKeywords() {
  try {
    const data = JSON.parse(localStorage.getItem('todo_keywords'))
    if (data && CATEGORIES.every(c => Array.isArray(data[c]))) return data
  } catch {}
  return { work: [], personal: [], study: [] }
}

function dbToTodo(r) {
  return {
    id: r.id,
    text: r.text,
    category: r.category,
    completed: r.completed,
    dueDate: r.due_date || null,
    createdAt: new Date(r.created_at).getTime(),
  }
}

function formatDueDate(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24))
  const label = due.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  if (diff < 0) return { label, tag: `${Math.abs(diff)}일 지남`, urgent: true }
  if (diff === 0) return { label, tag: '오늘 마감', urgent: true }
  if (diff === 1) return { label, tag: '내일 마감', urgent: true }
  if (diff <= 3) return { label, tag: `D-${diff}`, urgent: true }
  return { label, tag: `D-${diff}`, urgent: false }
}

function sortActiveTodos(todos) {
  return [...todos].sort((a, b) => {
    const aHas = !!a.dueDate
    const bHas = !!b.dueDate
    if (!aHas && !bHas) return a.createdAt - b.createdAt
    if (!aHas) return -1
    if (!bHas) return 1
    return new Date(a.dueDate) - new Date(b.dueDate)
  })
}

export default function TodoPage() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('work')
  const [filter, setFilter] = useState('all')
  const [todoView, setTodoView] = useState('active')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [shake, setShake] = useState(false)
  const [autoDetected, setAutoDetected] = useState(false)
  const [userOverrode, setUserOverrode] = useState(false)
  const [customKeywords, setCustomKeywords] = useState(loadCustomKeywords)
  const [showKeywords, setShowKeywords] = useState(false)
  const [kwInput, setKwInput] = useState({ work: '', personal: '', study: '' })
  const inputRef = useRef()

  useEffect(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setTodos(data.map(dbToTodo))
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    localStorage.setItem('todo_keywords', JSON.stringify(customKeywords))
  }, [customKeywords])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
    inputRef.current?.focus()
  }

  const addTodo = async () => {
    if (!input.trim()) { triggerShake(); return }
    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: user.id,
        text: input.trim(),
        category,
        completed: false,
        due_date: dueDate || null,
      })
      .select()
      .single()
    if (error) { alert('추가 실패: ' + error.message); return }
    setTodos(prev => [...prev, dbToTodo(data)])
    setInput('')
    setDueDate('')
    setAutoDetected(false)
    setUserOverrode(false)
    inputRef.current?.focus()
  }

  const toggleTodo = async (id) => {
    const t = todos.find(t => t.id === id)
    if (!t) return
    const { error } = await supabase.from('todos').update({ completed: !t.completed }).eq('id', id)
    if (!error) setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (!error) setTodos(prev => prev.filter(t => t.id !== id))
  }

  const clearCompleted = async () => {
    const ids = todos.filter(t => t.completed).map(t => t.id)
    if (!ids.length) return
    const { error } = await supabase.from('todos').delete().in('id', ids)
    if (!error) setTodos(prev => prev.filter(t => !t.completed))
  }

  const startEdit = (todo) => {
    setEditId(todo.id)
    setEditText(todo.text)
    setEditDueDate(todo.dueDate || '')
  }

  const commitEdit = async () => {
    if (editText.trim() && editId) {
      const { error } = await supabase
        .from('todos')
        .update({ text: editText.trim(), due_date: editDueDate || null })
        .eq('id', editId)
      if (!error) {
        setTodos(prev => prev.map(t =>
          t.id === editId
            ? { ...t, text: editText.trim(), dueDate: editDueDate || null }
            : t
        ))
      }
    }
    setEditId(null)
    setEditText('')
    setEditDueDate('')
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditText('')
    setEditDueDate('')
  }

  const addKeyword = (cat) => {
    const kw = kwInput[cat].trim()
    if (!kw) return
    const exists = DEFAULT_KEYWORDS[cat].includes(kw) || customKeywords[cat].includes(kw)
    if (exists) return
    setCustomKeywords(prev => ({ ...prev, [cat]: [...prev[cat], kw] }))
    setKwInput(prev => ({ ...prev, [cat]: '' }))
  }

  const removeKeyword = (cat, kw) => {
    setCustomKeywords(prev => ({ ...prev, [cat]: prev[cat].filter(k => k !== kw) }))
  }

  const activeTodos = todos.filter(t => !t.completed)
  const completedTodos = todos.filter(t => t.completed)

  const filteredActive = filter === 'all'
    ? sortActiveTodos(activeTodos)
    : sortActiveTodos(activeTodos.filter(t => t.category === filter))

  const filteredCompleted = filter === 'all'
    ? completedTodos
    : completedTodos.filter(t => t.category === filter)

  const total = todos.length
  const completedCount = completedTodos.length
  const percentage = total === 0 ? 0 : Math.round(completedCount / total * 100)

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#718096' }}>불러오는 중...</div>

  const renderTodoItem = (todo) => {
    const due = formatDueDate(todo.dueDate)
    return (
      <li key={todo.id} className={`todo-item${todo.completed ? ' completed' : ''}`}>
        <input
          type="checkbox"
          className="todo-checkbox"
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id)}
        />
        <div className="todo-item-body">
          {editId === todo.id ? (
            <div className="todo-edit-wrap">
              <input
                type="text"
                className="todo-edit-input"
                value={editText}
                autoFocus
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') cancelEdit()
                }}
              />
              <div className="todo-edit-due-row">
                <label className="todo-edit-due-label">마감일</label>
                <input
                  type="date"
                  className="todo-edit-due-input"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                />
                {editDueDate && (
                  <button className="todo-edit-due-clear" onClick={() => setEditDueDate('')}>×</button>
                )}
              </div>
              <div className="todo-edit-actions">
                <button className="todo-btn-save" onClick={commitEdit}>저장</button>
                <button className="todo-btn-cancel" onClick={cancelEdit}>취소</button>
              </div>
            </div>
          ) : (
            <>
              <span className="todo-text">{todo.text}</span>
              {due && (
                <span className={`todo-due-badge${due.urgent ? ' urgent' : ''}`}>
                  📅 {due.label} · {due.tag}
                </span>
              )}
            </>
          )}
        </div>
        {editId !== todo.id && (
          <div className="todo-item-actions">
            <span className={`todo-badge todo-cat-${todo.category}`}>{CATEGORY_LABEL[todo.category]}</span>
            <button className="todo-btn-edit" onClick={() => startEdit(todo)}>수정</button>
            <button className="todo-btn-delete" onClick={() => deleteTodo(todo.id)}>🗑</button>
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="todo-page">
      <p className="todo-date">{today}</p>

      {/* 전체 진행률 */}
      <div className="todo-card">
        <div className="todo-progress-label">
          <span>{completedCount} / {total} 완료 ({percentage}%)</span>
        </div>
        <div className="todo-progress-track">
          <div
            className={`todo-progress-fill${percentage === 100 ? ' done' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="todo-cat-panel">
          {CATEGORIES.map(cat => {
            const catTodos = todos.filter(t => t.category === cat)
            const catDone = catTodos.filter(t => t.completed).length
            const catPct = catTodos.length === 0 ? 0 : Math.round(catDone / catTodos.length * 100)
            return (
              <div key={cat} className="todo-cat-item">
                <div className="todo-cat-header">
                  <span className={`todo-cat-badge todo-cat-${cat}`}>{CATEGORY_LABEL[cat]}</span>
                  <span className="todo-cat-count">
                    {catTodos.length === 0 ? '항목 없음' : `${catDone}/${catTodos.length}`}
                  </span>
                </div>
                <div className="todo-cat-track">
                  <div className={`todo-cat-fill todo-cat-fill-${cat}`} style={{ width: `${catPct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="todo-card">
        <div className="todo-input-area">
          <input
            ref={inputRef}
            type="text"
            className={`todo-text-input${shake ? ' todo-shake' : ''}`}
            placeholder="새로운 할 일을 입력하세요"
            value={input}
            onChange={e => {
              const val = e.target.value
              setInput(val)
              if (!userOverrode) {
                const detected = detectCategory(val, customKeywords)
                if (detected) { setCategory(detected); setAutoDetected(true) }
                else setAutoDetected(false)
              }
            }}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
          />
          <div className="todo-select-wrap">
            <select
              className="todo-select"
              value={category}
              onChange={e => { setCategory(e.target.value); setUserOverrode(true); setAutoDetected(false) }}
            >
              <option value="work">💼 업무</option>
              <option value="personal">🙋 개인</option>
              <option value="study">📚 공부</option>
            </select>
            {autoDetected && <span className="todo-auto-badge">✨ 자동</span>}
          </div>
          <button className="todo-add-btn" onClick={addTodo}>+ 추가</button>
        </div>
        <div className="todo-due-row">
          <label className="todo-due-label">마감일 (선택)</label>
          <input
            type="date"
            className="todo-due-input"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
          {dueDate && (
            <button className="todo-due-clear" onClick={() => setDueDate('')}>×</button>
          )}
        </div>
        <button className="todo-kw-link" onClick={() => setShowKeywords(true)}>
          ⚙️ 자동 분류 키워드 설정
        </button>
      </div>

      {/* 뷰 탭 (할 일 / 완료) */}
      <div className="todo-view-tabs">
        <button
          className={`todo-view-btn${todoView === 'active' ? ' active' : ''}`}
          onClick={() => setTodoView('active')}
        >
          할 일 <span className="todo-view-count">{activeTodos.length}</span>
        </button>
        <button
          className={`todo-view-btn${todoView === 'completed' ? ' active' : ''}`}
          onClick={() => setTodoView('completed')}
        >
          완료 <span className="todo-view-count">{completedCount}</span>
        </button>
      </div>

      {/* 카테고리 필터 탭 */}
      <div className="todo-filter-tabs">
        {[['all','전체'],['work','💼 업무'],['personal','🙋 개인'],['study','📚 공부']].map(([val, label]) => (
          <button
            key={val}
            className={`todo-filter-btn todo-filter-${val}${filter === val ? ' active' : ''}`}
            onClick={() => setFilter(val)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 할 일 목록 */}
      {todoView === 'active' && (
        <>
          <ul className="todo-list">
            {filteredActive.length === 0 ? (
              <li className="todo-empty">할 일이 없습니다. 새 항목을 추가해보세요!</li>
            ) : (
              filteredActive.map(renderTodoItem)
            )}
          </ul>
          <div className="todo-footer">
            <span className="todo-total-count">
              {filter === 'all' ? '총' : CATEGORY_LABEL[filter]} {filteredActive.length}개
            </span>
          </div>
        </>
      )}

      {/* 완료 목록 */}
      {todoView === 'completed' && (
        <>
          <ul className="todo-list">
            {filteredCompleted.length === 0 ? (
              <li className="todo-empty">완료된 항목이 없습니다.</li>
            ) : (
              filteredCompleted.map(renderTodoItem)
            )}
          </ul>
          <div className="todo-footer">
            <button
              className="todo-clear-btn"
              onClick={clearCompleted}
              disabled={completedCount === 0}
            >
              완료 항목 전체 삭제
            </button>
            <span className="todo-total-count">
              {filter === 'all' ? '총' : CATEGORY_LABEL[filter]} {filteredCompleted.length}개
            </span>
          </div>
        </>
      )}

      {/* 키워드 설정 모달 */}
      {showKeywords && (
        <div className="modal-overlay" onClick={() => setShowKeywords(false)}>
          <div className="modal-card kw-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ 자동 분류 키워드 설정</h2>
              <button className="close-btn" onClick={() => setShowKeywords(false)}>✕</button>
            </div>
            <div className="kw-modal-body">
              {CATEGORIES.map(cat => (
                <div key={cat} className="kw-section">
                  <div className="kw-section-header">
                    <span className={`todo-cat-badge todo-cat-${cat}`}>
                      {CATEGORY_ICON[cat]} {CATEGORY_LABEL[cat]}
                    </span>
                    <span className="kw-default-count">기본 {DEFAULT_KEYWORDS[cat].length}개 포함</span>
                  </div>

                  {customKeywords[cat].length > 0 && (
                    <div className="kw-chips">
                      {customKeywords[cat].map(kw => (
                        <span key={kw} className="kw-chip">
                          {kw}
                          <button className="kw-chip-del" onClick={() => removeKeyword(cat, kw)}>×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="kw-add-row">
                    <input
                      type="text"
                      className="kw-add-input"
                      placeholder="새 키워드 입력"
                      value={kwInput[cat]}
                      onChange={e => setKwInput(prev => ({ ...prev, [cat]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addKeyword(cat)}
                    />
                    <button className={`kw-add-btn kw-add-${cat}`} onClick={() => addKeyword(cat)}>+ 추가</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
