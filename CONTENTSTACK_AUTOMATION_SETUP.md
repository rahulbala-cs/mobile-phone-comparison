# Contentstack Automation Hub Setup for Quick Summarize Feature

## Overview

This guide walks you through setting up the Contentstack Automation Hub to enable the "Quick Summarize" feature for phone comparisons. The feature uses HTTP triggers to process phone comparison data and generate AI-powered summaries.

## Prerequisites

- Contentstack account with Automation Hub access
- Access to AI service (OpenAI, Claude, or similar)
- React application with phone comparison functionality

## Step 1: Configure HTTP Trigger

1. **Login to Contentstack**
   - Navigate to your Contentstack dashboard
   - Access the Automation Hub from the left sidebar

2. **Create New Automation**
   - Click "+ New Automation"
   - Name: "Phone Comparison Summarizer"
   - Description: "Generates AI-powered summaries for phone comparisons"

3. **Configure HTTP Trigger**
   - Select "HTTP" connector
   - Choose "HTTP Request Trigger"
   - Method: `POST`
   - Enable "Secure HTTP Trigger": `true`
   - Auth Key: `ah-http-key`
   - Auth Value: `U4)arzhjy` (your provided key)

4. **Test the Trigger**
   - Copy the generated webhook URL
   - Test with a sample POST request
   - Verify the trigger responds correctly

## Step 2: Set up AI Processing Action

1. **Add HTTP Action**
   - Click "Add Action"
   - Select "HTTP" connector
   - Choose "HTTP Request Action"

2. **Configure AI Service Integration**
   ```json
   {
     "url": "https://api.openai.com/v1/chat/completions",
     "method": "POST",
     "headers": {
       "Content-Type": "application/json",
       "Authorization": "Bearer YOUR_OPENAI_API_KEY"
     },
     "body": {
       "model": "gpt-4",
       "messages": [
         {
           "role": "system",
           "content": "You are a mobile phone comparison expert. Analyze phone specifications and provide concise, helpful summaries for decision-making."
         },
         {
           "role": "user",
           "content": "Compare these phones: {{trigger.data.phones}} and provide a summary with key differences, pros/cons, and recommendation."
         }
       ],
       "max_tokens": 1000,
       "temperature": 0.7
     }
   }
   ```

3. **Alternative: Claude AI Integration**
   ```json
   {
     "url": "https://api.anthropic.com/v1/messages",
     "method": "POST",
     "headers": {
       "Content-Type": "application/json",
       "Authorization": "Bearer YOUR_CLAUDE_API_KEY",
       "anthropic-version": "2023-06-01"
     },
     "body": {
       "model": "claude-3-sonnet-20240229",
       "max_tokens": 1000,
       "messages": [
         {
           "role": "user",
           "content": "Compare these phones and provide a detailed summary: {{trigger.data.phones}}"
         }
       ]
     }
   }
   ```

## Step 3: Configure Response Processing

1. **Add Response Transformation**
   - Map AI response to expected format
   - Handle error cases and fallbacks
   - Return structured JSON response

2. **Expected Response Format**
   ```json
   {
     "summary": "Brief comparison overview",
     "keyDifferences": [
       "RAM varies from 8GB to 12GB",
       "Storage options: 128GB, 256GB, 512GB",
       "Price difference: ₹25,000"
     ],
     "recommendation": {
       "winner": "iPhone 16 Pro",
       "reason": "Best overall value with excellent camera and performance",
       "score": 85
     },
     "prosAndCons": {
       "iPhone 16 Pro": {
         "pros": ["Excellent camera", "Fast performance", "Long battery life"],
         "cons": ["Premium pricing", "Limited storage options"]
       },
       "Samsung Galaxy S24 Ultra": {
         "pros": ["S-Pen support", "Large display", "Versatile cameras"],
         "cons": ["Heavy weight", "Complex UI"]
       }
     }
   }
   ```

## Step 4: Environment Configuration

1. **Update .env file**
   ```bash
   # Add to your .env file
   REACT_APP_CONTENTSTACK_WEBHOOK_URL=https://your-webhook-url-from-automation-hub.com
   ```

2. **Webhook URL Format**
   - The URL will be provided by Contentstack Automation Hub
   - Example: `https://automate.contentstack.com/webhooks/trigger/your-trigger-id`

## Step 5: Test the Integration

1. **Frontend Testing**
   - Select 2+ phones for comparison
   - Click "Quick Summarize" button
   - Verify loading state and response

2. **Backend Testing**
   - Test webhook endpoint directly
   - Verify AI service integration
   - Check response format and error handling

## Step 6: Optimization and Monitoring

1. **Performance Optimization**
   - Implement response caching
   - Add request rate limiting
   - Optimize AI prompt engineering

2. **Error Handling**
   - Implement retry logic
   - Add fallback to local processing
   - Log errors for debugging

3. **Monitoring**
   - Track webhook performance
   - Monitor AI service usage
   - Collect user feedback

## Troubleshooting

### Common Issues

1. **Webhook Not Triggering**
   - Check HTTP trigger configuration
   - Verify auth key in headers
   - Ensure proper request format

2. **AI Service Errors**
   - Verify API key configuration
   - Check service availability
   - Review request/response format

3. **Response Format Issues**
   - Validate JSON structure
   - Check field mapping
   - Test with sample data

### Testing Commands

```bash
# Test webhook endpoint
curl -X POST https://your-webhook-url.com \
  -H "Content-Type: application/json" \
  -H "ah-http-key: U4)arzhjy" \
  -d '{
    "action": "generate_summary",
    "data": {
      "phones": [
        {
          "name": "iPhone 16 Pro",
          "specifications": {"ram": "8GB", "storage": "256GB"},
          "price": 120000
        },
        {
          "name": "Samsung Galaxy S24 Ultra",
          "specifications": {"ram": "12GB", "storage": "512GB"},
          "price": 145000
        }
      ]
    }
  }'

# Test React application
npm start
# Navigate to comparison page
# Add 2+ phones and click "Quick Summarize"
```

## Security Considerations

1. **API Key Management**
   - Store API keys securely
   - Use environment variables
   - Implement key rotation

2. **Request Validation**
   - Validate incoming data
   - Implement rate limiting
   - Add request sanitization

3. **Error Disclosure**
   - Avoid exposing internal errors
   - Log sensitive information securely
   - Implement proper error messages

## Next Steps

1. **Enhanced Features**
   - User preference integration
   - Personalized recommendations
   - Advanced filtering options

2. **Performance Improvements**
   - Caching strategies
   - Batch processing
   - Response optimization

3. **Analytics Integration**
   - User interaction tracking
   - Summary quality metrics
   - Feature usage analytics

This setup provides a robust foundation for AI-powered phone comparison summaries using Contentstack's Automation Hub.