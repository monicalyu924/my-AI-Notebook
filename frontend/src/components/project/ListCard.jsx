import React, { memo, useMemo } from 'react';
import CardListItem from './CardListItem';

const ListHeader = memo(({ list }) => {
  const completedCount = useMemo(() => 
    list.cards.filter(card => card.completed).length, 
    [list.cards]
  );
  
  const inProgressCount = useMemo(() => 
    list.cards.filter(card => !card.completed).length, 
    [list.cards]
  );

  return (
    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{list.title}</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{list.cards.length} 个任务</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {completedCount} 已完成
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            {inProgressCount} 进行中
          </div>
        </div>
      </div>
    </div>
  );
});

ListHeader.displayName = 'ListHeader';

const EmptyListContent = memo(() => (
  <div className="text-center py-12 text-gray-500">
    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
    <p className="text-lg font-medium mb-2">暂无任务</p>
    <p className="text-sm">在这个列表中还没有任何任务卡片</p>
  </div>
));

EmptyListContent.displayName = 'EmptyListContent';

const CardsList = memo(({ cards, onCardClick }) => (
  <div className="grid gap-4">
    {cards.map((card) => (
      <CardListItem
        key={card.id}
        card={card}
        onCardClick={onCardClick}
      />
    ))}
  </div>
));

CardsList.displayName = 'CardsList';

const ListCard = memo(({ list, onCardClick }) => {
  const hasCards = list.cards && list.cards.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <ListHeader list={list} />
      
      <div className="p-4 sm:p-6">
        {hasCards ? (
          <CardsList cards={list.cards} onCardClick={onCardClick} />
        ) : (
          <EmptyListContent />
        )}
      </div>
    </div>
  );
});

ListCard.displayName = 'ListCard';

export default ListCard;