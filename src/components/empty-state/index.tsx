import React from 'react';
import './index.scss';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = '开始管理您的书签', 
  message = "点击右上角的'添加'按钮来添加第一个书签" 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">📚</div>
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
};

export default React.memo(EmptyState);