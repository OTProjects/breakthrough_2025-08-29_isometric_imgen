import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageData, mimeType } = await request.json();

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
      }]
    };

    // Make API call from server-side (more secure)
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || ''
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
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