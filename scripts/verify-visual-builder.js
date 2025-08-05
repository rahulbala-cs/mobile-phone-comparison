#!/usr/bin/env node

/**
 * Visual Builder Content Type Verification Script
 * Checks and configures all content types for Visual Builder compatibility
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.REACT_APP_CONTENTSTACK_API_KEY;
const MANAGEMENT_TOKEN = process.env.REACT_APP_CONTENTSTACK_MANAGEMENT_TOKEN;
const ENVIRONMENT = process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT;

// Expected content types that should be in Visual Builder
const EXPECTED_CONTENT_TYPES = [
  'home_page',
  'mobiles', 
  'navigation_menu',
  'compare_page_builder',
  'comparison_category',
  'featured_comparison',
  'hero_phone_showcase',
  'phone_comparison_spec'
];

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error (${res.statusCode}): ${parsed.error_message || body}`));
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${e.message}, Body: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

async function getContentTypes() {
  console.log('📋 Fetching existing content types...');
  
  const options = {
    hostname: 'api.contentstack.io',
    path: `/v3/content_types`,
    method: 'GET',
    headers: {
      'api_key': API_KEY,
      'authorization': MANAGEMENT_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    return response.content_types || [];
  } catch (error) {
    console.error('❌ Error fetching content types:', error.message);
    return [];
  }
}

async function checkVisualBuilderConfig(contentTypeUid) {
  console.log(`🔍 Checking Visual Builder config for: ${contentTypeUid}`);
  
  const options = {
    hostname: 'api.contentstack.io',
    path: `/v3/content_types/${contentTypeUid}`,
    method: 'GET',
    headers: {
      'api_key': API_KEY,
      'authorization': MANAGEMENT_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    const contentType = response.content_type;
    
    // Check if Visual Builder is enabled
    const isVisualBuilderEnabled = contentType.options?.page || false;
    
    return {
      uid: contentTypeUid,
      title: contentType.title,
      isVisualBuilderEnabled,
      options: contentType.options || {}
    };
  } catch (error) {
    console.error(`❌ Error checking ${contentTypeUid}:`, error.message);
    return {
      uid: contentTypeUid,
      title: 'Unknown',
      isVisualBuilderEnabled: false,
      error: error.message
    };
  }
}

async function enableVisualBuilder(contentTypeUid) {
  console.log(`🔧 Enabling Visual Builder for: ${contentTypeUid}`);
  
  // First get the current content type
  const getOptions = {
    hostname: 'api.contentstack.io', 
    path: `/v3/content_types/${contentTypeUid}`,
    method: 'GET',
    headers: {
      'api_key': API_KEY,
      'authorization': MANAGEMENT_TOKEN,
      'Content-Type': 'application/json'
    }
  };

  try {
    const getResponse = await makeRequest(getOptions);
    const contentType = getResponse.content_type;
    
    // Update the content type to enable Visual Builder
    const updatedContentType = {
      ...contentType,
      options: {
        ...contentType.options,
        page: true, // Enable Visual Builder
        is_page: true // Additional flag for page content types
      }
    };

    const updateOptions = {
      hostname: 'api.contentstack.io',
      path: `/v3/content_types/${contentTypeUid}`,
      method: 'PUT',
      headers: {
        'api_key': API_KEY,
        'authorization': MANAGEMENT_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const updateResponse = await makeRequest(updateOptions, {
      content_type: updatedContentType
    });

    console.log(`✅ Successfully enabled Visual Builder for: ${contentTypeUid}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enabling Visual Builder for ${contentTypeUid}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Visual Builder Content Type Verification\n');
  
  if (!API_KEY || !MANAGEMENT_TOKEN) {
    console.error('❌ Missing required environment variables:');
    console.error('   - REACT_APP_CONTENTSTACK_API_KEY');
    console.error('   - REACT_APP_CONTENTSTACK_MANAGEMENT_TOKEN');
    process.exit(1);
  }

  console.log(`📝 Stack: ${API_KEY}`);
  console.log(`🌍 Environment: ${ENVIRONMENT}\n`);

  // Get all content types
  const contentTypes = await getContentTypes();
  console.log(`📋 Found ${contentTypes.length} content types\n`);

  // Check Visual Builder configuration for expected content types
  const results = [];
  
  for (const expectedType of EXPECTED_CONTENT_TYPES) {
    const exists = contentTypes.find(ct => ct.uid === expectedType);
    
    if (!exists) {
      console.log(`⚠️  Content type '${expectedType}' not found - skipping`);
      results.push({
        uid: expectedType,
        exists: false,
        isVisualBuilderEnabled: false
      });
      continue;
    }

    const config = await checkVisualBuilderConfig(expectedType);
    results.push({
      ...config,
      exists: true
    });
  }

  // Summary report
  console.log('\n📊 VISUAL BUILDER STATUS REPORT');
  console.log('=====================================\n');

  const needsUpdate = [];
  
  results.forEach(result => {
    if (!result.exists) {
      console.log(`❌ ${result.uid} - Content type does not exist`);
    } else if (result.error) {
      console.log(`❌ ${result.uid} - Error: ${result.error}`);
    } else if (result.isVisualBuilderEnabled) {
      console.log(`✅ ${result.uid} - Visual Builder enabled`);
    } else {
      console.log(`⚠️  ${result.uid} - Visual Builder disabled`);
      needsUpdate.push(result.uid);
    }
  });

  // Enable Visual Builder for content types that need it
  if (needsUpdate.length > 0) {
    console.log(`\n🔧 Enabling Visual Builder for ${needsUpdate.length} content types...\n`);
    
    for (const contentTypeUid of needsUpdate) {
      await enableVisualBuilder(contentTypeUid);
    }
    
    console.log('\n✅ Visual Builder configuration complete!');
  } else {
    console.log('\n✅ All content types already have Visual Builder enabled!');
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Test Visual Builder in Contentstack dashboard');
  console.log('2. Verify edit tags are visible on website');
  console.log('3. Test real-time editing functionality');
}

main().catch(console.error);