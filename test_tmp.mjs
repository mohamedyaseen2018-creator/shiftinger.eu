import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
const PASSWORD = "Shiftinger#2026";

async function asUser(email) {
  const c = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) { console.log(`LOGIN FAIL ${email}: ${error.message}`); return; }
  console.log(`LOGIN OK ${email}`);
  return c;
}

// Approved worker: should see own applications + open jobs
const w = await asUser("worker.approved@shiftinger.test");
const { data: apps } = await w.from("applications").select("status, match_score").eq("worker_id", (await w.auth.getUser()).data.user.id);
console.log("  worker sees applications:", apps?.length, apps?.map(a => a.match_score + "%"));
const { data: openJobs } = await w.from("jobs").select("id").eq("status", "open");
console.log("  worker sees open jobs:", openJobs?.length);

// Approved business: should see own jobs + applications to them
const b = await asUser("biz.approved@shiftinger.test");
const bid = (await b.auth.getUser()).data.user.id;
const { data: myJobs } = await b.from("jobs").select("id").eq("owner_id", bid);
console.log("  business sees own jobs:", myJobs?.length);
const { data: incoming } = await b.from("applications").select("id, status").eq("owner_id", bid);
console.log("  business sees incoming applications:", incoming?.length);

// Pending business: login works, status pending
const bp = await asUser("biz.pending@shiftinger.test");
const { data: bpProf } = await bp.from("profiles").select("status").eq("id", (await bp.auth.getUser()).data.user.id).single();
console.log("  pending business status:", bpProf?.status);

// Pending worker
const wp = await asUser("worker.pending@shiftinger.test");
const { data: wpProf } = await wp.from("profiles").select("status").eq("id", (await wp.auth.getUser()).data.user.id).single();
console.log("  pending worker status:", wpProf?.status);
