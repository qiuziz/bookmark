import React from 'react';
import BookmarkCard from '../bookmark-card';
import FolderCard from '../folder-card';
import { Bookmark, Folder } from '../../types';
import './index.scss';

interface BookmarkGridProps {
  items: (Bookmark | Folder)[];
  columns: number;
  isMobile: boolean;
  activeCardId: {id: string, type: 'pinned' | 'regular' | 'folder'} | null;
  onBookmarkEdit: (bookmark: Bookmark) => void;
  onBookmarkDelete: (bookmarkId: string) => void;
  onBookmarkPin: (bookmark: Bookmark) => void;
  onFolderClick: (folder: Folder) => void;
  onFolderRename: (folder: Folder) => void;
  onFolderDelete: (folderId: string) => void;
  onCardActionsToggle: (cardId: string, cardType: 'pinned' | 'regular' | 'folder') => void;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({ 
  items, 
  columns, 
  isMobile, 
  activeCardId, 
  onBookmarkEdit, 
  onBookmarkDelete, 
  onBookmarkPin, 
  onFolderClick, 
  onFolderRename, 
  onFolderDelete, 
  onCardActionsToggle 
}) => {
  return (
    <div
      className="cards-grid"
      style={
        {
          '--columns': columns
        } as React.CSSProperties
      }
    >
      {items.map((item, index) => {
        if ('url' in item) {
          return (
            <BookmarkCard
              key={`bookmark-${item.id}-${index}`}
              bookmark={item}
              onEdit={onBookmarkEdit}
              onDelete={onBookmarkDelete}
              onPin={onBookmarkPin}
              isMobile={isMobile}
              showActions={activeCardId?.id === item.id && activeCardId?.type === 'regular'}
              onActionsToggle={() => onCardActionsToggle(item.id, 'regular')}
            />
          );
        }
        return (
          <FolderCard
            key={`folder-${item.id}-${index}`}
            folder={item}
            onClick={onFolderClick}
            onRename={onFolderRename}
            onDelete={onFolderDelete}
            isMobile={isMobile}
            showActions={activeCardId?.id === item.id && activeCardId?.type === 'folder'}
            onActionsToggle={() => onCardActionsToggle(item.id, 'folder')}
          />
        );
      })}
    </div>
  );
};

export default React.memo(BookmarkGrid);