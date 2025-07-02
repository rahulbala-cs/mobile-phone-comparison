# Mobile Phone Comparison App

A clean, focused React application for displaying mobile phone content from Contentstack CMS. Built specifically for the "Mobile Phone" content type only.

## Features

- **Mobile Phone Display**: Single phone detail view with hero section and specifications
- **Phone Listing**: Grid view of all mobile phones with quick specs
- **Phone Comparison**: Side-by-side comparison of two mobile phones with highlighted differences
- **Smart Selection**: Interactive phone selection with comparison bar
- **Dynamic URLs**: Clean comparison URLs like `/compare/iphone-15-vs-galaxy-s24`
- **Contentstack Integration**: Direct API integration with image optimization
- **SEO Optimized**: Dynamic meta tags using React Helmet
- **Responsive Design**: Mobile-first responsive layout
- **TypeScript**: Full type safety

## Quick Start

### 1. Prerequisites
- Node.js 16+ and npm
- Contentstack account with "mobiles" content type

### 2. Installation
```bash
git clone <repository-url>
cd mobile-phone-comparison
npm install
```

### 3. Configuration
Create `.env` file:
```
REACT_APP_CONTENTSTACK_API_KEY=your_api_key
REACT_APP_CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token
REACT_APP_CONTENTSTACK_ENVIRONMENT=your_environment
REACT_APP_CONTENTSTACK_REGION=US
REACT_APP_MOBILE_PHONE_UID=default_phone_uid
```

### 4. Development
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

## Routes

- `/` - List all mobile phones with comparison selection
- `/compare/{phone1-slug}-vs-{phone2-slug}` - Compare two phones side-by-side (e.g., `/compare/iphone-15-vs-galaxy-s24`)
- `/{entry.url}` - Individual mobile phone pages using the content's URL field (e.g., `/mobiles/iphone-16-pro-max`)

## Content Model

Expected "mobiles" content type fields:
- **title**: Phone name
- **description**: Phone description  
- **url**: URL slug
- **lead_image**: Main product image (Contentstack asset)
- **seo**: SEO object (meta_title, meta_description, keywords, enable_search_indexing)
- **specifications**: Object with display_resolution, screen_to_body_ratio, ram, storage, front_camera, weight, battery
- **taxonomies.brand**: Array of brand taxonomy objects

## Project Structure

```
src/
├── components/
│   ├── MobilePhoneDetail.tsx       # Single phone view
│   ├── MobilePhoneDetail.css
│   ├── MobilePhoneList.tsx         # Phone listing with comparison
│   ├── MobilePhoneList.css
│   ├── MobilePhoneComparison.tsx   # Side-by-side comparison
│   ├── MobilePhoneComparison.css
│   ├── PhoneSelector.tsx           # Phone selection modal
│   └── PhoneSelector.css
├── services/
│   └── contentstackService.ts      # API integration
├── types/
│   └── MobilePhone.ts              # TypeScript interfaces
├── utils/
│   └── urlUtils.ts                 # URL generation helpers
└── App.tsx                         # Main routing
```

## Deployment

### With Contentstack Launch
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Add environment variables
5. Deploy

### Other Platforms
The app builds to static files compatible with any hosting platform.

## Browser Support

- Chrome 90+
- Firefox 88+  
- Safari 14+
- Edge 90+

## Performance Features

- Optimized images with WebP format
- Lazy loading ready
- Responsive image delivery
- Minimal bundle size (focused scope)

## Architecture Notes

This app is intentionally focused **only** on the mobile phone content type. No headers, footers, or other content types are included. This makes it:

- Lightweight and fast
- Easy to maintain
- Perfect for focused mobile phone comparison use cases
- Ready for integration into larger systems

## Development Philosophy

Built as a reference implementation of the Contentstack React starter patterns, but simplified to focus purely on mobile phone content delivery and display.