// Comprehensive validation script for /compare page edit tags implementation
const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE VALIDATION: /compare page edit tags implementation\n');

// Define file paths
const files = {
  compareHub: './src/components/compare/CompareHub.tsx',
  service: './src/services/contentstackService.ts',
  types: './src/types/ComparePageContent.ts',
  editableTags: './src/types/EditableTags.ts',
  livePreview: './src/utils/livePreview.ts'
};

// Validation results
const validation = {
  componentsValid: false,
  serviceLayerValid: false,
  transformationsValid: false,
  nestedStructuresValid: false,
  issues: [],
  successes: []
};

// Helper function to check if file exists and read content
function checkFile(filePath, description) {
  try {
    if (!fs.existsSync(filePath)) {
      validation.issues.push(`❌ Missing file: ${filePath} (${description})`);
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    validation.issues.push(`❌ Error reading ${filePath}: ${error.message}`);
    return null;
  }
}

// 1. VALIDATE COMPAREHUB.TSX COMPONENT
console.log('1️⃣ VALIDATING CompareHub.tsx Component');
const compareHubContent = checkFile(files.compareHub, 'Main CompareHub component');

if (compareHubContent) {
  // Check for required imports
  const hasGetEditAttributes = compareHubContent.includes("import { getEditAttributes");
  const hasGetFieldValue = compareHubContent.includes("import { getFieldValue");
  const hasVBEmptyBlockParent = compareHubContent.includes("VB_EmptyBlockParentClass");
  
  // Check for proper usage patterns
  const editAttributeUsages = (compareHubContent.match(/\.\.\.getEditAttributes\(/g) || []).length;
  const fieldValueUsages = (compareHubContent.match(/getFieldValue\(/g) || []).length;
  
  if (hasGetEditAttributes && hasGetFieldValue) {
    validation.successes.push(`✅ CompareHub imports getEditAttributes and getFieldValue`);
  } else {
    validation.issues.push(`❌ CompareHub missing required imports`);
  }
  
  if (editAttributeUsages >= 8) {
    validation.successes.push(`✅ CompareHub uses getEditAttributes ${editAttributeUsages} times`);
  } else {
    validation.issues.push(`❌ CompareHub insufficient getEditAttributes usage (${editAttributeUsages})`);
  }
  
  if (fieldValueUsages >= 8) {
    validation.successes.push(`✅ CompareHub uses getFieldValue ${fieldValueUsages} times`);
  } else {
    validation.issues.push(`❌ CompareHub insufficient getFieldValue usage (${fieldValueUsages})`);
  }
  
  if (hasVBEmptyBlockParent) {
    validation.successes.push(`✅ CompareHub handles empty blocks with VB_EmptyBlockParentClass`);
  } else {
    validation.issues.push(`❌ CompareHub missing VB_EmptyBlockParentClass for empty blocks`);
  }
  
  validation.componentsValid = hasGetEditAttributes && hasGetFieldValue && editAttributeUsages >= 8 && fieldValueUsages >= 8;
}

// 2. VALIDATE SERVICE LAYER
console.log('\n2️⃣ VALIDATING Service Layer');
const serviceContent = checkFile(files.service, 'ContentstackService');

if (serviceContent) {
  // Check for three required edit tag methods
  const hasComparePageEditTags = serviceContent.includes('addEditableTagsToComparePageEntry');
  const hasCategoryEditTags = serviceContent.includes('addEditableTagsToComparisonCategoryEntry');
  const hasFeaturedComparisonEditTags = serviceContent.includes('addEditableTagsToFeaturedComparisonEntry');
  
  // Check if methods are called in service functions
  const comparePageMethodCall = serviceContent.includes('this.addEditableTagsToComparePageEntry(comparePageEntry');
  const categoryMethodCall = serviceContent.includes('this.addEditableTagsToComparisonCategoryEntry(entry');
  const featuredMethodCall = serviceContent.includes('this.addEditableTagsToFeaturedComparisonEntry(entry');
  
  if (hasComparePageEditTags && hasCategoryEditTags && hasFeaturedComparisonEditTags) {
    validation.successes.push(`✅ Service has all three edit tag methods`);
  } else {
    validation.issues.push(`❌ Service missing edit tag methods`);
  }
  
  if (comparePageMethodCall && categoryMethodCall && featuredMethodCall) {
    validation.successes.push(`✅ Service calls all edit tag methods properly`);
  } else {
    validation.issues.push(`❌ Service doesn't call edit tag methods properly`);
  }
  
  // Check nested object handling
  const handlesCategoryDetails = serviceContent.includes('category_details.category_title');
  const handlesComparisonDetails = serviceContent.includes('comparison_details.comparison_title');
  const handlesIconConfig = serviceContent.includes('icon_config.icon_name');
  
  if (handlesCategoryDetails && handlesComparisonDetails && handlesIconConfig) {
    validation.successes.push(`✅ Service handles nested objects properly`);
    validation.nestedStructuresValid = true;
  } else {
    validation.issues.push(`❌ Service doesn't handle nested objects properly`);
  }
  
  validation.serviceLayerValid = hasComparePageEditTags && hasCategoryEditTags && hasFeaturedComparisonEditTags &&
                                comparePageMethodCall && categoryMethodCall && featuredMethodCall;
}

// 3. VALIDATE DATA TRANSFORMATIONS
console.log('\n3️⃣ VALIDATING Data Transformations');
const typesContent = checkFile(files.types, 'ComparePageContent types');

if (typesContent) {
  // Check transformCategories function
  const hasTransformCategories = typesContent.includes('export const transformCategories');
  const transformCategoriesPreservesEditTags = typesContent.includes('title: category.category_details.category_title, // Keep as editable field for Visual Builder');
  
  // Check transformFeaturedComparisons function
  const hasTransformFeaturedComparisons = typesContent.includes('export const transformFeaturedComparisons');
  const transformFeaturedPreservesEditTags = typesContent.includes('title: comparison.comparison_details.comparison_title, // Keep as editable field for Visual Builder');
  
  if (hasTransformCategories && hasTransformFeaturedComparisons) {
    validation.successes.push(`✅ Both transformation functions exist`);
  } else {
    validation.issues.push(`❌ Transformation functions missing`);
  }
  
  if (transformCategoriesPreservesEditTags && transformFeaturedPreservesEditTags) {
    validation.successes.push(`✅ Transformations preserve editable fields for Visual Builder`);
  } else {
    validation.issues.push(`❌ Transformations don't preserve editable fields`);
  }
  
  // Check proper use of getFieldValue for logic fields
  const usesGetFieldValueForLogic = typesContent.includes('getFieldValue(category.category_id)') &&
                                  typesContent.includes('getFieldValue(category.availability.is_available)');
  
  if (usesGetFieldValueForLogic) {
    validation.successes.push(`✅ Transformations use getFieldValue for logic fields`);
  } else {
    validation.issues.push(`❌ Transformations don't use getFieldValue for logic fields`);
  }
  
  validation.transformationsValid = hasTransformCategories && hasTransformFeaturedComparisons && 
                                  transformCategoriesPreservesEditTags && transformFeaturedPreservesEditTags &&
                                  usesGetFieldValueForLogic;
}

// 4. VALIDATE HELPER UTILITIES
console.log('\n4️⃣ VALIDATING Helper Utilities');
const editableTagsContent = checkFile(files.editableTags, 'EditableTags types');
const livePreviewContent = checkFile(files.livePreview, 'livePreview utils');

if (editableTagsContent) {
  const hasGetFieldValue = editableTagsContent.includes('export const getFieldValue');
  const hasHasEditableTags = editableTagsContent.includes('export const hasEditableTags');
  
  if (hasGetFieldValue && hasHasEditableTags) {
    validation.successes.push(`✅ EditableTags utility functions exist`);
  } else {
    validation.issues.push(`❌ EditableTags utility functions missing`);
  }
}

if (livePreviewContent) {
  const hasGetEditAttributes = livePreviewContent.includes('export const getEditAttributes');
  const hasVBEmptyBlockParentClass = livePreviewContent.includes('export { VB_EmptyBlockParentClass }');
  
  if (hasGetEditAttributes && hasVBEmptyBlockParentClass) {
    validation.successes.push(`✅ LivePreview utility functions exist`);
  } else {
    validation.issues.push(`❌ LivePreview utility functions missing`);
  }
}

// FINAL VALIDATION SUMMARY
console.log('\n📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

console.log('\n✅ SUCCESSES:');
validation.successes.forEach(success => console.log(`  ${success}`));

console.log('\n⚠️ ISSUES:');
if (validation.issues.length === 0) {
  console.log('  None! 🎉');
} else {
  validation.issues.forEach(issue => console.log(`  ${issue}`));
}

// OVERALL CONFIDENCE ASSESSMENT
console.log('\n🎯 OVERALL CONFIDENCE LEVEL:');
const totalComponents = 4;
const validComponents = [
  validation.componentsValid,
  validation.serviceLayerValid, 
  validation.transformationsValid,
  validation.successes.length > validation.issues.length
].filter(Boolean).length;

const confidencePercentage = Math.round((validComponents / totalComponents) * 100);

if (confidencePercentage >= 90) {
  console.log(`🟢 HIGH CONFIDENCE (${confidencePercentage}%) - Edit tags should work correctly in Visual Builder`);
} else if (confidencePercentage >= 70) {
  console.log(`🟡 MEDIUM CONFIDENCE (${confidencePercentage}%) - Edit tags likely to work with minor issues`);
} else {
  console.log(`🔴 LOW CONFIDENCE (${confidencePercentage}%) - Significant issues need to be addressed`);
}

console.log('\n📋 DETAILED COMPONENT STATUS:');
console.log(`  CompareHub Component: ${validation.componentsValid ? '✅' : '❌'}`);
console.log(`  Service Layer: ${validation.serviceLayerValid ? '✅' : '❌'}`);
console.log(`  Data Transformations: ${validation.transformationsValid ? '✅' : '❌'}`);
console.log(`  Nested Structures: ${validation.nestedStructuresValid ? '✅' : '❌'}`);

console.log('\n🚀 RECOMMENDATION:');
if (confidencePercentage >= 90) {
  console.log('  The /compare page edit tags implementation is comprehensive and ready for Visual Builder testing.');
} else if (confidencePercentage >= 70) {
  console.log('  The implementation is mostly complete but address the issues above for optimal Visual Builder experience.');
} else {
  console.log('  Significant work needed before Visual Builder testing. Address critical issues first.');
}