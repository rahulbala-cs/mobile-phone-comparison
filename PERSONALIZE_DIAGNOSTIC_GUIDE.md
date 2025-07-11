# 🔍 Contentstack Personalize Diagnostic System

## Overview

This comprehensive diagnostic system has been created to identify and fix issues with Contentstack Personalize variants not showing on the frontend. The system includes multiple layers of testing and validation to systematically identify the root cause.

## 🚀 Quick Start

### 1. Access the Diagnostic Panel

In development mode, the diagnostic panel is automatically available:

1. Navigate to your homepage (`http://localhost:3000`)
2. Look for the **🔍 Debug** button in the top-right corner
3. Click to open the diagnostic panel
4. **Keyboard shortcut**: `Ctrl+Shift+D`

### 2. Run Initial Diagnostics

1. Click **"🔍 Run Diagnostics"** to start comprehensive testing
2. Wait for all tests to complete (typically 10-30 seconds)
3. Review the **📊 Overview** tab for quick status

## 📋 Diagnostic Tabs Explained

### 📊 Overview Tab
- **Quick status indicators** for all major components
- **Overall health assessment**
- **Action buttons** for common tasks
- **Real-time status updates**

### 📋 Checklist Tab
- **Comprehensive validation checklist** covering all aspects
- **Color-coded results**: ✅ Pass, ❌ Fail, ⚠️ Warning
- **Next steps recommendations**
- **Priority-based issue categorization**

### 🌐 API Tests Tab
- **Direct API connectivity testing**
- **Manifest validation** (experiences, variants, audiences)
- **User evaluation testing**
- **Content type variant validation**

### 🔧 SDK Status Tab
- **Real-time SDK state monitoring**
- **Method availability validation**
- **Experience and variant tracking**

### 📄 Content Tab
- **Side-by-side content comparison** (default vs variant)
- **Content structure analysis**
- **Difference highlighting**

### 👥 Audience Tab
- **User attribute test scenarios**
- **Audience matching validation**
- **Behavioral targeting tests**

### 📝 Logs Tab
- **Real-time diagnostic activity logs**
- **Error tracking and debugging**
- **Event timeline**

## 🔧 Common Issues and Solutions

### Issue 1: No Experiences Found

**Symptoms:**
- ✅ API connectivity works
- ❌ Experience count: 0
- ⚠️ No variant aliases

**Solutions:**
1. Check Contentstack Personalize dashboard
2. Ensure experiences are **published** and **active**
3. Verify project UID is correct
4. Check environment configuration

### Issue 2: Experiences Found but No Variants

**Symptoms:**
- ✅ Experiences found
- ❌ Variant aliases: 0
- ⚠️ Audience matching may be failing

**Solutions:**
1. Review **Audience** tab test results
2. Check audience criteria in CMS
3. Test with different user attributes
4. Verify audience rules match expected user behavior

### Issue 3: Variants Found but Content Identical

**Symptoms:**
- ✅ Variant aliases present
- ⚠️ Content comparison shows no differences
- Content fetching may be incorrect

**Solutions:**
1. Check **Content** tab for differences
2. Verify variant content is configured in CMS
3. Ensure variants have different content values
4. Check content fetching implementation

### Issue 4: API Connectivity Issues

**Symptoms:**
- ❌ API connectivity failed
- Network or configuration errors

**Solutions:**
1. Verify `REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID`
2. Check `REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL`
3. Verify network connectivity
4. Check for firewall or proxy issues

## 🛠️ Testing User Attribute Scenarios

The system includes pre-built test scenarios:

### Test Cases Available:
1. **Basic Demographics** - Age, gender, location
2. **Mobile User** - Device-specific targeting
3. **High-Value Customer** - Premium preferences
4. **Budget Conscious** - Price-sensitive users
5. **First-Time Visitor** - New user experience
6. **Geographic Targeting** - Location-based rules
7. **Behavioral Targeting** - Usage pattern based
8. **Empty Attributes** - Default fallback behavior

### Running Attribute Tests:
1. Go to **👥 Audience** tab
2. Click **"👤 Test User Attributes"** in Overview
3. Review individual test results
4. Check accuracy percentage
5. Identify which scenarios fail

## 📊 Understanding Validation Results

### Status Indicators:
- **✅ PASS**: Working correctly
- **❌ FAIL**: Critical issue requiring attention
- **⚠️ WARNING**: Working but could be improved
- **⏭️ SKIP**: Test skipped due to prerequisites

### Priority Levels:
- **🚨 CRITICAL**: Must fix immediately
- **🔴 HIGH**: Important issues affecting functionality
- **🟡 MEDIUM**: Performance or optimization improvements
- **🔵 LOW**: Minor enhancements

## 🔄 Automated Testing

### Auto-refresh Mode:
- Toggle **"Auto-refresh (10s)"** for continuous monitoring
- Useful for real-time debugging
- Monitors changes as you modify configuration

### Manual Testing:
- Use **"🔍 Run Diagnostics"** for full comprehensive testing
- Use **"👤 Test User Attributes"** for audience-specific testing

## 💡 Best Practices

### For Developers:
1. **Always run diagnostics first** before investigating code
2. **Check API layer** before assuming frontend issues
3. **Use content comparison** to verify variant differences
4. **Test multiple user scenarios** to understand audience matching

### For Content Managers:
1. **Verify experiences are published** and active
2. **Check audience criteria** match expected user behavior
3. **Ensure variant content** is actually different from default
4. **Test with realistic user attributes**

## 🚨 Troubleshooting Workflow

Follow this systematic approach:

### Step 1: Configuration Validation
```bash
✅ Check environment variables
✅ Verify project UID
✅ Confirm API endpoints
```

### Step 2: API Infrastructure Testing
```bash
✅ Test API connectivity
✅ Validate manifest loading
✅ Check user evaluation API
```

### Step 3: SDK Functionality Testing
```bash
✅ Verify SDK initialization
✅ Check method availability
✅ Validate experience loading
```

### Step 4: Content and Audience Testing
```bash
✅ Compare content versions
✅ Test user attribute scenarios
✅ Validate audience matching
```

### Step 5: Apply Targeted Fixes
```bash
✅ Address critical issues first
✅ Fix high-priority problems
✅ Optimize based on warnings
```

## 📈 Performance Monitoring

### Key Metrics to Watch:
- **API Response Times**: Should be < 500ms
- **User Attribute Propagation**: ~1-2 seconds
- **Content Fetch Time**: Should be reasonable
- **Audience Matching Accuracy**: Target > 80%

### Success Indicators:
- ✅ All critical checks pass
- ✅ Variant aliases present when expected
- ✅ Content differences detected
- ✅ High audience matching accuracy

## 🔮 Next Steps

After running diagnostics:

1. **Address Critical Issues**: Fix any red/critical items first
2. **Implement Recommendations**: Follow specific guidance provided
3. **Test in Production**: Validate fixes in production environment
4. **Monitor Ongoing**: Set up regular diagnostic checks
5. **Optimize Performance**: Address warnings for better performance

## 📞 Support

If diagnostics don't resolve your issue:

1. **Export diagnostic results** from the Raw Data sections
2. **Check Contentstack Personalize documentation**
3. **Contact Contentstack support** with diagnostic data
4. **Review implementation** against official patterns

---

**Remember**: This diagnostic system provides comprehensive insights into why personalization variants may not be showing. Use it systematically to identify and resolve issues quickly and effectively.