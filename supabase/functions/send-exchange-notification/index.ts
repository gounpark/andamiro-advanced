import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type ExchangeCommentRow = {
  id: string;
  diary_id: string;
  author_id: string;
  author_name: string;
  body: string;
  parent_id: string | null;
};

type ExchangeDiaryRow = {
  id: string;
  title: string;
  author_id: string;
  viewer_ids: string[] | null;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@andamiro.app";

const supabase = createClient(supabaseUrl, serviceRoleKey);

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return json({ error: "VAPID keys are not configured" }, 500);
  }

  const { commentId } = await req.json().catch(() => ({ commentId: "" }));
  if (!commentId) return json({ error: "commentId is required" }, 400);

  const { data: comment, error: commentError } = await supabase
    .from("exchange_comments")
    .select("id, diary_id, author_id, author_name, body, parent_id")
    .eq("id", commentId)
    .maybeSingle<ExchangeCommentRow>();

  if (commentError || !comment) return json({ error: "comment not found" }, 404);

  const { data: diary, error: diaryError } = await supabase
    .from("exchange_diaries")
    .select("id, title, author_id, viewer_ids")
    .eq("id", comment.diary_id)
    .maybeSingle<ExchangeDiaryRow>();

  if (diaryError || !diary) return json({ error: "diary not found" }, 404);

  const recipientIds = [...new Set([diary.author_id, ...(diary.viewer_ids ?? [])])].filter(
    (id) => id && id !== comment.author_id,
  );
  if (recipientIds.length === 0) return json({ sent: 0 });

  const { data: subscriptions } = await supabase
    .from("exchange_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .in("user_id", recipientIds)
    .returns<PushSubscriptionRow[]>();

  const kind = comment.parent_id ? "답글" : "댓글";
  const payload = JSON.stringify({
    title: `"${diary.title}"에 새 ${kind}`,
    body: `${comment.author_name}: ${comment.body}`,
    url: `/exchange/${diary.id}`,
    tag: `exchange-comment-${diary.id}`,
  });

  const results = await Promise.allSettled(
    (subscriptions ?? []).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        return true;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("exchange_push_subscriptions")
            .delete()
            .eq("endpoint", subscription.endpoint);
        }
        return false;
      }
    }),
  );

  const sent = results.filter((result) => result.status === "fulfilled" && result.value).length;
  return json({ sent });
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
