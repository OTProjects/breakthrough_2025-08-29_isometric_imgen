import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageData, mimeType } = await request.json();
    
    console.log('API Key status:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    console.log('Request data:', { hasImage: !!imageData, mimeType, prompt: prompt.substring(0, 50) + '...' });

    // Prepare the request body
    const requestParts: any[] = [{ text: prompt }];
    
    if (imageData && mimeType) {
      requestParts.push({
        inline_data: {
          mime_type: mimeType,
          data: imageData
        }
      });
    }

    const requestBody = {
      contents: [{
        parts: requestParts
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    console.log('Making request to Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error response:', errorText);
      return NextResponse.json(
        { error: `API Error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Server API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}