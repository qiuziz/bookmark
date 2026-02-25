import React from 'react';
import BookmarkCard from '../bookmark-card';
import { Bookmark } from '../../types';
import './index.scss';

interface PinnedBookmarksProps {
  bookmarks: Bookmark[];
  columns: number;
  isMobile: boolean;
  activeCardId: {id: string, type: 'pinned' | 'regular' | 'folder'} | null;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
  onPin: (bookmark: Bookmark) => void;
  onCardActionsToggle: (cardId: string, cardType: 'pinned' | 'regular' | 'folder') => void;
}

const PinnedBookmarks: React.FC<PinnedBookmarksProps> = ({ 
  bookmarks, 
  columns, 
  isMobile, 
  activeCardId, 
  onEdit, 
  onDelete, 
  onPin, 
  onCardActionsToggle 
}) => {
  if (bookmarks.length === 0) {
    return null;
  }

  return (
    <div className="pinned-bookmarks">
      <h3 className="pinned-title">固定书签</h3>
      <div
        className="cards-grid"
        style={
          {
            '--columns': columns
          } as React.CSSProperties
        }
      >
        {bookmarks.map((bookmark, index) => (
          <BookmarkCard
            key={`pinned-${bookmark.id}-${index}`}
            bookmark={bookmark}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            isMobile={isMobile}
            showActions={activeCardId?.id === bookmark.id && activeCardId?.type === 'pinned'}
            onActionsToggle={() => onCardActionsToggle(bookmark.id, 'pinned')}
          />
        ))}
      </div>
      <div className="divider"></div>
    </div>
  );
};

export default React.memo(PinnedBookmarks);