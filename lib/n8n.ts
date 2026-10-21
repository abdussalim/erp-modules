// Sends an event to the n8n webhook. Never throws: the app must work without n8n.
export async function notifyN8n(event: string, data: object) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return; // n8n not configured, skip silently
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...data }),
    });
  } catch (err) {
    console.error("n8n notify failed:", err);
  }
}
