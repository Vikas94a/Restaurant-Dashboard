// Error message mapping for menu editor operations
export const MENU_EDITOR_ERROR_MESSAGES = {
  'not-found': 'Menu item not found. Please try again.',
  'permission-denied': 'You do not have permission to edit this menu.',
  'unavailable': 'Menu editor service is currently unavailable.',
  'invalid-data': 'Invalid menu data provided.',
  'network-error': 'Network error. Please check your connection.',
  'save-failed': 'Failed to save menu changes. Please try again.',
  'delete-failed': 'Failed to delete menu item. Please try again.',
  'update-failed': 'Failed to update menu item. Please try again.',
  'default': 'An unexpected error occurred while editing the menu.'
} as const;

// Helper function to get user-friendly error message
export const getMenuEditorErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = error.code as keyof typeof MENU_EDITOR_ERROR_MESSAGES;
    return MENU_EDITOR_ERROR_MESSAGES[code] || MENU_EDITOR_ERROR_MESSAGES.default;
  }
  return MENU_EDITOR_ERROR_MESSAGES.default;
}; 