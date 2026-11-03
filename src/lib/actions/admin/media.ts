"use server";

import { assertStaff } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";
import { validateImageUpload } from "@/lib/security/uploads";
import { slugify } from "@/lib/utils";
import { actionError } from "./common";

const FOLDERS = ["products", "categories", "blog", "banners", "merchants", "authors", "site", "offers"] as const;

/** Uploads an image to the public "media" bucket and returns its URL. */
export async function uploadMedia(formData: FormData): Promise<{ ok: boolean; url?: string; path?: string; message?: string }> {
  try {
    const { supabase } = await assertStaff();
    const folderRaw = String(formData.get("folder") ?? "site");
    const folder = (FOLDERS as readonly string[]).includes(folderRaw) ? folderRaw : "site";
    const file = formData.get("file");
    const checked = await validateImageUpload(file instanceof File ? file : null, { maxBytes: 5 * 1024 * 1024 });
    if (!checked.ok) return { ok: false, message: checked.error };
    const base = slugify((file as File).name.replace(/\.[^.]+$/, "")).slice(0, 60) || "image";
    const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${base}-${crypto.randomUUID().slice(0, 8)}.${checked.value.extension}`;
    const { error } = await supabase.storage
      .from("media")
      .upload(path, checked.value.bytes, { contentType: checked.value.mime, cacheControl: "31536000", upsert: false });
    if (error) return { ok: false, message: `Upload failed: ${error.message}` };
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return { ok: true, url: data.publicUrl, path };
  } catch (e) {
    const r = actionError(e);
    return { ok: false, message: r.message };
  }
}

/** Server-rendered Markdown preview (identical to the public renderer). */
export async function previewMarkdown(markdown: string): Promise<string> {
  await assertStaff();
  return renderMarkdown(String(markdown ?? "").slice(0, 200_000)).html;
}
