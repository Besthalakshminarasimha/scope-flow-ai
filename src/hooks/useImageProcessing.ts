import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ProcessingResult {
  model: string;
  confidence: number;
  results: any;
  processedImageUrl?: string;
}


export const useImageProcessing = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const { user } = useAuth();

  const processImage = async (file: File, model: string, confidenceThreshold: number = 0.5) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to process images",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      console.log('Calling AI analysis for:', model, publicUrl);

      // Call the edge function for real AI processing
      const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-image', {
        body: {
          imageUrl: publicUrl,
          model,
          confidenceThreshold
        }
      });

      if (aiError) {
        console.error('AI processing error:', aiError);
        throw new Error(aiError.message || 'Failed to process image with AI');
      }

      if (!aiData || !aiData.results) {
        throw new Error('Invalid response from AI processing');
      }

      const { results, confidence } = aiData;
      console.log('AI analysis complete:', { model, confidence });

      // Save to history
      const { error: dbError } = await supabase
        .from('analysis_history')
        .insert({
          user_id: user.id,
          filename: file.name,
          model,
          results,
          confidence,
          image_url: publicUrl,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't throw error, just log it
      }

      const processedResult: ProcessingResult = {
        model,
        confidence,
        results,
        processedImageUrl: publicUrl,
      };

      setResult(processedResult);

      toast({
        title: "Processing Complete",
        description: `${model} analysis finished with ${Math.round(confidence * 100)}% confidence`,
      });

      return processedResult;
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing the image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    processImage,
    loading,
    result,
    setResult,
  };
};