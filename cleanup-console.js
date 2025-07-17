const fs = require('fs');
const path = require('path');

// Files to completely skip (keep all console statements)
const SKIP_FILES = [
  'scripts/generateFakeOrders.js', // Keep for debugging scripts
  'functions/src/index.ts', // Keep for Firebase Functions logging
  'src/app/api/send-email/route.ts', // Keep for API debugging
  'src/app/test-firebase/page.tsx', // Keep for testing
];

// Files to keep console.error but remove console.log and console.warn
const KEEP_ERRORS_FILES = [
  'src/store/features/',
  'src/services/',
  'src/hooks/',
  'src/components/',
  'src/app/',
  'src/utils/',
  'src/providers/',
];

function shouldSkipFile(filePath) {
  return SKIP_FILES.some(skipPath => filePath.includes(skipPath));
}

function shouldKeepErrors(filePath) {
  return KEEP_ERRORS_FILES.some(keepPath => filePath.includes(keepPath));
}

function cleanupFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = 0;

    if (shouldSkipFile(filePath)) {
      `);
      return;
    }

    if (shouldKeepErrors(filePath)) {
      // Remove console.log and console.warn, keep console.error
      content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
      content = content.replace(/console\.warn\([^)]*\);?\s*/g, '');
      changes = (originalContent.match(/console\.(log|warn)\(/g) || []).length;
    } else {
      // Remove all console statements
      content = content.replace(/console\.(log|warn|error)\([^)]*\);?\s*/g, '');
      changes = (originalContent.match(/console\.(log|warn|error)\(/g) || []).length;
    }

    if (changes > 0) {
      fs.writeFileSync(filePath, content);
      `);
    }
  } catch (error) {
    }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
      cleanupFile(filePath);
    }
  });
}

// Start from src directory
if (fs.existsSync('src')) {
  walkDir('src');
}

// Also check root level files
const rootFiles = fs.readdirSync('.').filter(file => 
  /\.(ts|tsx|js|jsx)$/.test(file) && !file.startsWith('.')
);

rootFiles.forEach(file => {
  cleanupFile(file);
});

for production'); 