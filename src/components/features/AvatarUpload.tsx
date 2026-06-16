import { useEffect, useRef, useState } from "react";
import { Loader2, Camera, Store, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Circular avatar uploader for the profile area. Uploads to the private
 * `avatars` bucket under the owner's folder, stores the storage path in the
 * given table's `avatar_url` column, and previews via a signed URL.
 */
export default function AvatarUpload({
  userId,
  table,
  initialPath,
  variant,
  label,
  helper,
}: {
  userId: string;
  table: "worker_profiles" | "business_profiles";
  initialPath: string | null;
  variant: "worker" | "business";
  label: string;
  helper: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | null>(initialPath);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPath(initialPath);
  }, [initialPath]);

  useEffect(() => {
    let active = true;
    if (!path) {
      setPreview(null);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (active) setPreview(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [path]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const okType = ["image/jpeg", "image/jpg", "image/png"].includes(file.type);
    if (!okType) {
      toast.error("Please upload a JPG or PNG image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large — max 2 MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const newPath = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(newPath, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      toast.error("Upload failed. Please try again.");
      return;
    }
    const { error: dbErr } = await supabase
      .from(table)
      .update({ avatar_url: newPath })
      .eq("user_id", userId);
    setUploading(false);
    if (dbErr) {
      toast.error("Could not save your photo. Please try again.");
      return;
    }
    setPath(newPath);
    toast.success("Photo updated.");
  };

  const Placeholder = variant === "business" ? Store : User;

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="group relative size-20 shrink-0 overflow-hidden rounded-full ring-2 ring-teal/15 transition-opacity hover:opacity-90 disabled:opacity-50"
        aria-label={`Upload ${label}`}
      >
        {preview ? (
          <img src={preview} alt={label} className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center bg-teal/10 text-teal">
            <Placeholder size={28} />
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-ink/55 py-1 text-[10px] font-medium text-canvas opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
        </span>
      </button>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-ink/50">{helper}</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-teal ring-1 ring-teal/30 transition-colors hover:bg-teal/5 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          {preview ? "Change photo" : "Upload photo"}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
