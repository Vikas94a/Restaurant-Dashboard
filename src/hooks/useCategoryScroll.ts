import { useEffect, useRef, useCallback, RefObject } from 'react';

interface UseCategoryScrollProps {
  menuData: { id: string; name: string }[];
  activeCategory: string | null;
  setActiveCategory: (category: string) => void;
  categoryRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
}

/**
 * Hook to manage category scroll tracking and navigation
 * Handles:
 * - Intersection Observer to detect visible category sections
 * - Programmatic scrolling when category is clicked
 * - Active category state management
 */
export function useCategoryScroll({
  menuData,
  activeCategory,
  setActiveCategory,
  categoryRefs,
}: UseCategoryScrollProps) {
  const activeCategoryRef = useRef<string | null>(null);
  const isScrollingRef = useRef(false);
  const categoryTabRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  // Scroll to category section when category is clicked
  const scrollToCategory = useCallback((categoryName: string) => {
    const categoryId = `category-${categoryName.replace(/\s+/g, '-').toLowerCase()}`;
    const element = categoryRefs.current[categoryId];
    
    if (element) {
      isScrollingRef.current = true;
      // Update both state and ref
      setActiveCategory(categoryName);
      activeCategoryRef.current = categoryName;
      
      // Use scrollIntoView with block: 'start' and let CSS scroll-margin handle the offset
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      // Also scroll the category tab into view if needed (mobile horizontal scroll)
      setTimeout(() => {
        if (categoryTabRef.current) {
          const tabButton = categoryTabRef.current.querySelector(`[data-category="${categoryId}"]`) as HTMLElement;
          if (tabButton) {
            tabButton.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
          }
        }
      }, 300);

      // Reset scrolling flag after animation
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    }
  }, [categoryRefs, setActiveCategory]);

  // Intersection Observer to update active category while scrolling
  useEffect(() => {
    if (menuData.length === 0) return;

    let observer: IntersectionObserver | null = null;
    let timeoutId: NodeJS.Timeout;

    // Wait for refs to be populated
    timeoutId = setTimeout(() => {
      // Root margin accounts for sticky header (73px) + tab bar (~56px) = ~140px
      // This ensures we detect when a category section reaches the top of the viewport
      const observerOptions = {
        root: null,
        rootMargin: '-140px 0px -60% 0px',
        threshold: [0, 0.1, 0.2, 0.5]
      };

      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        // Don't update during programmatic scroll (user clicked a category)
        if (isScrollingRef.current) return;

        // Find the category section that's most visible at the top of viewport
        let bestMatch: IntersectionObserverEntry | null = null;
        let highestVisibility = 0;

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            const viewportTop = 140; // Sticky header + tab bar height
            
            // Calculate visibility score: intersection ratio weighted by proximity to target position
            // Prefer sections that are at or near the top of the viewport
            const distanceFromTop = Math.max(0, rect.top - viewportTop);
            const visibilityScore = entry.intersectionRatio * (1 / (1 + distanceFromTop / 100));
            
            // Only consider sections that are at or above the target position (with tolerance)
            if (rect.top <= viewportTop + 100 && visibilityScore > highestVisibility) {
              highestVisibility = visibilityScore;
              bestMatch = entry;
            }
          }
        }

        // Update active category if we found a better match
        if (bestMatch !== null) {
          const targetElement = bestMatch.target as HTMLElement;
          if (targetElement && targetElement.id) {
            const categoryId = targetElement.id;
            // Find matching category by ID
            const matchingCategory = menuData.find(cat => {
              const expectedId = `category-${cat.name.replace(/\s+/g, '-').toLowerCase()}`;
              return categoryId === expectedId;
            });
            
            // Only update if it's different from current (prevents unnecessary re-renders)
            if (matchingCategory && activeCategoryRef.current !== matchingCategory.name) {
              activeCategoryRef.current = matchingCategory.name;
              setActiveCategory(matchingCategory.name);
            }
          }
        }
      };

      observer = new IntersectionObserver(observerCallback, observerOptions);

      // Observe all category sections
      const refs = Object.values(categoryRefs.current).filter(Boolean) as HTMLDivElement[];
      if (refs.length > 0) {
        refs.forEach((ref) => {
          observer!.observe(ref);
        });
      }
    }, 150); // Small delay to ensure DOM refs are populated

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [menuData, categoryRefs, setActiveCategory]);

  // Auto-scroll category tab into view when active category changes (from user scrolling)
  useEffect(() => {
    if (!activeCategory || isScrollingRef.current) return;
    
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      if (categoryTabRef.current) {
        const categoryId = `category-${activeCategory.replace(/\s+/g, '-').toLowerCase()}`;
        const tabButton = categoryTabRef.current.querySelector(`[data-category="${categoryId}"]`) as HTMLElement;
        
        if (tabButton) {
          // Check if button is already visible in the scroll container
          const container = categoryTabRef.current.querySelector('.overflow-x-auto');
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const buttonRect = tabButton.getBoundingClientRect();
            
            // Only scroll if button is not fully visible
            const isFullyVisible = 
              buttonRect.left >= containerRect.left &&
              buttonRect.right <= containerRect.right;
            
            if (!isFullyVisible) {
              // Smoothly scroll the tab into view, centered if possible
              tabButton.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
              });
            }
          }
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [activeCategory]);

  return {
    scrollToCategory,
    categoryTabRef,
    isScrollingRef,
  };
}

