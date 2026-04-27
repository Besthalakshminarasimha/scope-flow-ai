import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  sourceFiles: { path: string; name: string; size: number; type: string }[];
  sourceType: "images" | "video";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing auth" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "unauthorized" }, 401);
    const user = userRes.user;

    const body = (await req.json()) as Body;
    if (!Array.isArray(body.sourceFiles) || body.sourceFiles.length === 0) {
      return json({ error: "no source files" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: job, error } = await admin
      .from("reconstruction_jobs")
      .insert({
        user_id: user.id,
        status: "running",
        progress: 0,
        stage: "queued",
        message: "Job accepted, awaiting GPU worker",
        source_files: body.sourceFiles,
        source_type: body.sourceType,
      })
      .select()
      .single();
    if (error) throw error;

    // Try to forward to external GPU service if configured
    const gpuUrl = Deno.env.get("GPU_RECONSTRUCTION_URL");
    const gpuKey = Deno.env.get("GPU_RECONSTRUCTION_API_KEY");
    let externalJobId: string | null = null;
    if (gpuUrl) {
      try {
        const resp = await fetch(gpuUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(gpuKey ? { Authorization: `Bearer ${gpuKey}` } : {}),
          },
          body: JSON.stringify({
            jobId: job.id,
            userId: user.id,
            sourceFiles: body.sourceFiles,
            sourceType: body.sourceType,
            callbackUrl: `${supabaseUrl}/functions/v1/job-progress?jobId=${job.id}`,
          }),
        });
        if (resp.ok) {
          const payload = await resp.json().catch(() => ({}));
          externalJobId = payload?.jobId ?? null;
          await admin.from("reconstruction_jobs").update({
            external_job_id: externalJobId,
            stage: "colmap",
            message: "External GPU worker accepted job",
          }).eq("id", job.id);
        } else {
          // Fall back to simulated pipeline below
          throw new Error(`GPU worker error ${resp.status}`);
        }
      } catch (e) {
        console.log("[start-reconstruction] GPU forward failed, falling back to simulator:", e);
        simulatePipeline(admin, job.id);
      }
    } else {
      // No GPU service configured — run simulator
      simulatePipeline(admin, job.id);
    }

    return json({ jobId: job.id, externalJobId });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Simulated COLMAP + 3DGS pipeline that streams progress via DB updates.
async function simulatePipeline(admin: ReturnType<typeof createClient>, jobId: string) {
  const stages = [
    { stage: "colmap", message: "Running COLMAP Structure-from-Motion", upTo: 25 },
    { stage: "init_gaussians", message: "Initializing Gaussians from sparse cloud", upTo: 35 },
    { stage: "training", message: "Optimizing 3D Gaussians via gradient descent", upTo: 90 },
    { stage: "densification", message: "Adaptive densification & pruning", upTo: 96 },
    { stage: "export", message: "Exporting splat scene", upTo: 100 },
  ];

  // Run async, don't block the HTTP response
  (async () => {
    try {
      let p = 0;
      for (const s of stages) {
        while (p < s.upTo) {
          p = Math.min(p + 2 + Math.floor(Math.random() * 3), s.upTo);
          await admin.from("reconstruction_jobs").update({
            stage: s.stage, message: s.message, progress: p, status: "running",
          }).eq("id", jobId);
          await new Promise(r => setTimeout(r, 350));
        }
      }
      // Mark complete (without an actual scene file — UI will load bundled sample)
      await admin.from("reconstruction_jobs").update({
        stage: "done", message: "Reconstruction complete (simulated)", progress: 100, status: "completed",
      }).eq("id", jobId);
    } catch (e) {
      console.error("simulator error", e);
      await admin.from("reconstruction_jobs").update({
        status: "failed", error: (e as Error).message,
      }).eq("id", jobId);
    }
  })();
}
