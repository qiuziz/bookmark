import { ReactElement } from 'react'
import { Bookmark, Folder } from '../../types'
import BookmarkCard from '../bookmark-card'
import FolderCard from '../folder-card'
import './index.scss'

interface BookmarkListProps {
  bookmarks: Bookmark[]
  folders: Folder[]
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmarkId: string) => void
  onPin: (bookmark: Bookmark) => void
  onFolderClick: (folder: Folder) => void
  onRenameFolder: (folder: Folder) => void
  onDeleteFolder: (folderId: string) => void
  isMobile: boolean
  activeCardId: {id: string, type: 'pinned' | 'regular' | 'folder'} | null
  onActionsToggle: (cardId: string, cardType: 'pinned' | 'regular' | 'folder') => void
}

function BookmarkList({
  bookmarks,
  folders,
  onEdit,
  onDelete,
  onPin,
  onFolderClick,
  onRenameFolder,
  onDeleteFolder,
  isMobile,
  activeCardId,
  onActionsToggle
}: BookmarkListProps): ReactElement {
  return (
    <>
      {bookmarks.filter((b: Bookmark): boolean => b.isPinned).map((bookmark: Bookmark, index: number) => (
        <BookmarkCard
          key={`pinned-${bookmark.id}-${index}`}
          bookmark={bookmark}
          onEdit={onEdit}
          onDelete={onDelete}
          onPin={onPin}
          isMobile={isMobile}
          showActions={activeCardId?.id === bookmark.id && activeCardId?.type === 'pinned'}
          onActionsToggle={() => onActionsToggle(bookmark.id, 'pinned')}
        />
      ))}
      {folders.length > 0 && bookmarks.filter((b: Bookmark): boolean => b.isPinned).length > 0 && (
        <div className="divider"></div>
      )}
      {folders.map((folder: Folder, index: number) => (
        <FolderCard
          key={`folder-${folder.id}-${index}`}
          folder={folder}
          onClick={onFolderClick}
          onRename={onRenameFolder}
          onDelete={onDeleteFolder}
          isMobile={isMobile}
          showActions={activeCardId?.id === folder.id && activeCardId?.type === 'folder'}
          onActionsToggle={() => onActionsToggle(folder.id, 'folder')}
        />
      ))}
      {bookmarks.filter((b: Bookmark): boolean => !b.isPinned).map((bookmark: Bookmark, index: number) => (
        <BookmarkCard
          key={`bookmark-${bookmark.id}-${index}`}
          bookmark={bookmark}
          onEdit={onEdit}
          onDelete={onDelete}
          onPin={onPin}
          isMobile={isMobile}
          showActions={activeCardId?.id === bookmark.id && activeCardId?.type === 'regular'}
          onActionsToggle={() => onActionsToggle(bookmark.id, 'regular')}
        />
      ))}
    </>
  )
}

export default BookmarkList
