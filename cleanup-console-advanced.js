const fs = require('fs');
const path = require('path');

// Files to completely skip (keep all console statements)
const SKIP_FILES = [
  'scripts/generateFakeOrders.js',
  'functions/src/index.ts',
  'src/app/api/send-email/route.ts',
  'src/app/test-firebase/page.tsx',
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

function removeConsoleStatements(content, keepErrors = false) {
  let modifiedContent = content;
  let changes = 0;

  // Handle single-line console statements
  const singleLinePattern = /console\.(log|warn|error)\([^)]*\);?\s*/g;
  const matches = content.match(singleLinePattern) || [];
  
  if (keepErrors) {
    // Remove only log and warn, keep error
    modifiedContent = modifiedContent.replace(/console\.(log|warn)\([^)]*\);?\s*/g, '');
    changes += (matches.filter(match => !match.includes('console.error')).length);
  } else {
    // Remove all console statements
    modifiedContent = modifiedContent.replace(/console\.(log|warn|error)\([^)]*\);?\s*/g, '');
    changes += matches.length;
  }

  // Handle multi-line console statements (more complex)
  const multiLinePattern = /console\.(log|warn|error)\([\s\S]*?\);?\s*/g;
  const multiLineMatches = content.match(multiLinePattern) || [];
  
  if (keepErrors) {
    // Remove only log and warn, keep error
    modifiedContent = modifiedContent.replace(/console\.(log|warn)\([\s\S]*?\);?\s*/g, '');
    changes += (multiLineMatches.filter(match => !match.includes('console.error')).length);
  } else {
    // Remove all console statements
    modifiedContent = modifiedContent.replace(/console\.(log|warn|error)\([\s\S]*?\);?\s*/g, '');
    changes += multiLineMatches.length;
  }

  return { content: modifiedContent, changes };
}

function cleanupFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    if (shouldSkipFile(filePath)) {
      `);
      return;
    }

    const keepErrors = shouldKeepErrors(filePath);
    const { content: cleanedContent, changes } = removeConsoleStatements(content, keepErrors);

    if (changes > 0) {
      fs.writeFileSync(filePath, cleanedContent);
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