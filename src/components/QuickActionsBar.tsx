"use client";

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faBrain,
  faClipboardList,
  faBookOpen,
  faCalendarAlt,
  faChevronUp,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  href?: string;
  onClick?: () => void;
  color: string;
  badge?: number;
}

interface QuickActionsBarProps {
  className?: string;
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  // Mock data - replace with real data from your store
  const quickActions: QuickAction[] = [
    {
      id: "new-order",
      label: "New Order",
      icon: faClipboardList,
      href: "/dashboard/orders",
      color: "blue",
      badge: 3
    },
    {
      id: "add-menu-item",
      label: "Add Menu Item",
      icon: faBookOpen,
      href: "/dashboard/menu",
      color: "green"
    },
    {
      id: "new-reservation",
      label: "New Reservation",
      icon: faCalendarAlt,
      href: "/dashboard/reservations",
      color: "green",
      badge: 1
    },
    {
      id: "generate-ai-post",
      label: "Generate AI Post",
      icon: faBrain,
      href: "/dashboard/ai-insight",
      color: "purple"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200";
      case "green":
        return "bg-green-500 hover:bg-green-600 text-white shadow-green-200";
      case "purple":
        return "bg-purple-500 hover:bg-purple-600 text-white shadow-purple-200";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white shadow-gray-200";
    }
  };

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="mb-4 space-y-3">
          {quickActions.map((action) => (
            <div key={action.id} className="flex items-center justify-end">
              <div className="flex items-center gap-3 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {action.label}
                </span>
                {action.badge && action.badge > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {action.badge > 99 ? '99+' : action.badge}
                  </span>
                )}
                <button
                  onClick={() => handleActionClick(action)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-105 ${getColorClasses(action.color)}`}
                  title={action.label}
                >
                  <FontAwesomeIcon icon={action.icon} className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        title={isExpanded ? "Hide quick actions" : "Show quick actions"}
      >
        <FontAwesomeIcon 
          icon={isExpanded ? faChevronDown : faChevronUp} 
          className="w-5 h-5 text-gray-600" 
        />
      </button>
    </div>
  );
};

export default QuickActionsBar;

