This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Ai-eat-easy instructions
<invoke name="write_to_file">
<parameter name="TargetFile">e:\Projects\AIEatEasy\New folder\ai-eat-easy\PROJECT_STRUCTURE.md</parameter>
<parameter name="CodeContent"># AI Eat Easy - Detailed Project Structure Guide

This document provides a comprehensive guide to the codebase structure, helping you quickly locate and understand different parts of the application.

## Core Project Overview

AI Eat Easy is a restaurant management platform with:
- A restaurant owner dashboard for managing restaurant profiles and menus
- A customer-facing interface for viewing restaurant menus and placing orders
- Firebase backend for data storage and authentication

## Technical Stack

- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **State Management**: React Context API
- **Routing**: Next.js App Router

## Directory Structure Breakdown

### `/src/app/` - Application Routing

Next.js App Router uses a folder-based routing structure:

#### Authentication Routes
- `/auth/login/page.tsx`: Login page
- `/auth/register/page.tsx`: Registration page

#### Dashboard Routes (Restaurant Owner)
- `/dashboard/page.tsx`: Main dashboard with overview statistics
- `/dashboard/setup/page.tsx`: Restaurant profile configuration
- `/dashboard/menu/page.tsx`: Menu item management
- `/dashboard/orders/page.tsx`: Order management and tracking
- `/dashboard/layout.tsx`: Shared layout for all dashboard pages
  - Includes sidebar navigation
  - Wraps children in CartProvider for menu functionality
  - Handles authentication checking

#### Restaurant Routes (Customer-facing)
- `/restaurant/[id]/page.tsx`: Restaurant details page
  - The `[id]` is a dynamic segment representing the restaurant ID
- `/restaurant/[id]/menu/page.tsx`: Menu viewing and ordering interface
  - Wrapped in CartProvider for cart functionality
- `/restaurant/[id]/layout.tsx`: Shared layout for restaurant pages

### `/src/components/` - Reusable UI Components

#### Navigation Components
- `Sidebar.tsx`: Dashboard navigation sidebar
- `Header.tsx`: Page header with authentication controls

#### Menu-related Components  
- `RestaurantMenu.tsx`: Core component for displaying restaurant menus
  - Handles both admin editing and customer ordering views
  - Processes different menu data formats (new and legacy)
- `MenuItem.tsx`: Individual menu item display 
- `MenuItemForm.tsx`: Form for creating/editing menu items
- `MenuCategory.tsx`: Category grouping of menu items

#### Cart Components
- `Cart.tsx`: Shopping cart display
- `CartItem.tsx`: Individual item in the cart

#### Form Components
- `Input.tsx`: Reusable input component
- `Button.tsx`: Reusable button component
- `SelectInput.tsx`: Dropdown select component

#### UI Components
- `Modal.tsx`: Reusable modal dialog
- `Loader.tsx`: Loading spinner
- `ErrorAlert.tsx`: Error message display

### `/src/contexts/` - State Management

- `AuthContext.tsx`: User authentication state
  - Provides current user information throughout the app
  - Manages login/logout functionality
- `CartContext.tsx`: Shopping cart state management
  - Provides cart add/remove/update functions
  - Tracks cart items and total price
- `ToastContext.tsx`: Application-wide notifications

### `/src/firebase/` - Firebase Integration

- `config.ts`: Firebase initialization and configuration
- `auth.ts`: Authentication utilities
  - User registration, login, logout
  - Password reset
- `firestore.ts`: Database operations
  - CRUD operations for restaurants, menus, orders
  - Data transformation utilities

### `/src/hooks/` - Custom React Hooks

- `useAuth.ts`: Authentication hook (wrapper for AuthContext)
- `useCart.ts`: Cart management hook (wrapper for CartContext)
- `useRestaurant.ts`: Hook for fetching restaurant data

### `/src/types/` - TypeScript Type Definitions

- `restaurant.ts`: Restaurant data types
- `menu.ts`: Menu item types
- `order.ts`: Order and cart types
- `user.ts`: User profile types

### `/src/utils/` - Utility Functions

- `formatting.ts`: Data formatting utilities (dates, currency, etc.)
- `validation.ts`: Form validation utilities
- `helpers.ts`: Miscellaneous helper functions

## Working with the Codebase

### Adding New Features

1. **Dashboard Feature**:
   - Add a new folder under `/src/app/dashboard/` for the feature
   - Create necessary components in `/src/components/`
   - Update the Sidebar to include a link to the new feature

2. **Customer-facing Feature**:
   - Add route under `/src/app/restaurant/[id]/`
   - Ensure proper authentication/authorization if needed

### Menu Data Structure

The application handles two different menu data formats:

1. **New Format**:
   ```typescript
   {
     id: string;
     name: string;
     description: string;
     price: number;
     category: string;
     image?: string;
   }