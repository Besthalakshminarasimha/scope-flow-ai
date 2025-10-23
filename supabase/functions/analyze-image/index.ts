import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, model, confidenceThreshold } = await req.json();
    console.log('Processing image:', { imageUrl, model, confidenceThreshold });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create system prompts for different models
    const systemPrompts: Record<string, string> = {
      'Object Detection': `You are an expert computer vision AI. Analyze the image and detect all visible objects. Return a JSON object with this structure:
{
  "objects": [
    {
      "label": "object name",
      "confidence": 0.95,
      "bbox": [x1, y1, x2, y2]
    }
  ]
}
Provide accurate bounding boxes and confidence scores above ${confidenceThreshold}.`,
      
      'Image Classification': `You are an expert image classifier. Analyze the image and classify it into relevant categories. Return a JSON object with this structure:
{
  "categories": [
    {
      "label": "category name",
      "confidence": 0.89
    }
  ]
}
List 3-5 most relevant categories with confidence scores above ${confidenceThreshold}.`,
      
      'Face Recognition': `You are an expert face detection AI. Analyze the image and detect all faces. Return a JSON object with this structure:
{
  "faces": [
    {
      "confidence": 0.94,
      "bbox": [x1, y1, x2, y2],
      "age": 28,
      "gender": "female"
    }
  ]
}
Estimate age and gender for each detected face with confidence above ${confidenceThreshold}.`,
      
      'OCR': `You are an expert OCR system. Extract all text from the image. Return a JSON object with this structure:
{
  "text": "full extracted text",
  "words": [
    {
      "text": "word",
      "confidence": 0.95,
      "bbox": [x1, y1, x2, y2]
    }
  ]
}
Extract all text with word-level confidence scores above ${confidenceThreshold}.`,
      
      'Image Segmentation': `You are an expert image segmentation AI. Segment the image into different regions. Return a JSON object with this structure:
{
  "segments": [
    {
      "label": "segment name",
      "pixels": 15420,
      "color": "#87CEEB"
    }
  ]
}
Identify 4-8 major segments in the image with estimated pixel counts.`
    };

    const systemPrompt = systemPrompts[model] || systemPrompts['Object Detection'];

    // Call Lovable AI with the image
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image using the ${model} model. Return ONLY valid JSON, no additional text.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiResult, null, 2));
    
    let resultsText = aiResult.choices[0].message.content;
    
    // Clean up the response to extract JSON
    resultsText = resultsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let results;
    try {
      results = JSON.parse(resultsText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', resultsText);
      throw new Error('Invalid JSON response from AI');
    }

    // Calculate overall confidence
    let confidence = 0;
    if (model === 'Object Detection' && results.objects) {
      confidence = Math.max(...results.objects.map((obj: any) => obj.confidence));
    } else if (model === 'Image Classification' && results.categories) {
      confidence = Math.max(...results.categories.map((cat: any) => cat.confidence));
    } else if (model === 'Face Recognition' && results.faces) {
      confidence = Math.max(...results.faces.map((face: any) => face.confidence));
    } else if (model === 'OCR' && results.words) {
      confidence = Math.max(...results.words.map((word: any) => word.confidence));
    } else if (model === 'Image Segmentation') {
      confidence = 0.85;
    }

    console.log('Analysis complete:', { model, confidence, resultsCount: Object.keys(results).length });

    return new Response(
      JSON.stringify({ results, confidence }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
