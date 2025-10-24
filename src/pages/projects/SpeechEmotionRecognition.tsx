import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SpeechEmotionRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [emotion, setEmotion] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "Speak naturally to capture your voice...",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Could not access microphone: " + error.message,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeEmotion = async () => {
    if (!audioBlob) return;

    setIsAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      const { data, error } = await supabase.functions.invoke('analyze-emotion', {
        body: { audioUrl: publicUrl }
      });

      if (error) throw error;

      setEmotion(data);
      toast({
        title: "Analysis Complete",
        description: `Detected emotion: ${data.emotion}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const emotions = ["😊 Happy", "😢 Sad", "😠 Angry", "😰 Fearful", "😐 Neutral", "😲 Surprised"];

  return (
    <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Speech Emotion Recognition</h1>
        <p className="text-lg text-muted-foreground">
          Analyze emotions from speech using signal processing and deep learning on audio spectrograms.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Recording
            </CardTitle>
            <CardDescription>Record your voice to analyze emotions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {audioUrl ? (
                <div className="space-y-4">
                  <Music className="w-12 h-12 mx-auto text-primary" />
                  <audio src={audioUrl} controls className="w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Mic className={`w-12 h-12 mx-auto ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
                  <p className="text-sm text-muted-foreground">
                    {isRecording ? "Recording..." : "No recording yet"}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                className="flex-1"
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>
            <Button
              onClick={analyzeEmotion}
              disabled={!audioBlob || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Emotion"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emotion Analysis</CardTitle>
            <CardDescription>Detected emotional state from speech</CardDescription>
          </CardHeader>
          <CardContent>
            {emotion ? (
              <div className="space-y-4">
                <div className="p-6 bg-primary/10 rounded-lg text-center">
                  <div className="text-6xl mb-2">{emotion.emoji}</div>
                  <h3 className="text-2xl font-bold">{emotion.emotion}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Confidence: {(emotion.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {emotions.map((emo, idx) => (
                    <div key={idx} className="p-2 bg-muted rounded text-center text-sm">
                      {emo}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Record your voice and click "Analyze Emotion" to see results
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpeechEmotionRecognition;
