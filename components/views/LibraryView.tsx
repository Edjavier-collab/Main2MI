'use client';

import React from 'react';
import { InsetGroup, GroupedListItem } from '../ui/Card';
import { SearchBar } from '../ui/SearchBar';
import { FeaturedResourceCard } from '../ui/FeaturedResourceCard';
import { PlayCircle, FileText, Users, ChevronRight, Brain } from 'lucide-react';

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  progress: number;
}

interface Category {
  id: string;
  title: string;
  items: LibraryItem[];
}

interface LibraryViewProps {
  categories: Category[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onItemClick: (categoryId: string, itemId: string) => void;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="px-1 pt-6 pb-2 text-sm font-semibold text-text-secondary uppercase tracking-wider">
        {title}
    </h2>
);

const IconBox = ({ icon, className }: { icon: React.ReactNode; className?: string }) => (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${className}`}>
        {icon}
    </div>
);

const categoryIconMap: { [key: string]: React.ReactNode } = {
    'Videos': <IconBox icon={<PlayCircle size={24} />} className="bg-blue-500/10 text-blue-500" />,
    'PDFs/Guides': <IconBox icon={<FileText size={24} />} className="bg-orange-500/10 text-orange-500" />,
    'Case Studies': <IconBox icon={<Users size={24} />} className="bg-purple-500/10 text-purple-500" />,
};

export const LibraryView: React.FC<LibraryViewProps> = ({
  categories,
  searchQuery,
  onSearchChange,
  onItemClick,
}) => {
  const filteredCategories = categories
    .map(category => ({
      ...category,
      items: category.items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(category => category.items.length > 0);

    const handleFeaturedClick = () => {
        const fundamentalsCategory = categories.find(c => c.title === 'PDFs/Guides');
        const fundamentalsItem = fundamentalsCategory?.items.find(i => i.title.includes('MI Fundamentals'));
        if (fundamentalsCategory && fundamentalsItem) {
            onItemClick(fundamentalsCategory.id, fundamentalsItem.id);
        }
    };

  return (
    <div className="min-h-screen bg-transparent pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-text-primary">Resource Library</h1>
        <p className="text-text-secondary mt-1">Learn MI fundamentals and techniques</p>
      </div>

      {/* Featured Section */}
      <div className="px-4 mb-4">
        <div className="max-w-2xl mx-auto">
            <SectionHeader title="Featured" />
            <FeaturedResourceCard
                title="MI Fundamentals Guide"
                description="Master the core concepts of Motivational Interviewing."
                icon={<IconBox icon={<Brain size={28} />} className="bg-primary/10 text-primary" />}
                buttonText="Start Learning"
                onClick={handleFeaturedClick}
            />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 sticky top-0 py-2 z-10 bg-bg-main/80 backdrop-blur-sm -mx-4">
         <div className="max-w-2xl mx-auto">
            <SearchBar
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-2xl mx-auto px-4">
        {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
            <div key={category.id}>
              <SectionHeader title={category.title} />
              <InsetGroup>
                {category.items.map((item) => (
                  <GroupedListItem
                    key={item.id}
                    onClick={() => onItemClick(category.id, item.id)}
                    label={item.title}
                    subtitle={item.description}
                    icon={categoryIconMap[category.title] || <IconBox icon={<FileText size={24} />} className="bg-gray-500/10 text-gray-500" />}
                    progress={item.progress}
                  >
                    <ChevronRight className="h-5 w-5 text-text-muted" />
                  </GroupedListItem>
                ))}
              </InsetGroup>
            </div>
            ))
        ) : (
            <div className="text-center py-20">
                <p className="text-text-muted">No resources found for your search.</p>
            </div>
        )}
      </div>
    </div>
  );
};
