import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
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
import { useAdminStore, type ListKey, type ListOption } from "@/data/adminStore";

const LISTS: { key: ListKey; label: string }[] = [
  { key: "nationality", label: "Nationalities" },
  { key: "language", label: "Languages" },
  { key: "skill", label: "Skills / roles" },
  { key: "sector", label: "Sectors" },
  { key: "sub_sector", label: "Sub-sectors" },
  { key: "city", label: "Cities" },
  { key: "dispute_issue_type", label: "Dispute issue types" },
  { key: "shift_role", label: "Shift roles" },
  { key: "admin_role", label: "Admin user roles" },
];

function ListEditor({ listKey }: { listKey: ListKey }) {
  const store = useAdminStore();
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState<ListOption | null>(null);

  const options = store.lists
    .filter((l) => l.listKey === listKey)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const add = async () => {
    const clean = draft.trim();
    if (!clean) return;
    try {
      await store.upsertListOption({ listKey, value: clean, sortOrder: (options.at(-1)?.sortOrder ?? 0) + 1 });
      toast.success("Option added");
      setDraft("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add option");
    }
  };

  const rename = async (o: ListOption, value: string) => {
    if (value.trim() === o.value || !value.trim()) return;
    try {
      await store.upsertListOption({ id: o.id, listKey, value: value.trim(), active: o.active, sortOrder: o.sortOrder });
      toast.success("Option renamed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not rename");
    }
  };

  const toggle = async (o: ListOption) => {
    try {
      await store.upsertListOption({ id: o.id, listKey, value: o.value, active: !o.active, sortOrder: o.sortOrder });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const a = options[index];
    const b = options[index + dir];
    if (!a || !b) return;
    try {
      await Promise.all([
        store.upsertListOption({ id: a.id, listKey, value: a.value, active: a.active, sortOrder: b.sortOrder }),
        store.upsertListOption({ id: b.id, listKey, value: b.value, active: b.active, sortOrder: a.sortOrder }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reorder");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add new option…"
        />
        <PrimaryButton onClick={add}>
          <Plus size={15} /> Add
        </PrimaryButton>
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <tbody>
            {options.map((o, i) => (
              <tr key={o.id} className="border-b border-line/70 last:border-0">
                <td className="w-10 px-2 py-2">
                  <div className="flex flex-col">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate hover:text-pine-dark disabled:opacity-30">
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === options.length - 1} className="text-slate hover:text-pine-dark disabled:opacity-30">
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <input
                    defaultValue={o.value}
                    onBlur={(e) => rename(o, e.target.value)}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-ink outline-none hover:border-line focus:border-pine"
                  />
                </td>
                <td className="px-2 py-2 text-right">
                  {o.active ? <Pill tone="pine">Active</Pill> : <Pill tone="slate">Inactive</Pill>}
                </td>
                <td className="px-2 py-2">
                  <Switch checked={o.active} onCheckedChange={() => toggle(o)} />
                </td>
                <td className="px-2 py-2">
                  <button onClick={() => setDeleting(o)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {options.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate">No options yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Delete "{deleting?.value}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the option from the list. Existing records that already use this value keep it. Consider deactivating instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleting) return;
                try {
                  await store.deleteListOption(deleting.id);
                  toast.success("Option deleted");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not delete");
                } finally {
                  setDeleting(null);
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

export function PlatformListsPanel() {
  const store = useAdminStore();
  if (store.loading) {
    return (
      <div className="grid h-32 place-items-center">
        <Loader2 className="animate-spin text-pine" />
      </div>
    );
  }
  return (
    <Accordion type="single" collapsible className="w-full">
      {LISTS.map((l) => {
        const count = store.lists.filter((o) => o.listKey === l.key && o.active).length;
        return (
          <AccordionItem key={l.key} value={l.key}>
            <AccordionTrigger className="text-sm font-medium text-ink hover:no-underline">
              <span className="flex items-center gap-2">
                {l.label}
                <Pill tone="slate">{count}</Pill>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ListEditor listKey={l.key} />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
