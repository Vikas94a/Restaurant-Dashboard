/**
 * Custom Tailwind plugins for AI Eat Easy
 */

const plugin = require('tailwindcss/plugin');

const primaryColorPlugin = plugin(function({ addComponents, theme }) {
  const primaryColor = 'var(--primary)';
  const primaryForeground = 'var(--primary-foreground)';
  
  addComponents({
    '.bg-primary': {
      backgroundColor: primaryColor,
      color: primaryForeground,
    },
    '.bg-primary-dark': {
      backgroundColor: 'color-mix(in oklab, var(--primary), black 10%)',
      color: primaryForeground,
    },
    '.text-primary': {
      color: primaryColor,
    },
    '.text-primary-dark': {
      color: 'color-mix(in oklab, var(--primary), black 10%)',
    },
    '.border-primary': {
      borderColor: primaryColor,
    },
  });
});

module.exports = {
  primaryColorPlugin
};
