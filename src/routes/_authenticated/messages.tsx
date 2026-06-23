import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, ArrowLeft, Send, MapPin, Handshake, Flag, Star, ChevronDown, Ban, Lock } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (s: Record<string, unknown>) => ({ c: (s.c as string) || "" }),
  head: () => ({ meta: [{ title: "Messages — Shiftinger" }] }),
  component: MessagesPage,
});

interface Conv {
  id: string;
  worker_id: string;
  business_id: string;
  worker_agreed: boolean;
  business_agreed: boolean;
  location_shared: boolean;
  worker_ended: boolean;
  business_ended: boolean;
  status: string;
}
interface Msg {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

function MessagesPage() {
  const { c } = Route.useSearch();
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string>(c);
  const [loading, setLoading] = useState(true);

  const loadConvs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .or(`worker_id.eq.${user.id},business_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });
    const rows = (data ?? []) as Conv[];
    setConvs(rows);
    if (!active && rows.length) setActive(rows[0].id);
    setLoading(false);
  }, [user, active]);

  useEffect(() => {
    loadConvs();
  }, [loadConvs]);

  if (loading) {
    return <SiteLayout><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-teal" /></div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-teal">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <h1 className="font-serif text-3xl text-ink">Messages</h1>

          {convs.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-white p-10 text-center text-ink/50 ring-1 ring-ink/5">
              No conversations yet. Chats open once both sides confirm an application.
            </div>
          ) : (
            <div className="mt-8 grid gap-4 lg:grid-cols-[260px_1fr]">
              <div className="space-y-2">
                {convs.map((cv) => (
                  <button key={cv.id} onClick={() => setActive(cv.id)}
                    className={`block w-full rounded-xl p-4 text-left ring-1 transition-colors ${active === cv.id ? "bg-teal/5 ring-teal" : "bg-white ring-ink/5 hover:bg-ink/5"}`}>
                    <p className="text-sm font-medium text-ink">Conversation</p>
                    <p className="text-xs text-ink/50">{cv.status}</p>
                  </button>
                ))}
              </div>
              <div>
                {active ? (
                  <ChatPanel
                    conversation={convs.find((cv) => cv.id === active)!}
                    userId={user!.id}
                    onChanged={loadConvs}
                  />
                ) : (
                  <div className="rounded-2xl bg-white p-10 text-center text-ink/50 ring-1 ring-ink/5">Select a conversation.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function ChatPanel({ conversation, userId, onChanged }: { conversation: Conv; userId: string; onChanged: () => void }) {
  const isWorker = conversation.worker_id === userId;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", conversation.id).order("created_at");
    setMessages((data ?? []) as Msg[]);
  }, [conversation.id]);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Msg]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversation.id, loadMessages]);

  useEffect(() => {
    if (isWorker && conversation.location_shared) {
      supabase.from("business_locations").select("address").eq("business_id", conversation.business_id).maybeSingle()
        .then(({ data }) => setAddress((data?.address as string) ?? null));
    }
  }, [isWorker, conversation.location_shared, conversation.business_id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const body = text.trim().slice(0, 2000);
    setText("");
    const { error } = await supabase.from("messages").insert({ conversation_id: conversation.id, sender_id: userId, body });
    if (error) toast.error("Could not send.");
  };

  const agree = async (sendLocation: boolean) => {
    const { error } = await supabase.rpc("set_agreement", { _conversation_id: conversation.id, _send_location: sendLocation });
    if (error) toast.error("Could not update.");
    else { toast.success(sendLocation ? "Agreed & location sent." : "You agreed to work."); onChanged(); }
  };

  const end = async () => {
    const { error } = await supabase.rpc("end_job", { _conversation_id: conversation.id });
    if (error) toast.error("Could not end job.");
    else { toast.success("Marked as finished. Please leave a review."); onChanged(); }
  };

  const submitReview = async () => {
    const { error } = await supabase.rpc("submit_review", { _conversation_id: conversation.id, _rating: rating, _comment: comment.slice(0, 500) });
    if (error) toast.error("Could not submit review.");
    else { toast.success("Review submitted. Thank you!"); setShowReview(false); onChanged(); }
  };

  const myAgreed = isWorker ? conversation.worker_agreed : conversation.business_agreed;
  const bothEnded = conversation.worker_ended && conversation.business_ended;

  return (
    <div className="flex h-[560px] flex-col rounded-2xl bg-white ring-1 ring-ink/5">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink/5 p-3">
        {!myAgreed && conversation.status !== "completed" && (
          isWorker ? (
            <button onClick={() => agree(false)} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-xs font-medium text-canvas hover:bg-teal-light">
              <Handshake size={14} /> Agree to work
            </button>
          ) : (
            <button onClick={() => agree(true)} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-xs font-medium text-canvas hover:bg-teal-light">
              <MapPin size={14} /> Agree & send location
            </button>
          )
        )}
        {myAgreed && conversation.status === "agreed" && !bothEnded && (
          <button onClick={end} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-ink/15 hover:bg-ink/5">
            <Flag size={14} /> End job
          </button>
        )}
        {bothEnded && conversation.status !== "completed" && (
          <button onClick={() => setShowReview(true)} className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-medium text-canvas hover:bg-gold-dark">
            <Star size={14} /> Leave review to close
          </button>
        )}
        {conversation.status === "completed" && <span className="text-xs text-teal">Job completed ✓</span>}
      </div>

      {isWorker && conversation.location_shared && address && (
        <div className="m-3 flex items-center gap-2 rounded-lg bg-teal/5 px-3 py-2 text-xs text-teal ring-1 ring-teal/10">
          <MapPin size={14} /> Location: {address}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-center text-sm text-ink/40">Say hello to get started.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === userId ? "bg-teal text-canvas" : "bg-canvas text-ink ring-1 ring-ink/5"}`}>
              {m.body}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Review form */}
      {showReview && (
        <div className="border-t border-ink/5 p-4">
          <div className="mb-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={20} className={n <= rating ? "fill-gold text-gold" : "text-ink/20"} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="How did it go?"
            className="w-full rounded-md border-0 bg-canvas px-3 py-2 text-sm ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal" />
          <button onClick={submitReview} className="mt-2 rounded-full bg-teal px-4 py-2 text-sm font-medium text-canvas hover:bg-teal-light">Submit review</button>
        </div>
      )}

      {/* Composer */}
      {conversation.status !== "completed" && (
        <div className="flex items-center gap-2 border-t border-ink/5 p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="flex-1 rounded-full border-0 bg-canvas px-4 py-2.5 text-sm ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal" />
          <button onClick={send} className="flex size-10 items-center justify-center rounded-full bg-teal text-canvas hover:bg-teal-light">
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
