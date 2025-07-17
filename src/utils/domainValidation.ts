/**
 * Domain validation utilities
 */

// Domain regex pattern
export const DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/;

// Reserved domains that cannot be used
export const RESERVED_DOMAINS = [
  'www',
  'api',
  'admin',
  'dashboard',
  'login',
  'signup',
  'restaurant',
  'checkout',
  'menu',
  'order',
  'cart',
  'profile',
  'settings',
  'help',
  'support',
  'about',
  'contact',
  'privacy',
  'terms',
  'blog',
  'news',
  'app',
  'mobile',
  'web',
  'test',
  'dev',
  'staging',
  'production',
  'aieateasy',
  'ai-eat-easy',
];

/**
 * Validates a domain name
 * @param domain - The domain to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateDomain(domain: string): { isValid: boolean; error?: string } {
  // Check if domain is empty
  if (!domain || domain.trim() === '') {
    return { isValid: false, error: 'Domain is required' };
  }

  // Check minimum length
  if (domain.length < 3) {
    return { isValid: false, error: 'Domain must be at least 3 characters long' };
  }

  // Check maximum length
  if (domain.length > 63) {
    return { isValid: false, error: 'Domain must be less than 63 characters' };
  }

  // Check if domain matches regex pattern
  if (!DOMAIN_REGEX.test(domain)) {
    return { 
      isValid: false, 
      error: 'Domain must contain only letters, numbers, and hyphens. Cannot start or end with a hyphen.' 
    };
  }

  // Check if domain is reserved
  if (RESERVED_DOMAINS.includes(domain.toLowerCase())) {
    return { isValid: false, error: 'This domain name is reserved and cannot be used' };
  }

  // Check for consecutive hyphens
  if (domain.includes('--')) {
    return { isValid: false, error: 'Domain cannot contain consecutive hyphens' };
  }

  return { isValid: true };
}

/**
 * Formats a domain for display
 * @param domain - The domain to format
 * @returns Formatted domain with .aieateasy.no suffix
 */
export function formatDomain(domain: string): string {
  return `${domain}.aieateasy.no`;
}

/**
 * Extracts domain from a full URL
 * @param url - The full URL
 * @returns The domain part
 */
export function extractDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Remove .aieateasy.no suffix if present
    if (hostname.endsWith('.aieateasy.no')) {
      return hostname.replace('.aieateasy.no', '');
    }
    
    return hostname;
  } catch {
    return null;
  }
} 