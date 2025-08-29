'use client';

/**
 * Gemini 2.5 Flash Image Landing Page
 * 
 * References:
 * - Introducing Gemini 2.5 Flash Image: https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/
 * - Gemini API Documentation: https://ai.google.dev/gemini-api/docs
 */

import React, { useState } from 'react';

const GeminiLandingPage = () => {
  const [inputType, setInputType] = useState('upload'); // 'upload' or 'url'
  const [imageFile, setImageFile] = useState(null);
  const [landmarkUrl, setLandmarkUrl] = useState('');
  const [styleInput, setStyleInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      setImageFile(files[0]);
    }
  };

  // Download generated image
  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `landmark-${styleInput.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Gemini API Integration Function
  const generateImage = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const prompt = `Take this location and make the landmark an isometric image (building only) in the style of ${styleInput}.`;
      
      console.log('🚀 Gemini Image Generation API Call:', {
        prompt,
        imageSource: inputType === 'upload' ? 'File upload' : landmarkUrl,
        model: 'gemini-2.5-flash-image-preview'
      });

      // Prepare the request body based on input type
      let requestParts = [{ text: prompt }];
      
      if (inputType === 'upload' && imageFile) {
        const base64Data = await fileToBase64(imageFile);
        requestParts.push({
          inline_data: {
            mime_type: imageFile.type,
            data: base64Data
          }
        });
      } else if (inputType === 'url' && landmarkUrl) {
        // For URL input, we include the URL in the text prompt
        requestParts[0].text = `${prompt}\n\nReference image URL: ${landmarkUrl}`;
      }

      const requestBody = {
        contents: [{
          parts: requestParts
        }]
      };

      console.log('📤 Sending request to Gemini Image Generation API...');
      
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('📥 Full Gemini API Response:', JSON.stringify(result, null, 2));
      
      // More detailed logging for debugging
      console.log('Response structure check:');
      console.log('- result.candidates:', result.candidates);
      console.log('- candidates length:', result.candidates?.length || 0);
      if (result.candidates?.[0]) {
        console.log('- first candidate:', result.candidates[0]);
        console.log('- first candidate content:', result.candidates[0].content);
        console.log('- first candidate parts:', result.candidates[0].content?.parts);
      }
      
      // Check for generated image in the response
      const parts = result.candidates?.[0]?.content?.parts || [];
      let imageFound = false;
      let textFound = false;
      
      console.log(`Processing ${parts.length} parts from response...`);
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        console.log(`Part ${i}:`, part);
        
        if (part.inlineData && part.inlineData.data) {
          console.log('✅ Found image data in part', i);
          // Found generated image data
          const mimeType = part.inlineData.mimeType || 'image/png';
          const base64Data = part.inlineData.data;
          setGeneratedImage(`data:${mimeType};base64,${base64Data}`);
          imageFound = true;
          setError(null); // Clear any previous errors
          break;
        } else if (part.inline_data && part.inline_data.data) {
          console.log('✅ Found image data in part (snake_case)', i);
          // Fallback for snake_case format
          const mimeType = part.inline_data.mime_type || 'image/png';
          const base64Data = part.inline_data.data;
          setGeneratedImage(`data:${mimeType};base64,${base64Data}`);
          imageFound = true;
          setError(null); // Clear any previous errors
          break;
        } else if (part.text) {
          console.log('✅ Found text in part', i, ':', part.text.substring(0, 100) + '...');
          textFound = true;
        }
      }
      
      if (!imageFound && textFound) {
        // If no image found but we have text, show the text
        const textPart = parts.find(part => part.text);
        const responseText = textPart.text;
        
        // Create a display for the AI's text response
        setGeneratedImage(`data:image/svg+xml;base64,${btoa(`
          <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#f8fafc"/>
            <foreignObject width="380" height="380" x="10" y="10">
              <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; padding: 15px; background: white; border-radius: 8px; height: 350px; overflow-y: auto; line-height: 1.5;">
                <h3 style="margin-top: 0; margin-bottom: 12px; color: #1e293b; font-size: 16px; font-weight: 600;">AI Response (Text Only):</h3>
                <div style="color: #374151; white-space: pre-wrap;">${responseText.replace(/\n/g, '<br/>')}</div>
              </div>
            </foreignObject>
          </svg>
        `)}`);
        
        setError('The model returned text instead of generating an image. This might be a model limitation or prompt issue.');
      } else if (!imageFound && !textFound) {
        console.log('❌ No image or text found in response parts');
        throw new Error(`No image or text content generated in API response. Response structure: ${JSON.stringify(result, null, 2)}`);
      }
      
    } catch (err) {
      console.error('Gemini API Error:', err);
      
      // Check if it's a quota/rate limit error
      if (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('quota')) {
        setError('API quota exceeded. The free tier has limits on image generation. Please try again later or upgrade your API plan.');
      } else if (err.message.includes('429')) {
        setError('Rate limit exceeded. Please wait a few minutes before trying again.');
      } else {
        setError(`Failed to generate image: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert file to base64 (for actual implementation)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Landmark Transformer
          </h1>
          <p className="text-gray-600">
            Turn any landmark into an isometric masterpiece
          </p>
        </div>

        {/* Input Type Toggle */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setInputType('upload')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                inputType === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload Image
            </button>
            <button
              onClick={() => setInputType('url')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                inputType === 'url'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Landmark URL
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Image/URL Input */}
          {inputType === 'upload' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    isDragging ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <span className={`text-sm ${isDragging ? 'text-blue-600' : 'text-gray-600'}`}>
                    {imageFile ? imageFile.name : (isDragging ? 'Drop your image here' : 'Click to upload or drag and drop')}
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark URL
              </label>
              <input
                type="url"
                value={landmarkUrl}
                onChange={(e) => setLandmarkUrl(e.target.value)}
                placeholder="https://example.com/landmark-image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
          )}

          {/* Style Input Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What style do you want to see?
            </label>
            <input
              type="text"
              value={styleInput}
              onChange={(e) => setStyleInput(e.target.value)}
              placeholder="e.g., cyberpunk, Art Deco, minimalist, steampunk..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={generateImage}
            disabled={isLoading || (!imageFile && !landmarkUrl) || !styleInput}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating magic...
              </div>
            ) : (
              'Show me the magic ✨'
            )}
          </button>

          {/* Generated Image Display */}
          {generatedImage && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-800">Your Transformed Landmark</h3>
                <button
                  onClick={downloadImage}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Save
                </button>
              </div>
              <div className="border rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={generatedImage} 
                  alt="Generated isometric landmark" 
                  className="w-full h-auto"
                  onError={() => setError('Failed to load generated image')}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiLandingPage;
