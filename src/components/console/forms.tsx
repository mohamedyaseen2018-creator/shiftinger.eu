// Reusable form primitives for the admin console — themed to the teal/amber palette.
import { useState, type ReactNode } from "react";
import { Plus, X, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function RequiredMark() {
  return <span className="text-red-500"> *</span>;
}

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-slate">
        {label}
        {required && <RequiredMark />}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-slate">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] font-medium text-red-600">{error}</span>}
    </label>
  );
}

const baseInput =
  "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(baseInput, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(baseInput, "min-h-[80px]", props.className)} />;
}

export function SelectInput({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  className?: string;
}) {
  const norm = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(baseInput, className)}>
      {norm.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-[11px] text-slate">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// Multi-select tag input that draws from a managed list and lets the admin add
// brand-new options on the fly (which are pushed back into the managed list).
export function TagMultiSelect({
  selected,
  options,
  onChange,
  onAddOption,
  placeholder = "Add…",
}: {
  selected: string[];
  options: string[];
  onChange: (next: string[]) => void;
  onAddOption?: (name: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const toggle = (name: string) =>
    onChange(selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name]);

  const addNew = () => {
    const clean = draft.trim();
    if (!clean) return;
    onAddOption?.(clean);
    if (!selected.includes(clean)) onChange([...selected, clean]);
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-line bg-white p-2.5">
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-md bg-pine-soft px-2 py-0.5 text-xs font-medium text-pine-dark">
              {s}
              <button type="button" onClick={() => toggle(s)} className="text-pine-dark/60 hover:text-pine-dark">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options
          .filter((o) => !selected.includes(o))
          .map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className="rounded-md border border-line px-2 py-0.5 text-xs text-slate hover:border-pine hover:text-pine-dark"
            >
              {o}
            </button>
          ))}
      </div>
      {onAddOption && (
        <div className="mt-2 flex items-center gap-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNew();
              }
            }}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-line px-2 py-1 text-xs outline-none focus:border-pine"
          />
          <button
            type="button"
            onClick={addNew}
            className="inline-flex items-center gap-1 rounded-lg bg-mist px-2 py-1 text-xs font-medium text-ink hover:bg-line"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      )}
    </div>
  );
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl bg-pine px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pine-dark disabled:opacity-50",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-mist",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

export function SaveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-pine-dark">
      <Check size={13} /> Saved
    </span>
  );
}
