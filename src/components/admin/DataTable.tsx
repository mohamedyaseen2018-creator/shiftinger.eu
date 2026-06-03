import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { downloadCsv } from "@/lib/csv";

export interface Column<T> {
  key: string;
  label: string;
  /** Value used for searching, sorting and CSV export. */
  value: (row: T) => string | number;
  /** Optional custom cell rendering (falls back to value()). */
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  /** Exclude from CSV export (e.g. an actions column). */
  csv?: boolean;
  className?: string;
}

interface FilterDef<T> {
  label: string;
  field: (row: T) => string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
  csvFilename: string;
  searchPlaceholder?: string;
  searchFields?: (row: T) => string;
  filter?: FilterDef<T>;
  initialSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
  minWidth?: number;
  emptyText?: string;
}

export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  csvFilename,
  searchPlaceholder = "Search…",
  searchFields,
  filter,
  initialSort,
  pageSize = 10,
  minWidth = 900,
  emptyText = "Nothing here yet.",
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = useState(0);

  const colByKey = useMemo(() => Object.fromEntries(columns.map((c) => [c.key, c])), [columns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter && filterValue !== "all" && filter.field(row) !== filterValue) return false;
      if (!q) return true;
      const haystack = searchFields
        ? searchFields(row)
        : columns.map((c) => String(c.value(row))).join(" ");
      return haystack.toLowerCase().includes(q);
    });
  }, [rows, query, filter, filterValue, searchFields, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = colByKey[sort.key];
    if (!col) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.value(a);
      const bv = col.value(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }, [filtered, sort, colByKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const exportCsv = () => {
    const cols = columns.filter((c) => c.csv !== false);
    downloadCsv(
      csvFilename,
      cols.map((c) => c.label),
      sorted.map((row) => cols.map((c) => c.value(row))),
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5 ring-1 ring-ink/10 sm:max-w-sm">
          <Search size={15} className="text-ink/40" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-ink focus:outline-none"
          />
        </div>
        {filter && (
          <select
            value={filterValue}
            onChange={(e) => {
              setFilterValue(e.target.value);
              setPage(0);
            }}
            className="rounded-full bg-white px-4 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none"
          >
            <option value="all">{filter.label}: All</option>
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-canvas hover:bg-ink/90"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/5">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`whitespace-nowrap px-4 py-3 font-medium ${c.className ?? ""}`}>
                  {c.sortable ? (
                    <button
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1 hover:text-ink"
                    >
                      {c.label}
                      {sort?.key === c.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-ink/5 last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className={`whitespace-nowrap px-4 py-3 text-ink/70 ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : c.value(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && <div className="p-10 text-center text-sm text-ink/50">{emptyText}</div>}
      </div>

      {sorted.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm text-ink/60">
          <span>
            {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 ring-1 ring-ink/10 hover:bg-ink/5 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span>
              {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 ring-1 ring-ink/10 hover:bg-ink/5 disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
