# 🧹 Production Cleanup - Unnecessary Files to Remove

## 🗑️ **Files to DELETE Before Going Live**

### **1. Development & Testing Files**

```
✅ DELETE: cleanup-console.js
✅ DELETE: cleanup-console-advanced.js
✅ DELETE: PRODUCTION-CLEANUP.md
✅ DELETE: setup-env.md
✅ DELETE: CLEANUP-FILES.md (this file)
```

### **2. Test Pages (Development Only)**

```
✅ DELETE: src/app/test-firebase/page.tsx
✅ DELETE: src/app/test-storage/page.tsx
✅ DELETE: src/app/test-firebase/ (entire directory)
✅ DELETE: src/app/test-storage/ (entire directory)
```

### **3. Test Files**

```
✅ DELETE: src/components/__tests__/RestaurantMenu.test.tsx
✅ DELETE: src/components/__tests__/ (entire directory)
```

### **4. Duplicate Firebase Config Files**

```
✅ DELETE: src/firebase/config.ts (incomplete - missing storage)
✅ DELETE: src/firebase/ (entire directory - use lib/firebase.tsx instead)
```

### **5. Duplicate Configuration Files**

```
✅ DELETE: next.config.ts (use next.config.js instead)
✅ DELETE: src/app/global.css (use globals.css instead)
```

### **6. Development Scripts**

```
✅ DELETE: scripts/generateFakeOrders.js (development only)
✅ DELETE: scripts/ (entire directory)
```

### **7. Jest Configuration (if not using tests)**

```
✅ DELETE: jest.config.js
✅ DELETE: jest.setup.js
```

## 🔧 **Files to UPDATE Before Going Live**

### **1. Fix Firebase Imports**

Update these files to use the correct Firebase import:

- `src/hooks/useRestaurantData.ts` - Change from `@/firebase/config` to `@/lib/firebase`
- `src/hooks/useOrderData.ts` - Change from `@/firebase/config` to `@/lib/firebase`
- `src/hooks/useOrderStatus.ts` - Change from `@/firebase/firebaseConfig` to `@/lib/firebase`
- `src/hooks/useGlobalOrderListener.ts` - Change from `@/firebase/firebaseConfig` to `@/lib/firebase`

### **2. Update .gitignore**

Add these to `.gitignore`:

```
# Environment files
.env.local
.env.production
.env.development

# Build files
.next/
out/
build/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE files
.vscode/
.idea/
*.swp
*.swo
```

## 📁 **Files to KEEP (Essential for Production)**

### **Core Application Files**

```
✅ KEEP: src/app/ (main application)
✅ KEEP: src/components/ (UI components)
✅ KEEP: src/hooks/ (custom hooks)
✅ KEEP: src/store/ (Redux store)
✅ KEEP: src/services/ (API services)
✅ KEEP: src/utils/ (utility functions)
✅ KEEP: src/types/ (TypeScript types)
✅ KEEP: src/providers/ (context providers)
✅ KEEP: src/lib/firebase.tsx (main Firebase config)
```

### **Configuration Files**

```
✅ KEEP: firebase.json
✅ KEEP: firestore.rules
✅ KEEP: storage.rules
✅ KEEP: .firebaserc
✅ KEEP: next.config.js
✅ KEEP: package.json
✅ KEEP: tsconfig.json
✅ KEEP: tailwind.config.js
✅ KEEP: postcss.config.mjs
✅ KEEP: eslint.config.mjs
✅ KEEP: components.json
```

### **Public Assets**

```
✅ KEEP: public/ (images, sounds, etc.)
✅ KEEP: src/app/globals.css
✅ KEEP: src/app/favicon.ico
```

## 🚀 **Cleanup Commands**

### **1. Delete Unnecessary Files**

```bash
# Delete development files
rm cleanup-console.js
rm cleanup-console-advanced.js
rm PRODUCTION-CLEANUP.md
rm setup-env.md
rm CLEANUP-FILES.md

# Delete test pages
rm -rf src/app/test-firebase/
rm -rf src/app/test-storage/

# Delete test files
rm -rf src/components/__tests__/

# Delete duplicate Firebase config
rm -rf src/firebase/

# Delete duplicate config files
rm next.config.ts
rm src/app/global.css

# Delete development scripts
rm -rf scripts/

# Delete Jest config (if not using tests)
rm jest.config.js
rm jest.setup.js
```

### **2. Fix Firebase Imports**

```bash
# Update imports in these files:
# src/hooks/useRestaurantData.ts
# src/hooks/useOrderData.ts
# src/hooks/useOrderStatus.ts
# src/hooks/useGlobalOrderListener.ts
```

### **3. Build and Test**

```bash
npm run build
npm run start
```

## 📊 **Expected Results After Cleanup**

- **Reduced bundle size** by removing test files and duplicates
- **Cleaner codebase** without development artifacts
- **Better performance** with optimized imports
- **Production-ready** application structure

## ⚠️ **Important Notes**

1. **Backup before cleanup**: Make sure you have a git backup
2. **Test thoroughly**: After cleanup, test all functionality
3. **Environment variables**: Ensure all production env vars are set
4. **Firebase deployment**: Deploy updated rules and functions

## 🎯 **Final Checklist**

- [ ] Delete all unnecessary files
- [ ] Fix Firebase imports
- [ ] Update .gitignore
- [ ] Test application thoroughly
- [ ] Build for production
- [ ] Deploy to hosting platform
- [ ] Verify all functionality works
