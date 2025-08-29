import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API Key present:', !!process.env.GEMINI_API_KEY);
    console.log('API Key value:', process.env.GEMINI_API_KEY);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Say hello" }]
        }]
      })
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', result);
    
    return NextResponse.json({
      status: response.status,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      result: result
    });
    
  } catch (error) {
    console.error('Test API Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}