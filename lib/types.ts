export type OrderStatus =
  | "awaiting_deposit"
  | "theme_selection"
  | "pending_review"
  | "generating"
  | "ready_for_selection"
  | "ready_to_generate"
  | "selection_payment_pending"
  | "delivered"
  | "rejected"
  | "failed"
  | "pending_payment"
  | "pending_theme"
  | "pending_selection"
  | "pending_final_payment"
  | "paid"
  | "completed"
  | "generation_failed";

export type OrderAsset = {
  id: string;
  order_id: string;
  kind: "upload" | "generated";
  person_role?: "bride" | "groom" | null;
  original_path: string;
  preview_path: string | null;
  mime_type: string;
  width: number | null;
  height: number | null;
  generation_prompt: string | null;
  theme_id: string | null;
  theme_name: string | null;
  prompt_id: string | null;
  prompt_name: string | null;
  aspect_ratio: string | null;
  is_cover_prompt: boolean;
  generation_type: "normal" | "sweet_spot" | "manual_extra" | "recommendation" | "id_photo" | null;
  generation_provider?: string | null;
  generation_model?: string | null;
  generation_task_id?: string | null;
  generation_status?: string | null;
  generation_error?: string | null;
  prompt_index: number | null;
  sort_order: number;
  is_selected: boolean;
  is_unlocked: boolean;
  created_at: string;
};

export type UploadedPersonPhoto = {
  originalName: string;
  path: string;
  url: string;
  mimeType?: string;
  size?: number;
};

export type GenerationJob = {
  provider: "apimart";
  task_id: string;
  image_number: number;
  status: "created" | "polling" | "completed" | "failed";
  poll_count: number;
  result_image_url?: string | null;
  error?: string | null;
  theme_id: string | null;
  theme_name: string | null;
  prompt_id: string | null;
  prompt_name: string | null;
  aspect_ratio: string | null;
  is_cover_prompt: boolean;
  generation_type: "normal" | "sweet_spot" | "manual_extra" | "recommendation" | "id_photo" | null;
  prompt_index: number | null;
  raw_prompt: string | null;
  resolution?: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  status: OrderStatus;
  deposit_amount_cents: number;
  selected_count: number;
  selection_amount_cents: number;
  selected_theme_ids: string[];
  uploadedPhoto?: UploadedPersonPhoto | null;
  uploadedPhotos?: {
    bride?: UploadedPersonPhoto;
    groom?: UploadedPersonPhoto;
  };
  photo_type?: "id_photo" | "casual_photo" | null;
  id_photo_assets?: {
    bride?: OrderAsset;
    groom?: OrderAsset;
  };
  generation_jobs?: GenerationJob[];
  generation_resolution?: "1K" | "2K" | "4K" | null;
  admin_note: string | null;
  reject_reason: string | null;
  selection_view_count: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
