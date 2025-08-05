#!/usr/bin/env node

/**
 * Edit Tags Testing Script
 * Tests if all CMS content fields have proper data-cslp attributes
 */

const fs = require('fs');
const path = require('path');

// Get all TSX files
function getTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      getTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Check for potential missing edit tags
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  // Skip test files and non-component files
  if (filePath.includes('.test.') || filePath.includes('index.tsx')) {
    return issues;
  }
  
  // Check if file imports getEditAttributes
  const hasGetEditAttributes = content.includes('getEditAttributes');
  
  if (!hasGetEditAttributes) {
    // Check if file has dynamic content that might need edit tags
    const hasDisplayContent = content.match(/\{[^}]*\.(title|name|description|value|label)\}/g);
    if (hasDisplayContent) {
      issues.push({
        type: 'MISSING_IMPORT',
        line: 1,
        content: 'File displays dynamic content but missing getEditAttributes import',
        suggestions: hasDisplayContent
      });
    }
    return issues;
  }
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Look for display patterns that might need edit tags
    const patterns = [
      /\{[^}]*\.(title|name|description|value|label|text)\}/g,
      /\{[^}]*\[.*\]\.(title|name|description|value|label|text)\}/g,
      /\{.*\?(.*\.title|.*\.name|.*\.description).*:.*\}/g
    ];
    
    patterns.forEach(pattern => {
      const matches = line.match(pattern);
      if (matches) {
        // Check if line already has getEditAttributes
        if (!line.includes('getEditAttributes') && !line.includes('data-cslp')) {
          // Skip common non-CMS patterns
          if (!line.includes('style=') && 
              !line.includes('className=') && 
              !line.includes('icon') &&
              !line.includes('Icon') &&
              !line.includes('onClick') &&
              !line.includes('key=') &&
              !line.includes('alt=')) {
            issues.push({
              type: 'POTENTIAL_MISSING_EDIT_TAG',
              line: lineNum,
              content: line.trim(),
              matches
            });
          }
        }
      }
    });
  });
  
  return issues;
}

function main() {
  console.log('🔍 Analyzing Edit Tags Coverage...\n');
  
  const srcDir = path.join(__dirname, '../src');
  const tsxFiles = getTsxFiles(srcDir);
  
  console.log(`📋 Found ${tsxFiles.length} TSX files to analyze\n`);
  
  const allIssues = {};
  let totalIssues = 0;
  
  tsxFiles.forEach(filePath => {
    const issues = analyzeFile(filePath);
    if (issues.length > 0) {
      const relativePath = path.relative(path.join(__dirname, '..'), filePath);
      allIssues[relativePath] = issues;
      totalIssues += issues.length;
    }
  });
  
  // Report results
  console.log('📊 EDIT TAGS ANALYSIS RESULTS');
  console.log('===============================\n');
  
  if (totalIssues === 0) {
    console.log('✅ No obvious missing edit tags found!');
    console.log('✅ All components appear to have proper edit tag coverage');
  } else {
    console.log(`⚠️  Found ${totalIssues} potential issues across ${Object.keys(allIssues).length} files:\n`);
    
    Object.entries(allIssues).forEach(([filePath, issues]) => {
      console.log(`📁 ${filePath}:`);
      issues.forEach(issue => {
        console.log(`   ${issue.type === 'MISSING_IMPORT' ? '❌' : '⚠️'} Line ${issue.line}: ${issue.type}`);
        console.log(`      ${issue.content}`);
        if (issue.matches) {
          console.log(`      Matches: ${issue.matches.join(', ')}`);
        }
        if (issue.suggestions) {
          console.log(`      Suggestions: ${issue.suggestions.join(', ')}`);
        }
        console.log();
      });
    });
  }
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('1. Check each identified line manually');
  console.log('2. Add getEditAttributes() to CMS content fields');
  console.log('3. Test Visual Builder functionality');
  console.log('4. Verify edit tags appear in browser DevTools');
}

main();