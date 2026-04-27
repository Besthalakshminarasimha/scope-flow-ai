// Webhook endpoint the external GPU worker calls to stream progress back.
// URL: /functions/v1/job-progress?jobId=<uuid>
// Body: { progress?: number, stage?: string, message?: string, status?: string, error?: string, sceneFilePath?: string, pointCount?: number }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-worker-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get("jobId");
    if (!jobId) return json({ error: "jobId required" }, 400);

    const expectedSecret = Deno.env.get("GPU_WORKER_SECRET");
    if (expectedSecret) {
      const got = req.headers.get("x-worker-secret");
      if (got !== expectedSecret) return json({ error: "forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const update: Record<string, unknown> = {};
    if (typeof body.progress === "number") update.progress = body.progress;
    if (typeof body.stage === "string") update.stage = body.stage;
    if (typeof body.message === "string") update.message = body.message;
    if (typeof body.status === "string") update.status = body.status;
    if (typeof body.error === "string") update.error = body.error;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // If worker reported a finished scene file, create a scenes row and link it.
    if (body.status === "completed" && body.sceneFilePath) {
      const { data: jobRow } = await admin.from("reconstruction_jobs").select("user_id").eq("id", jobId).maybeSingle();
      if (jobRow) {
        const { data: scene } = await admin.from("scenes").insert({
          user_id: jobRow.user_id,
          name: `Reconstructed ${new Date().toISOString().slice(0, 19)}`,
          point_count: body.pointCount ?? 0,
          file_path: body.sceneFilePath,
          format: "ply",
          is_public: false,
        }).select().single();
        if (scene) update.scene_id = scene.id;
      }
    }

    if (Object.keys(update).length > 0) {
      await admin.from("reconstruction_jobs").update(update).eq("id", jobId);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
