import './FolderCard.scss'

function FolderCard({ folder, onClick, isMobile }) {
  return (
    <div className={`folder-card ${isMobile ? 'mobile' : ''}`} onClick={() => onClick(folder)}>
      <div className="folder-icon">📁</div>
      <div className="folder-info">
        <span className="folder-title">{folder.title}</span>
      </div>
    </div>
  )
}

export default FolderCard
