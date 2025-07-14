import React from 'react';

type OrderTab = 'active' | 'completed' | 'rejected';

interface OrderNavBarProps {
  selectedTab: OrderTab;
  setSelectedTab: (tab: OrderTab) => void;
}

const tabLabels: Record<OrderTab, string> = {
  active: 'Active Orders',
  completed: 'Completed Orders',
  rejected: 'Rejected Orders',
};

export default function OrderNavBar({ selectedTab, setSelectedTab }: OrderNavBarProps) {
  return (
    <nav className="flex space-x-4 mb-8">
      {(['active', 'completed', 'rejected'] as OrderTab[]).map((tab) => (
        <button
          key={tab}
          className={`px-6 py-2 rounded-t-lg font-medium border-b-2 transition-colors duration-150 focus:outline-none ${selectedTab === tab ? 'border-primary text-primary bg-white shadow' : 'border-transparent text-gray-500 bg-gray-100 hover:text-primary'}`}
          onClick={() => setSelectedTab(tab)}
        >
          {tabLabels[tab]}
        </button>
      ))}
    </nav>
  );
} 