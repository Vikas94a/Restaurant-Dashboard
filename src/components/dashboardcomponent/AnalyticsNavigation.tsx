"use client";

import React from 'react';
import { BarChart3, Menu, TrendingUp } from 'lucide-react';

interface AnalyticsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  extraTabs?: { key: string; label: string; icon?: React.ElementType; description?: string }[];
}

const AnalyticsNavigation: React.FC<AnalyticsNavigationProps> = ({ activeTab, onTabChange, extraTabs = [] }) => {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Key metrics and performance summary'
    },
    {
      id: 'menu-insight',
      label: 'Menu Insight',
      icon: Menu,
      description: 'Menu performance and item analytics'
    },
    // extraTabs will be appended below
  ];

  const allTabs = [
    ...tabs,
    ...extraTabs.map(tab => ({
      id: tab.key,
      label: tab.label,
      icon: tab.icon || BarChart3,
      description: tab.description || tab.label
    }))
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600">Monitor your restaurant&apos;s performance and insights</p>
          </div>
        </div>
        
        <nav className="flex space-x-8">
          {allTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                <span>{tab.label}</span>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                  {tab.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AnalyticsNavigation; 