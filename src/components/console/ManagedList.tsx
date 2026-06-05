import { useState } from "react";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAdminStore, type ListKey } from "@/data/adminStore";

// Editable table for a single managed list: rename, toggle active/inactive,
// reorder, and add new options. Changes propagate live to every dropdown.
export function ManagedList({ listKey, label }: { listKey: ListKey; label?: string }) {
  const store = useAdminStore();
  const options = store.lists[listKey];
  const [draft, setDraft] = useState("");

  const add = () => {
    const clean = draft.trim();
    if (!clean) return;
    store.addOption(listKey, clean);
    setDraft("");
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={`Add ${label ?? "option"}…`}
          className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-pine"
        />
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-sm font-medium text-white hover:bg-pine-dark"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      <ul className="divide-y divide-line rounded-xl border border-line bg-white">
        {options.map((o, i) => (
          <li key={o.id} className="flex items-center gap-2 px-3 py-2">
            <div className="flex flex-col">
              <button
                onClick={() => store.moveOption(listKey, o.id, -1)}
                disabled={i === 0}
                className="text-slate hover:text-ink disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => store.moveOption(listKey, o.id, 1)}
                disabled={i === options.length - 1}
                className="text-slate hover:text-ink disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <input
              value={o.name}
              onChange={(e) => store.renameOption(listKey, o.id, e.target.value)}
              className={`flex-1 rounded-lg border border-transparent px-2 py-1 text-sm outline-none hover:border-line focus:border-pine ${
                o.active ? "text-ink" : "text-slate line-through"
              }`}
            />
            <span className="text-[11px] text-slate">{o.active ? "Active" : "Hidden"}</span>
            <Switch checked={o.active} onCheckedChange={() => store.toggleOption(listKey, o.id)} />
          </li>
        ))}
        {options.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate">No options yet.</li>}
      </ul>
    </div>
  );
}
