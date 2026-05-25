import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const MOODS = ['😊', '😄', '😐', '😢', '😡', '😴', '🥰', '😰', '🤩', '😌']

export default function DiaryForm({ entry, onSave, onCancel }) {
  const { user } = useAuth()
  const isEdit = !!entry

  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().slice(0, 10))
  const [mood, setMood] = useState(entry?.mood ?? '😊')
  const [content, setContent] = useState(entry?.content ?? '')
  const [thanks, setThanks] = useState(
    entry?.thanks ?? ['', '', '']
  )
  const [imageUrl, setImageUrl] = useState(entry?.image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleThank = (i, val) => {
    setThanks(prev => prev.map((t, idx) => idx === i ? val : t))
  }

  const handleImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('diary-images')
      .upload(path, file, { upsert: true })
    if (upErr) {
      setError('이미지 업로드 실패: ' + upErr.message)
    } else {
      const { data } = supabase.storage.from('diary-images').getPublicUrl(path)
      setImageUrl(data.publicUrl)
    }
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      user_id: user.id,
      date,
      mood,
      content,
      thanks,
      image_url: imageUrl || null,
    }
    let err
    if (isEdit) {
      ;({ error: err } = await supabase
        .from('diary_entries')
        .update(payload)
        .eq('id', entry.id))
    } else {
      ;({ error: err } = await supabase
        .from('diary_entries')
        .insert(payload))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    onSave()
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>{isEdit ? '일기 수정' : '새 일기'}</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="diary-form">
          <div className="form-row">
            <label>날짜</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <label>기분</label>
            <div className="mood-grid">
              {MOODS.map(m => (
                <button
                  key={m}
                  type="button"
                  className={`mood-btn ${mood === m ? 'selected' : ''}`}
                  onClick={() => setMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label>일기</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="오늘 있었던 일을 기록하세요..."
              className="form-textarea"
              rows={5}
            />
          </div>

          <div className="form-row">
            <label>감사한 일 3가지</label>
            {[0, 1, 2].map(i => (
              <input
                key={i}
                type="text"
                value={thanks[i]}
                onChange={e => handleThank(i, e.target.value)}
                placeholder={`${i + 1}. 감사한 일을 입력하세요`}
                className="form-input thanks-input"
              />
            ))}
          </div>

          <div className="form-row">
            <label>사진</label>
            {imageUrl && (
              <div className="image-preview">
                <img src={imageUrl} alt="첨부 사진" />
                <button type="button" className="remove-img" onClick={() => setImageUrl('')}>✕</button>
              </div>
            )}
            <button
              type="button"
              className="upload-btn"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
            >
              {uploading ? '업로드 중...' : '📷 사진 첨부'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              style={{ display: 'none' }}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>취소</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
