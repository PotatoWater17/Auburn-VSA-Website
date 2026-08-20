/**
 * Auburn VSA Email Worker
 * - Receives info@ / sale@ via Cloudflare Email Routing
 * - POSTs a JSON copy to the site inbound webhook for Admin Mail only
 * - Does NOT forward to personal Gmail
 */
function extractTextPlain(raw) {
  const lower = raw.toLowerCase();
  const idx = lower.indexOf("content-type: text/plain");
  if (idx === -1) {
    const split = raw.split(/\r?\n\r?\n/);
    if (split.length >= 2) return split.slice(1).join("\n\n").slice(0, 200000);
    return "";
  }
  const after = raw.slice(idx);
  const bodyStart = after.search(/\r?\n\r?\n/);
  if (bodyStart === -1) return "";
  let body = after.slice(bodyStart).replace(/^\r?\n\r?\n/, "");
  const boundaryMatch = raw.match(/boundary="?([^"\r\n;]+)"?/i);
  if (boundaryMatch) {
    const bound = "--" + boundaryMatch[1];
    const cut = body.indexOf(bound);
    if (cut !== -1) body = body.slice(0, cut);
  }
  return body.replace(/\r\n/g, "\n").trim().slice(0, 200000);
}

function headerValue(raw, name) {
  const re = new RegExp("^" + name + ":\\s*(.+)$", "im");
  const m = raw.match(re);
  return m ? m[1].trim() : "";
}

function mailboxFromTo(to) {
  const t = String(to || "").toLowerCase();
  if (t.startsWith("sale@") || t.includes("<sale@")) return "sale";
  if (t.startsWith("info@") || t.includes("<info@")) return "info";
  if (/^sale\+/i.test(t) || /<sale\+/i.test(t)) return "sale";
  if (/^info\+/i.test(t) || /<info\+/i.test(t)) return "info";
  return "";
}

export default {
  async email(message, env) {
    const inboundUrl = (env.MAIL_INBOUND_URL || "").trim();
    const secret = (env.MAIL_INBOUND_SECRET || "").trim();

    if (!inboundUrl || !secret) {
      console.log("inbound_skip_missing_env");
      // Reject so the sender gets a bounce instead of silent drop when misconfigured.
      message.setReject("Mailbox temporarily unavailable");
      return;
    }

    let raw = "";
    try {
      raw = await new Response(message.raw).text();
    } catch (e) {
      raw = "";
    }

    const text = extractTextPlain(raw);
    const subject = headerValue(raw, "Subject") || "(no subject)";
    const messageId = headerValue(raw, "Message-ID") || headerValue(raw, "Message-Id");
    const inReplyTo = headerValue(raw, "In-Reply-To");
    const references = headerValue(raw, "References");
    const mailbox = mailboxFromTo(message.to) || "info";

    const payload = {
      mailbox,
      from: message.from || headerValue(raw, "From"),
      to: [message.to],
      subject,
      text,
      date: new Date().toISOString(),
      messageId,
      inReplyTo,
      references,
    };

    try {
      const res = await fetch(inboundUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // Prefer X-Mail-Secret — some Cloudflare edge paths strip Authorization.
          "x-mail-secret": secret,
          authorization: "Bearer " + secret,
        },
        body: JSON.stringify(payload),
      });
      console.log("inbound_post", res.status);
      if (!res.ok) {
        message.setReject("Mailbox temporarily unavailable");
      }
    } catch (e) {
      console.log("inbound_post_failed", String(e));
      message.setReject("Mailbox temporarily unavailable");
    }
  },
};
