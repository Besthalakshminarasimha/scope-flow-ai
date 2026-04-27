import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

interface Job {
  id: string;
  status: string;
  progress: number;
  stage: string;
  message: string | null;
  error: string | null;
  scene_id: string | null;
}

export const JobMonitor = ({ jobId, onComplete }: { jobId: string; onComplete?: (sceneId: string) => void }) => {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("reconstruction_jobs").select("*").eq("id", jobId).maybeSingle();
      if (active && data) setJob(data as Job);
    })();

    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reconstruction_jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          const next = payload.new as Job;
          setJob(next);
          if (next.status === "completed" && next.scene_id) onComplete?.(next.scene_id);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [jobId, onComplete]);

  if (!job) return null;

  const variant = job.status === "failed" ? "destructive" : job.status === "completed" ? "default" : "outline";

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-4 h-4 text-primary" />
          Reconstruction Job
          <Badge variant={variant} className="ml-auto capitalize">{job.status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={job.progress} className="h-2" />
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span className="capitalize">{job.stage}</span>
          <span>{job.progress}%</span>
        </div>
        {job.message && <p className="text-xs text-muted-foreground">{job.message}</p>}
        {job.error && <p className="text-xs text-destructive">{job.error}</p>}
      </CardContent>
    </Card>
  );
};
