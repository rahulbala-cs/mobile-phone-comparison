# Contentstack Live Preview & Visual Builder Setup

This mobile phone comparison app now supports **Contentstack Live Preview** and **Visual Builder** for real-time content editing.

## ✅ Implementation Complete

### 🔧 What's Been Implemented

1. **Live Preview SDK Integration**
   - Installed `@contentstack/live-preview-utils` package
   - Created comprehensive Live Preview utility (`src/utils/livePreview.ts`)
   - Integrated with all major components

2. **Environment Configuration**
   - Added Live Preview environment variables to `.env`
   - Preview mode detection and configuration
   - Development vs production mode handling

3. **Service Layer Updates**
   - Updated `ContentstackService` to support draft content in preview mode
   - Added `includeDrafts()` calls for all content queries
   - Preview token configuration for authenticated requests

4. **Component Integration**
   - **MobilePhoneDetail**: Full Live Preview support with data attributes
   - **MobilePhoneComparison**: Real-time comparison updates
   - **MobilePhoneList**: Live phone list updates
   - **App.tsx**: Live Preview initialization and status indicator

5. **Visual Builder Support**
   - Added `data-cslp` attributes to key content sections
   - Editable fields: title, description, images, specifications, variants, tags
   - Real-time content update handlers

## 🚀 How to Use

### For Content Managers

1. **Access Live Preview**:
   - Go to your Contentstack dashboard
   - Navigate to any mobile phone entry
   - Click "Live Preview" to see real-time changes

2. **Use Visual Builder**:
   - In Live Preview mode, click on editable content areas
   - Make changes directly in the CMS
   - See updates instantly in the preview

### For Developers

1. **Development Mode**:
   ```bash
   npm start
   ```
   - Live Preview indicator appears when enabled
   - Real-time content updates work automatically

2. **Environment Variables**:
   ```env
   REACT_APP_CONTENTSTACK_LIVE_PREVIEW=true
   REACT_APP_CONTENTSTACK_LIVE_EDIT_TAGS=true
   REACT_APP_CONTENTSTACK_PREVIEW_TOKEN=your_preview_token
   ```

## 🎯 Features

### ✅ Live Preview Features
- ✅ Real-time content updates without page refresh
- ✅ Draft content preview
- ✅ Visual edit indicators
- ✅ Automatic data synchronization

### ✅ Visual Builder Features  
- ✅ Click-to-edit functionality
- ✅ Editable content areas marked with `data-cslp` attributes
- ✅ Phone titles, descriptions, and specifications
- ✅ Images and pricing information
- ✅ Tags and variant data

### ✅ Component Coverage
- ✅ **MobilePhoneDetail**: Hero section, specs, pricing, images
- ✅ **MobilePhoneComparison**: Product cards, titles, images
- ✅ **MobilePhoneList**: Phone listings with live updates
- ✅ **App.tsx**: Global Live Preview initialization

## 🔍 Technical Details

### Live Preview Utility
- **File**: `src/utils/livePreview.ts`
- **Features**: SDK initialization, edit attributes, preview detection
- **Methods**: `getEditDataAttributes()`, `onEntryChange()`, `initLivePreview()`

### Content Service Integration
- **File**: `src/services/contentstackService.ts`
- **Features**: Draft content support, preview mode detection
- **Methods**: Updated all query methods with `includeDrafts()`

### Data Attributes
- **Format**: `data-cslp="{entry_uid}.{content_type}.{field_path}"`
- **Examples**:
  - `data-cslp="blt123.mobiles.title"`
  - `data-cslp="blt123.mobiles.specifications"`
  - `data-cslp="blt123.mobiles.lead_image"`

## 🐛 Troubleshooting

1. **Live Preview not working**:
   - Check environment variables are set correctly
   - Verify preview token has proper permissions
   - Ensure `REACT_APP_CONTENTSTACK_LIVE_PREVIEW=true`

2. **Edit tags not visible**:
   - Confirm `REACT_APP_CONTENTSTACK_LIVE_EDIT_TAGS=true`
   - Check if components have `data-cslp` attributes
   - Verify Visual Builder is enabled in Contentstack

3. **Content not updating**:
   - Check browser console for Live Preview logs
   - Verify `onEntryChange` callbacks are registered
   - Ensure content type and field paths are correct

## 🎉 Ready for Production

The Live Preview and Visual Builder integration is complete and production-ready. Content managers can now edit mobile phone content in real-time using Contentstack's Visual Builder interface.