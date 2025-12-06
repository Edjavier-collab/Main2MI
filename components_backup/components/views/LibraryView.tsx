import React from 'react';

import { HeaderWave, LeafDecoration } from '../illustrations/GrowthIllustrations';
import { SoftCard } from '../ui/SoftCard';
import { SoftInput } from '../ui/SoftInput';
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
      <div className="library-view__search">
        <SoftInput
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={<span>🔍</span>}
        />
      </div>

      {/* Categories */}
      <div className="library-view__content">
        {categories.map((category) => (
          <div key={category.id} className="library-view__category">
            <SoftCard
              className="library-view__category-card"
              hoverable
              onClick={() => onCategoryClick(category.id)}
            >
              <div className="library-view__category-header">
                <span className="library-view__category-icon">{category.icon}</span>
                <div className="library-view__category-info">
                  <h3>{category.title}</h3>
                  <span className="library-view__category-count">
                    {category.itemCount} {category.itemCount === 1 ? 'resource' : 'resources'}
                  </span>
                </div>
                <span className={`library-view__category-arrow ${expandedCategory === category.id ? 'expanded' : ''}`}>
                  ›
                </span>
              </div>
            </SoftCard>

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

