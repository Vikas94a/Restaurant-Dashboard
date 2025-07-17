import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheckCircle, faXmark } from '@fortawesome/free-solid-svg-icons';

type OrderTab = 'active' | 'completed' | 'rejected';

interface OrderNavBarProps {
  selectedTab: OrderTab;
  setSelectedTab: (tab: OrderTab) => void;
}

const tabLabels: Record<OrderTab, { label: string; icon: any; description: string }> = {
  active: {
    label: 'Aktive bestillinger',
    icon: faClock,
    description: 'Venter på behandling'
  },
  completed: {
    label: 'Fullførte bestillinger',
    icon: faCheckCircle,
    description: 'Levert til kunde'
  },
  rejected: {
    label: 'Avviste bestillinger',
    icon: faXmark,
    description: 'Ikke akseptert'
  },
};

export default function OrderNavBar({ selectedTab, setSelectedTab }: OrderNavBarProps) {
  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-2">
        <nav className="flex space-x-2">
          {(['active', 'completed', 'rejected'] as OrderTab[]).map((tab) => {
            const isSelected = selectedTab === tab;
            const tabInfo = tabLabels[tab];
            
            return (
              <button
                key={tab}
                className={`flex-1 flex items-center justify-center px-6 py-4 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105' 
                    : 'text-gray-600 bg-gray-50 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md'
                }`}
                onClick={() => setSelectedTab(tab)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected 
                      ? 'bg-white/20' 
                      : 'bg-orange-100'
                  }`}>
                    <FontAwesomeIcon 
                      icon={tabInfo.icon} 
                      className={`w-4 h-4 ${
                        isSelected ? 'text-white' : 'text-orange-600'
                      }`} 
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{tabInfo.label}</div>
                    <div className={`text-xs ${
                      isSelected ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {tabInfo.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 