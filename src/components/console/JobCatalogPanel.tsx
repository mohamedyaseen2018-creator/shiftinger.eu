import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pill } from "@/components/console/ui";
import { TextInput, PrimaryButton } from "@/components/console/forms";
import { useAdminStore, type JobCatalogEntry } from "@/data/adminStore";

function JobRow({ job }: { job: JobCatalogEntry }) {
  const store = useAdminStore();
  const [open, setOpen] = useState(false);
  const [skillDraft, setSkillDraft] = useState("");
  const [deleting, setDeleting] = useState(false);

  const save = (patch: Partial<JobCatalogEntry>) =>
    store
      .upsertJob({
        id: job.id,
        name: patch.name ?? job.name,
        emoji: patch.emoji ?? job.emoji,
        skills: patch.skills ?? job.skills,
        active: patch.active ?? job.active,
        sortOrder: job.sortOrder,
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not save"));

  const addSkill = async () => {
    const clean = skillDraft.trim();
    if (!clean || job.skills.includes(clean)) return;
    await save({ skills: [...job.skills, clean] });
    setSkillDraft("");
  };

  return (
    <div className="rounded-xl border border-line bg-white">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="text-slate hover:text-pine-dark">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <span className="text-lg">{job.emoji}</span>
        <span className="flex-1 text-sm font-medium text-ink">{job.name}</span>
        <Pill tone="slate">{job.skills.length} skills</Pill>
        <button onClick={() => setDeleting(true)} className="text-red-500 hover:text-red-700">
          <Trash2 size={15} />
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-line/70 px-3 py-3">
          <div className="grid grid-cols-[64px_1fr] gap-2">
            <TextInput defaultValue={job.emoji} onBlur={(e) => e.target.value !== job.emoji && save({ emoji: e.target.value })} placeholder="🍽️" />
            <TextInput defaultValue={job.name} onBlur={(e) => e.target.value.trim() && e.target.value !== job.name && save({ name: e.target.value.trim() })} placeholder="Job name" />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate">Skills</p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-md bg-pine-soft px-2 py-0.5 text-xs font-medium text-pine-dark">
                  {s}
                  <button onClick={() => save({ skills: job.skills.filter((x) => x !== s) })} className="text-pine-dark/60 hover:text-pine-dark">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <TextInput
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add skill…"
              />
              <PrimaryButton onClick={addSkill}>
                <Plus size={14} /> Add
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Delete "{job.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This removes the job and its skills from the catalog.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await store.deleteJob(job.id);
                  toast.success("Job deleted");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not delete");
                }
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function JobCatalogPanel() {
  const store = useAdminStore();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    try {
      await store.upsertJob({ name: name.trim(), emoji: emoji.trim(), skills: [], sortOrder: store.jobCatalog.length });
      toast.success("Job added");
      setName("");
      setEmoji("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add");
    }
  };

  if (store.loading) {
    return (
      <div className="grid h-24 place-items-center">
        <Loader2 className="animate-spin text-pine" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TextInput value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🍽️" className="w-16" />
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="New job role…" />
        <PrimaryButton onClick={add}>
          <Plus size={15} /> Add
        </PrimaryButton>
      </div>
      <div className="space-y-2">
        {store.jobCatalog.map((j) => (
          <JobRow key={j.id} job={j} />
        ))}
        {store.jobCatalog.length === 0 && <p className="py-4 text-center text-sm text-slate">No jobs yet.</p>}
      </div>
    </div>
  );
}
