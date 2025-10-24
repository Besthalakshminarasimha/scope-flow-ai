import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing emotion from audio:', audioUrl);

    // Simulated emotion analysis (in production, would use actual audio ML model)
    const emotions = [
      { emotion: "Happy", emoji: "😊", confidence: 0.92 },
      { emotion: "Sad", emoji: "😢", confidence: 0.88 },
      { emotion: "Angry", emoji: "😠", confidence: 0.85 },
      { emotion: "Neutral", emoji: "😐", confidence: 0.90 },
      { emotion: "Surprised", emoji: "😲", confidence: 0.87 }
    ];

    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];

    console.log('Emotion analysis completed:', randomEmotion.emotion);

    return new Response(
      JSON.stringify(randomEmotion),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-emotion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
