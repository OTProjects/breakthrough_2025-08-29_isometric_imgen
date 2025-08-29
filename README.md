# Gemini 2.5 Flash Image Landing Page

A minimal React/Next.js landing page that integrates with Google's new **Gemini 2.5 Flash Image** model to transform landmarks into isometric artworks.

## References

- [Introducing Gemini 2.5 Flash Image (nano-banana)](https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/)
- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

## Features

- **Dual Input Methods**: Upload images or provide URLs
- **Style Customization**: Specify artistic styles (cyberpunk, Art Deco, minimalist, etc.)
- **Isometric Transformation**: Converts landmarks into isometric building representations
- **Real-time Preview**: Clean, responsive UI with loading states
- **Error Handling**: User-friendly error messages and validation

## Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001)

## API Integration Setup

Currently configured to use the real Gemini 2.5 Flash Image API. **Note: This API has usage quotas and may require billing setup for heavy usage.**

### 1. Get Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini API
3. Copy your API key

### 2. Environment Configuration

Create a `.env.local` file:

```bash
GEMINI_API_KEY=your_api_key_here
```

### 3. Update the Code

In `src/app/page.tsx`, replace the placeholder with the actual API integration. The API endpoint format is:

```javascript
// Direct REST API approach for image generation
const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-goog-api-key': process.env.GEMINI_API_KEY
  },
  body: JSON.stringify({
    contents: [{
      parts: [
        { text: prompt },
        // Add image data here for image input
      ]
    }]
  })
});
```

### 4. Image Input Format

For image uploads, convert to base64 and include in the request:

```javascript
// For uploaded files
{
  parts: [
    { text: prompt },
    { 
      inline_data: { 
        mime_type: imageFile.type, 
        data: base64ImageData 
      } 
    }
  ]
}
```

## Current Implementation Status

✅ **Complete UI Components**
- Toggle input (Upload vs URL)
- File upload with drag-and-drop styling  
- URL input field
- Style input with helpful placeholders
- Gradient submit button with loading states
- Generated image display area
- Error handling UI

✅ **Placeholder API Integration**
- Simulated 2-second API call
- Console logging for debugging
- Error handling structure
- File-to-base64 conversion helper

🔄 **Ready for Real API**
- REST API endpoint structure
- Environment variable setup
- Image data formatting

## Usage

1. Choose input method (Upload Image or Landmark URL)
2. Provide your landmark image
3. Specify desired artistic style
4. Click "Show me the magic ✨"
5. View your transformed isometric landmark

## Technical Notes

- **Framework**: Next.js 15.5+ with Turbopack
- **Styling**: Tailwind CSS
- **State Management**: React useState hooks
- **Image Handling**: FileReader API for base64 conversion
- **API Model**: Gemini 2.5 Flash Image Preview (nano-banana)

The prompt sent to Gemini is:
> "Take this location and make the landmark an isometric image (building only) in the style of [user_style_input]."

## API Limitations

**Important Notes:**
- The Gemini 2.5 Flash Image API has usage quotas
- Free tier: Limited requests per day/minute
- Cost: ~$0.039 per generated image (1290 tokens × $30/1M tokens)
- If you hit quota limits, you'll see "RESOURCE_EXHAUSTED" errors
- You may need to enable billing in Google Cloud Console for production use

## Troubleshooting

**Quota Exceeded Error:**
1. Wait and try again later (quotas reset)
2. Check your [Google Cloud Console quotas](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
3. Enable billing for higher limits
4. Use a different API key if available
