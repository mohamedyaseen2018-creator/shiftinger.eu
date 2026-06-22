import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, type AppNotification } from "@/lib/useNotifications";
import { timeAgo } from "@/data/utils";

export default function NotificationBell() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (n: AppNotification) => {
    markRead(n.id);
    setOpen(false);
    if (n.type === "message") {
      navigate({ to: "/messages", search: { c: n.related_id ?? "" } });
    } else if (n.type === "application") {
      navigate({ to: "/my-jobs" });
    } else {
      navigate({ to: "/applications" });
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex size-10 items-center justify-center rounded-full text-ink/70 ring-1 ring-ink/10 transition-colors hover:bg-ink/5 hover:text-teal"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-[18px] text-canvas">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-ink/10">
          <div className="flex items-center justify-between border-b border-ink/5 px-4 py-2.5">
            <span className="text-sm font-medium text-ink">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1 text-xs text-teal hover:underline">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink/40">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n)}
                  className={`flex w-full flex-col gap-0.5 border-b border-ink/5 px-4 py-3 text-left transition-colors hover:bg-ink/5 ${
                    n.read ? "" : "bg-teal/5"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-ink">
                    {!n.read && <span className="size-1.5 flex-shrink-0 rounded-full bg-teal" />}
                    {n.title}
                  </span>
                  {n.body && <span className="line-clamp-1 text-xs text-ink/60">{n.body}</span>}
                  <span className="text-[11px] text-ink/40" suppressHydrationWarning>
                    {timeAgo(n.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
