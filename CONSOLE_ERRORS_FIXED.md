# Console Errors Fixed - Live Preview Implementation

## 🚨 Issues Identified and Resolved

### 1. **Multiple SDK Initializations**
**Problem:** Live Preview SDK was being initialized multiple times causing duplicate logs
**Solution:** 
- Created centralized `LivePreviewManager` singleton
- Implemented global initialization state tracking
- Added initialization promise to prevent race conditions

### 2. **Infinite Re-renders and API Calls**
**Problem:** Circular dependencies in `useContentstackData` hook causing infinite loops
**Solution:**
- Removed problematic dependencies from useCallback arrays
- Implemented proper ref-based state management
- Added request debouncing and abort controllers

### 3. **Duplicate React Keys**
**Problem:** `Encountered two children with the same key` error in MobilePhoneDetail
**Solution:**
- Changed key from `image.uid` to `${image.uid}-${index}` to ensure uniqueness
- Fixed in `MobilePhoneDetail.tsx:169`

### 4. **Invalid DOM Props**
**Problem:** `React does not recognize the ACL prop on a DOM element`
**Solution:**
- Updated `getEditAttributes` function to filter out invalid DOM properties
- Only pass valid props: `data-cslp`, `className`, `style`
- Fixed in `src/types/LivePreview.ts`

### 5. **Console Logging Spam**
**Problem:** Preview mode detection logging on every call
**Solution:**
- Implemented caching mechanism in `isPreviewMode()` 
- Reduced logging frequency to once every 5 seconds
- Fixed in `src/utils/livePreview.ts`

## ✅ **Improvements Made**

### **Centralized Live Preview Management**
- **File:** `src/utils/livePreviewManager.ts`
- **Features:**
  - Singleton pattern preventing multiple SDK initializations
  - Centralized callback management
  - Global edit button CSS injection
  - Proper cleanup and error handling

### **Enhanced Visual Builder Support**
- **Improved Edit Button Visibility:**
  ```css
  .cs-edit-button {
    z-index: 999999 !important;
    opacity: 1 !important;
    visibility: visible !important;
    display: block !important;
    pointer-events: auto !important;
  }
  
  [data-cslp]:hover::before {
    content: '';
    border: 2px dashed #007bff;
    opacity: 1;
  }
  ```

### **Development Debugging Tools**
- **File:** `src/components/LivePreviewDebugger.tsx`
- **Features:**
  - Real-time Live Preview status monitoring
  - Edit button and editable element counts
  - Visual indicator for Live Preview health
  - Development-only component (not included in production)

### **Type Safety Improvements**
- **Enhanced Type System:**
  - Proper union types for editable fields
  - Type guards for safe field access
  - Filtered edit attributes for DOM compatibility

### **Performance Optimizations**
- **Reduced API Calls:**
  - Request deduplication and caching
  - Abort controller for cancelled requests
  - Proper dependency management in hooks

- **Memory Leak Prevention:**
  - Proper cleanup functions
  - Callback unregistration
  - SDK state management

## 🔧 **Configuration Updates**

### **Environment Variables**
Updated `.env.example` with comprehensive Live Preview configuration:
```env
# Live Preview Configuration
REACT_APP_CONTENTSTACK_LIVE_PREVIEW=true
REACT_APP_CONTENTSTACK_PREVIEW_TOKEN=your_preview_token_here
REACT_APP_CONTENTSTACK_LIVE_EDIT_TAGS=true
```

### **App-Level Initialization**
- Added global Live Preview initialization in `App.tsx`
- Proper error boundary integration
- Development debugging tools integration

## 🎯 **Expected Results**

After these fixes, you should see:

1. **✅ No more duplicate console logs**
2. **✅ No more React key warnings**
3. **✅ No more invalid DOM prop warnings**
4. **✅ Edit icons visible on hover over editable elements**
5. **✅ Proper Visual Builder integration**
6. **✅ Single SDK initialization per page load**
7. **✅ Proper cleanup and memory management**

## 🐛 **Testing Live Preview**

### **Development Mode:**
1. Set `REACT_APP_CONTENTSTACK_LIVE_PREVIEW=true` in `.env`
2. Look for green debug button (🔧) in top-right corner
3. Click debug button to see Live Preview status
4. Hover over content to see edit outlines
5. Edit buttons should appear on hover

### **Visual Builder Mode:**
1. Access your content through Contentstack's Visual Builder
2. Content should load in iframe with edit capabilities
3. All editable fields should show edit icons on hover
4. Real-time updates should work seamlessly

## 📝 **Key Files Modified**

1. `src/utils/livePreviewManager.ts` - **NEW** Centralized manager
2. `src/hooks/useLivePreview.ts` - Fixed multiple initializations
3. `src/hooks/useContentstackData.ts` - Fixed infinite loops
4. `src/components/MobilePhoneDetail.tsx` - Fixed React keys
5. `src/types/LivePreview.ts` - Fixed DOM props filtering
6. `src/components/LivePreviewDebugger.tsx` - **NEW** Debug tools
7. `src/App.tsx` - Added global initialization
8. `src/utils/livePreview.ts` - Reduced console spam

The Live Preview implementation is now production-ready with proper error handling, performance optimization, and debugging capabilities.