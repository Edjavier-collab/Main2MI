import React from 'react';

import { HeaderWave } from '../illustrations/SeafoamIllustrations';
import { Card } from '../ui/Card';
import './LibraryView.css';

interface Category {
  id: string;
  title: string;
  icon: string;
  itemCount: number;
  items: { id: string; title: string }[];
}

interface LibraryViewProps {
  categories: Category[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onItemClick: (categoryId: string, itemId: string) => void;
  expandedCategory: string | null;
  onCategoryClick: (categoryId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  categories,
  searchQuery,
  onSearchChange,
  onItemClick,
  expandedCategory,
  onCategoryClick,
}) => {
  return (
    <div className="library-view">
      {/* Header */}
      <div className="library-view__header">
        <HeaderWave className="library-view__wave" />
        <div className="library-view__header-content">
          <h1>Resource Library</h1>
          <p>Learn MI fundamentals and techniques</p>
        </div>
      </div>

      {/* Search */}
      <div className="library-view__search px-6">
        <div className="relative">
          <i className="fa fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true"></i>
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-[var(--color-neutral-300)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="library-view__content px-6 pb-24">
        {categories.map((category) => (
          <div key={category.id} className="library-view__category">
            <Card
              variant="elevated"
              padding="md"
              hoverable
              onClick={() => onCategoryClick(category.id)}
              className="library-view__category-card"
            >
              <div className="library-view__category-header">
                <span className="library-view__category-icon">{category.icon}</span>
                <div className="library-view__category-info">
                  <h3 className="text-[var(--color-text-primary)]">{category.title}</h3>
                  <span className="library-view__category-count text-[var(--color-text-muted)]">
                    {category.itemCount} {category.itemCount === 1 ? 'resource' : 'resources'}
                  </span>
                </div>
                <span className={`library-view__category-arrow text-[var(--color-text-muted)] ${expandedCategory === category.id ? 'expanded' : ''}`}>
                  ›
                </span>
              </div>
            </Card>

            {/* Expanded Items */}
            {expandedCategory === category.id && (
              <div className="library-view__items">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="library-view__item"
                    onClick={() => onItemClick(category.id, item.id)}
                  >
                    <LeafDecoration size={20} />
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

