"use client";

import Link from 'next/link';

const setupLinks = [
  { name: 'Restaurant basics', href: '/dashboard/setup/basics' },
  { name: 'Services & opening hours', href: '/dashboard/setup/services' },
  { name: 'Payment methods & taxes', href: '/dashboard/setup/payment' },
  { name: 'Taking orders', href: '/dashboard/setup/orders' },
  { name: 'Menu Setup', href: '/dashboard/menu', current: true }, 
  { name: 'Publishing', href: '/dashboard/setup/publishing' },
  { name: 'Payments', href: '/dashboard/setup/payments-history' }, 
];

export default function SetupSidebar() {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 pt-6 space-y-6 h-full">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SETUP</h2>
      <nav className="space-y-1">
        {setupLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`
              group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150
              ${link.current
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }
            `}
          >
            {link.current && (
              <span className="mr-2.5 h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true"></span>
            )}
            {link.name}
            {link.current && (
                <svg className="ml-auto h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            )}
          </Link>
        ))}
      </nav>
      {/* You can add other sidebar sections here if needed */}
      {/* For example, a different set of links or information */}
      {/* <div className="text-center text-gray-400 text-sm pt-10">
        Setup section has been removed.
      </div> */}
    </div>
  );
}
