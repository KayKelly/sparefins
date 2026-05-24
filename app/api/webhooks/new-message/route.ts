import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// ── Clients ────────────────────────────────────────────────────────────────
// Service role key is required to read auth.users emails.
// Never expose this key to the browser.

const resend = new Resend(process.env.RESEND_API_KEY);

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Webhook payload shape ─────────────────────────────────────────────────
// Supabase sends { type, table, schema, record, old_record }

interface MessageRecord {
  id: string;
  listing_id: string;
  from_user: string;
  to_user: string;
  body: string;
  created_at: string;
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Verify the shared secret set in the Supabase webhook config
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.WEBHOOK_SECRET}`;
  if (!process.env.WEBHOOK_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { record?: MessageRecord };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body.record;
  if (!record?.listing_id || !record?.to_user || !record?.from_user) {
    // Not an insert we care about — ack and move on
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = getAdminClient();

    // Fetch listing title + category in parallel with user emails
    const [listingRes, toUserRes, fromUserRes] = await Promise.all([
      supabase
        .from("listings")
        .select("title, category")
        .eq("id", record.listing_id)
        .single(),
      supabase.auth.admin.getUserById(record.to_user),
      supabase.auth.admin.getUserById(record.from_user),
    ]);

    const listing = listingRes.data;
    const toEmail = toUserRes.data?.user?.email;
    const fromEmail = fromUserRes.data?.user?.email;

    if (!toEmail || !listing) {
      console.error("new-message webhook: missing listing or recipient", {
        listing,
        toEmail,
      });
      return NextResponse.json({ ok: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sparefins.co.nz";
    const category = listing.category === "board" ? "boards" : "fins";
    const listingUrl = `${appUrl}/${category}/${record.listing_id}`;
    const replyUrl = `${appUrl}/messages/${record.listing_id}/${record.from_user}`;

    // Trim body preview to avoid huge emails
    const preview =
      record.body.length > 500
        ? record.body.slice(0, 500) + "…"
        : record.body;

    const fromDisplay = fromEmail
      ? fromEmail.split("@")[0]
      : "Someone";

    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ??
        "Sparefins <notifications@sparefins.co.nz>",
      to: toEmail,
      subject: `New message about: ${listing.title}`,
      html: emailHtml({
        listingTitle: listing.title,
        listingUrl,
        replyUrl,
        fromDisplay,
        body: preview,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
    }
  } catch (err) {
    console.error("new-message webhook error:", err);
    // Return 200 so Supabase doesn't keep retrying on transient errors
  }

  return NextResponse.json({ ok: true });
}

// ── Email template ─────────────────────────────────────────────────────────

function emailHtml({
  listingTitle,
  listingUrl,
  replyUrl,
  fromDisplay,
  body,
}: {
  listingTitle: string;
  listingUrl: string;
  replyUrl: string;
  fromDisplay: string;
  body: string;
}) {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New message on Sparefins</title>
</head>
<body style="margin:0;padding:0;background:#f8f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:24px;">
              <a href="${listingUrl}" style="font-size:20px;font-weight:700;color:#0d9488;text-decoration:none;">Sparefins</a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:28px;">

              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">New message</p>
              <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;line-height:1.3;">
                ${escapeHtml(fromDisplay)} sent you a message
              </h1>

              <!-- Listing pill -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:10px 14px;">
                    <p style="margin:0;font-size:12px;color:#0f766e;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Listing</p>
                    <a href="${listingUrl}" style="font-size:14px;font-weight:600;color:#0d9488;text-decoration:none;">${escapeHtml(listingTitle)}</a>
                  </td>
                </tr>
              </table>

              <!-- Message body -->
              <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">${escaped}</p>
              </div>

              <!-- CTA -->
              <a href="${replyUrl}"
                 style="display:inline-block;background:#14b8a6;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                Reply to message
              </a>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;font-size:12px;color:#9ca3af;text-align:center;">
              <p style="margin:0;">You're receiving this because someone messaged one of your Sparefins listings.</p>
              <p style="margin:4px 0 0;">
                <a href="${listingUrl}" style="color:#9ca3af;">View listing</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
