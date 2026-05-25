import { useState, useEffect, useRef } from 'react'

const CATEGORY_LABEL = { work: '업무', personal: '개인', study: '공부' }
const CATEGORIES = ['work', 'personal', 'study']

const CATEGORY_KEYWORDS = {
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

function detectCategory(text) {
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return cat
  }
  return null
}

function loadTodos() {
  try {
    const data = JSON.parse(localStorage.getItem('todo_app_data'))
    return Array.isArray(data?.todos) ? data.todos : []
  } catch { return [] }
}

export default function TodoPage() {
  const [todos, setTodos] = useState(loadTodos)
  const [input, setInput] = useState('')
  const [category, setCategory] = useState('work')
  const [filter, setFilter] = useState('all')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [shake, setShake] = useState(false)
  const [autoDetected, setAutoDetected] = useState(false)
  const [userOverrode, setUserOverrode] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    localStorage.setItem('todo_app_data', JSON.stringify({ todos }))
  }, [todos])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
    inputRef.current?.focus()
  }

  const addTodo = () => {
    if (!input.trim()) { triggerShake(); return }
    setTodos(prev => [...prev, {
      id: crypto.randomUUID(),
      text: input.trim(),
      category,
      completed: false,
      createdAt: Date.now(),
    }])
    setInput('')
    setAutoDetected(false)
    setUserOverrode(false)
    inputRef.current?.focus()
  }

  const toggleTodo = (id) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))

  const deleteTodo = (id) =>
    setTodos(prev => prev.filter(t => t.id !== id))

  const clearCompleted = () =>
    setTodos(prev => prev.filter(t => !t.completed))

  const startEdit = (todo) => {
    setEditId(todo.id)
    setEditText(todo.text)
  }

  const commitEdit = () => {
    if (editText.trim()) {
      setTodos(prev => prev.map(t => t.id === editId ? { ...t, text: editText.trim() } : t))
    }
    setEditId(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditText('')
  }

  const filtered = filter === 'all' ? todos : todos.filter(t => t.category === filter)
  const total = todos.length
  const completedCount = todos.filter(t => t.completed).length
  const percentage = total === 0 ? 0 : Math.round(completedCount / total * 100)
  const hasCompleted = todos.some(t => t.completed)

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })

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

        {/* 카테고리별 미니 진행률 */}
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
                const detected = detectCategory(val)
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
      </div>

      {/* 필터 탭 */}
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
      <ul className="todo-list">
        {filtered.length === 0 ? (
          <li className="todo-empty">할 일이 없습니다. 새 항목을 추가해보세요!</li>
        ) : (
          filtered.map(todo => (
            <li key={todo.id} className={`todo-item${todo.completed ? ' completed' : ''}`}>
              <input
                type="checkbox"
                className="todo-checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              {editId === todo.id ? (
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
                  onBlur={commitEdit}
                />
              ) : (
                <span className="todo-text">{todo.text}</span>
              )}
              <span className={`todo-badge todo-cat-${todo.category}`}>{CATEGORY_LABEL[todo.category]}</span>
              <button className="todo-btn-edit" onClick={() => startEdit(todo)}>수정</button>
              <button className="todo-btn-delete" onClick={() => deleteTodo(todo.id)}>🗑</button>
            </li>
          ))
        )}
      </ul>

      {/* 하단 */}
      <div className="todo-footer">
        <button className="todo-clear-btn" onClick={clearCompleted} disabled={!hasCompleted}>
          완료 항목 삭제
        </button>
        <span className="todo-total-count">
          {filter === 'all' ? '총' : CATEGORY_LABEL[filter]} {filtered.length}개
        </span>
      </div>
    </div>
  )
}
