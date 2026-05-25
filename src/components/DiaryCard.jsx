export default function DiaryCard({ entry, onEdit, onDelete }) {
  const fmtDate = (d) => {
    const date = new Date(d)
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
  }

  return (
    <div className="diary-card">
      <div className="card-header">
        <span className="card-mood">{entry.mood}</span>
        <span className="card-date">{fmtDate(entry.date)}</span>
        <div className="card-actions">
          <button className="action-btn edit" onClick={() => onEdit(entry)} title="수정">✏️</button>
          <button className="action-btn del" onClick={() => onDelete(entry.id)} title="삭제">🗑️</button>
        </div>
      </div>

      {entry.content && (
        <p className="card-content">{entry.content}</p>
      )}

      {entry.thanks?.some(t => t) && (
        <div className="card-thanks">
          <p className="thanks-label">🙏 감사한 일</p>
          <ul>
            {entry.thanks.filter(t => t).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {entry.image_url && (
        <div className="card-image">
          <img src={entry.image_url} alt="첨부 사진" loading="lazy" />
        </div>
      )}
    </div>
  )
}
