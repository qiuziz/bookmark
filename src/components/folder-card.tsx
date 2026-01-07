import { FolderCardProps } from '../types'
import './folder-card.scss'

function FolderCard({ folder, onClick, isMobile }: FolderCardProps): React.ReactElement {
  return (
    <div className={`folder-card ${isMobile ? 'mobile' : ''}`} onClick={(): void => onClick(folder)}>
      <div className="folder-icon">📁</div>
      <div className="folder-info">
        <span className="folder-title">{folder.title}</span>
      </div>
    </div>
  )
}

export default FolderCard
