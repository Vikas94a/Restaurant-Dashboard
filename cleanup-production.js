const fs = require('fs');
const path = require('path');

// Files to delete
const filesToDelete = [
  // Development files
  'cleanup-console.js',
  'cleanup-console-advanced.js',
  'PRODUCTION-CLEANUP.md',
  'setup-env.md',
  'CLEANUP-FILES.md',
  'cleanup-production.js', // This script will delete itself too
  
  // Duplicate config files
  'next.config.ts',
  'src/app/global.css',
  
  // Jest config (if not using tests)
  'jest.config.js',
  'jest.setup.js',
];

// Directories to delete
const dirsToDelete = [
  'src/app/test-firebase',
  'src/app/test-storage',
  'src/components/__tests__',
  'src/firebase',
  'scripts',
];

function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted: ${filePath}`);
    } else {
      console.log(`⏭️  Skipped (not found): ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting ${filePath}:`, error.message);
  }
}

function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Deleted directory: ${dirPath}`);
    } else {
      console.log(`⏭️  Skipped (not found): ${dirPath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting directory ${dirPath}:`, error.message);
  }
}

console.log('🧹 Starting production cleanup...');
console.log('📁 Removing unnecessary files and directories...\n');

// Delete files
filesToDelete.forEach(file => {
  deleteFile(file);
});

console.log('\n📁 Removing unnecessary directories...\n');

// Delete directories
dirsToDelete.forEach(dir => {
  deleteDirectory(dir);
});

console.log('\n🎉 Production cleanup completed!');
console.log('\n📋 Summary:');
console.log('- Removed development and testing files');
console.log('- Removed duplicate configuration files');
console.log('- Removed test pages and directories');
console.log('- Removed duplicate Firebase configurations');
console.log('- Removed development scripts');
console.log('\n⚠️  Next steps:');
console.log('1. Test your application thoroughly');
console.log('2. Run: npm run build');
console.log('3. Deploy to your hosting platform');
console.log('4. Verify all functionality works'); 