"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faHome } from "@fortawesome/free-solid-svg-icons";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbProps {
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ className = "" }) => {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
      current: segments.length === 1
    });

    // Add other segments
    segments.forEach((segment, index) => {
      if (segment === 'dashboard') return; // Skip dashboard segment
      
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const isLast = index === segments.length - 1;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: isLast ? undefined : href,
        current: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumb on main dashboard
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <FontAwesomeIcon 
              icon={faChevronRight} 
              className="w-3 h-3 text-gray-400 mx-2" 
              aria-hidden="true"
            />
          )}
          
          {item.current ? (
            <span className="text-gray-900 font-medium" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href || '#'}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-150"
            >
              {index === 0 ? (
                <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
              ) : (
                item.label
              )}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;

