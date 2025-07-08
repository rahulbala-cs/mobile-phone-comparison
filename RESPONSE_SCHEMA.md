# Contentstack Response Schema for Quick Summarize

## Overview

The React app displays **raw JSON** from your Contentstack automation in a formatted modal. You have complete flexibility in designing your response structure.

## Input Request Format (Sent to Contentstack)

```json
{
  "action": "generate_summary",
  "data": {
    "phones": [
      {
        "name": "iPhone 16 Pro",
        "specifications": {
          "ram": "8GB",
          "storage": "256GB", 
          "rear_camera": "48MP",
          "front_camera": "12MP",
          "battery": "4000mAh",
          "cpu": "A18 Pro",
          "weight": "199g",
          "display_resolution": "1290x2796",
          "screen_to_body_ratio": "89.8%"
        },
        "price": 120000,
        "brand": "Apple",
        "images": "https://example.com/iphone.jpg"
      }
    ],
    "userPreferences": {
      "usage": "general"
    }
  }
}
```

## Response Format Options

### Option 1: Simple Summary
**Best for: Quick implementations**

```json
{
  "summary": "iPhone 16 Pro vs Samsung Galaxy S24 Ultra comparison shows significant differences in camera, performance, and pricing.",
  "recommendation": "iPhone 16 Pro",
  "reason": "Better value for money with excellent performance",
  "key_points": [
    "Camera: Samsung has 200MP vs iPhone's 48MP",
    "RAM: Samsung has 12GB vs iPhone's 8GB",
    "Price: Samsung costs ₹25,000 more"
  ]
}
```

### Option 2: Structured Analysis
**Best for: Detailed comparisons**

```json
{
  "analysis": {
    "summary": "Comprehensive comparison of 2 flagship smartphones",
    "phones_analyzed": ["iPhone 16 Pro", "Samsung Galaxy S24 Ultra"],
    "winner": {
      "phone": "iPhone 16 Pro",
      "confidence_score": 85,
      "reasoning": "Superior value proposition with excellent performance"
    },
    "category_winners": {
      "performance": {
        "winner": "Samsung Galaxy S24 Ultra",
        "reason": "12GB RAM vs 8GB, Snapdragon 8 Gen 3"
      },
      "camera": {
        "winner": "Samsung Galaxy S24 Ultra",
        "reason": "200MP main sensor vs 48MP"
      },
      "value_for_money": {
        "winner": "iPhone 16 Pro", 
        "reason": "₹25,000 cheaper with similar core features"
      },
      "design": {
        "winner": "iPhone 16 Pro",
        "reason": "33g lighter (199g vs 232g)"
      }
    },
    "detailed_comparison": {
      "iPhone 16 Pro": {
        "strengths": ["Lighter weight", "Better value", "iOS ecosystem", "Premium build"],
        "weaknesses": ["Lower RAM", "Smaller camera sensor", "Limited customization"]
      },
      "Samsung Galaxy S24 Ultra": {
        "strengths": ["200MP camera", "12GB RAM", "S-Pen support", "Android flexibility"],
        "weaknesses": ["Higher price", "Heavier", "Complex UI"]
      }
    }
  }
}
```

### Option 3: AI Conversational
**Best for: Natural language responses**

```json
{
  "ai_summary": {
    "introduction": "I've analyzed both phones based on specifications, pricing, and user needs.",
    "comparison_overview": "The iPhone 16 Pro and Samsung Galaxy S24 Ultra represent the pinnacle of smartphone technology, each excelling in different areas.",
    "detailed_analysis": {
      "performance": "Both phones deliver flagship performance. The Samsung edges ahead with 12GB RAM vs iPhone's 8GB, making it better for heavy multitasking.",
      "camera_system": "Samsung wins on paper with its 200MP main sensor, but iPhone's computational photography often produces better real-world results.",
      "user_experience": "iPhone offers seamless iOS integration and longer software support, while Samsung provides more customization and the unique S-Pen functionality.",
      "value_proposition": "At ₹25,000 less, the iPhone 16 Pro offers exceptional value without significant compromises."
    },
    "recommendation": {
      "primary_choice": "iPhone 16 Pro",
      "confidence": "High",
      "reasoning": "Unless you specifically need the S-Pen or prefer Android, the iPhone offers better overall value with 95% of the Samsung's capabilities at a significantly lower price.",
      "alternative_scenario": "Choose Samsung if you're an Android user, need the S-Pen for productivity, or want the absolute best camera specs."
    },
    "final_verdict": "Both are excellent phones, but the iPhone 16 Pro wins on value while the Samsung wins on raw specs. Your choice depends on ecosystem preference and budget."
  },
  "metadata": {
    "generated_at": "2025-01-08T10:30:00Z",
    "processing_time": "1.2s",
    "confidence_score": 0.92
  }
}
```

### Option 4: Scoring System
**Best for: Quantitative analysis**

```json
{
  "comparison_report": {
    "overall_scores": {
      "iPhone 16 Pro": {
        "total_score": 85,
        "category_scores": {
          "performance": 82,
          "camera": 78,
          "design": 90,
          "value": 95,
          "ecosystem": 88
        }
      },
      "Samsung Galaxy S24 Ultra": {
        "total_score": 82,
        "category_scores": {
          "performance": 88,
          "camera": 85,
          "design": 75,
          "value": 70,
          "ecosystem": 85
        }
      }
    },
    "winner_analysis": {
      "overall_winner": "iPhone 16 Pro",
      "margin": "3 points",
      "key_deciding_factors": ["Superior value", "Better design", "Lighter weight"]
    },
    "category_breakdown": {
      "performance": "Samsung leads with higher RAM and processing power",
      "camera": "Samsung has better specs, iPhone has better software",
      "design": "iPhone significantly lighter and more premium feel",
      "value": "iPhone costs ₹25,000 less for similar experience",
      "ecosystem": "Tie - depends on user preference"
    }
  }
}
```

## JSON Schema (Technical Specification)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Phone Comparison Response",
  "type": "object",
  "description": "Response schema for Contentstack phone comparison automation",
  "properties": {
    "summary": {
      "type": "string",
      "description": "Brief comparison summary",
      "minLength": 10,
      "maxLength": 500
    },
    "recommendation": {
      "type": "object",
      "properties": {
        "phone": {
          "type": "string",
          "description": "Recommended phone name"
        },
        "confidence_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "description": "Confidence in recommendation (0-100)"
        },
        "reasoning": {
          "type": "string",
          "description": "Why this phone is recommended"
        }
      },
      "required": ["phone", "reasoning"]
    },
    "key_differences": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of key differences between phones"
    },
    "detailed_analysis": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      },
      "description": "Detailed category-wise analysis"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "generated_at": {
          "type": "string",
          "format": "date-time"
        },
        "processing_time": {
          "type": "string"
        },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        }
      }
    }
  },
  "required": ["summary"],
  "additionalProperties": true
}
```

## Testing Examples

### Test Response 1: Basic
```json
{
  "result": "iPhone 16 Pro is recommended over Samsung Galaxy S24 Ultra",
  "reason": "Better value for money",
  "price_difference": "₹25,000 savings"
}
```

### Test Response 2: Error Handling
```json
{
  "error": "Unable to process comparison",
  "message": "Insufficient phone data provided",
  "code": "INVALID_INPUT"
}
```

## Implementation Guidelines

### For Your Contentstack Automation:

1. **Keep it Simple Initially**
   - Start with Option 1 (Simple Summary)
   - Expand to more complex formats as needed

2. **Handle Edge Cases**
   - Return meaningful errors for invalid input
   - Provide fallback responses for missing data

3. **Optimize Response Size**
   - Keep responses under 10KB for fast loading
   - Use concise but informative text

4. **Add Metadata**
   - Include processing time, confidence scores
   - Add timestamps for debugging

### React App Behavior:

- **Displays Raw JSON**: No formatting or processing
- **Syntax Highlighting**: JSON is shown with code highlighting
- **Scrollable**: Long responses are scrollable
- **Responsive**: Works on mobile and desktop

## Curl Test Commands

```bash
# Test with your automation
curl -X POST https://app.contentstack.com/automations-api/run/067f175162f445d18e5e1a522c7f28a8 \
  -H "Content-Type: application/json" \
  -H "ah-http-key: U4)arzhjy" \
  -d '{"action": "generate_summary", "data": {"phones": [{"name": "Test Phone"}]}}'
```

Choose the response format that best fits your use case - the React app will display whatever JSON structure you return!