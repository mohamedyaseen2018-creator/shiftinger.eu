import { useMemo, useState, type ReactNode } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

export interface Col<T> {
  key: string;
  label: string;
  value: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  csv?: boolean;
  className?: string;
}

export interface FilterSpec<T> {
  key: string;
  label: string;
  field: (row: T) => string;
  options: string[];
}

interface Props<T> {
  rows: T[];
  columns: Col<T>[];
  rowKey: (row: T) => string;
  csvName: string;
  search?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: FilterSpec<T>[];
  pageSize?: number;
  empty?: string;
}

export function ConsoleTable<T>({
  rows,
  columns,
  rowKey,
  csvName,
  search,
  searchPlaceholder = "Search…",
  filters = [],
  pageSize = 8,
  empty = "Nothing here yet.",
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      for (const f of filters) {
        const sel = active[f.key];
        if (sel && sel !== "all" && f.field(row) !== sel) return false;
      }
      if (!q) return true;
      const hay = search ? search(row) : columns.map((c) => String(c.value(row))).join(" ");
      return hay.toLowerCase().includes(q);
    });
  }, [rows, query, active, filters, search, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const exportCsv = () => {
    const cols = columns.filter((c) => c.csv !== false);
    downloadCsv(
      csvName,
      cols.map((c) => c.label),
      filtered.map((row) => cols.map((c) => c.value(row))),
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 sm:max-w-xs">
          <Search size={15} className="text-slate" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate/60"
          />
        </div>
        {filters.map((f) => (
          <select
            key={f.key}
            value={active[f.key] ?? "all"}
            onChange={(e) => {
              setActive((p) => ({ ...p, [f.key]: e.target.value }));
              setPage(0);
            }}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none"
          >
            <option value="all">{f.label}: All</option>
            {f.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ))}
        <button
          onClick={exportCsv}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-pine-dark"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-slate">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-4 py-3 font-semibold", c.className)}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line/70 last:border-0 hover:bg-mist/50">
                {columns.map((c) => (
                  <td key={c.key} className={cn("whitespace-nowrap px-4 py-3 text-ink/80", c.className)}>
                    {c.render ? c.render(row) : c.value(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-10 text-center text-sm text-slate">{empty}</div>}
      </div>

      {filtered.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate">
          <span>
            {safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 hover:bg-mist disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span>
              {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 hover:bg-mist disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
