export interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);

    // Expect /c/<token>
    if (parts[0] !== "c" || !parts[1]) {
      return new Response("Not found", { status: 404 });
    }

    const token = parts[1];

    // Look up where to send them
    const link = await env.DB
      .prepare("SELECT destination, campaign_id, recipient_id FROM links WHERE token = ?")
      .bind(token)
      .first<{ destination: string; campaign_id: string; recipient_id: string }>();

    if (!link) return new Response("Invalid link", { status: 404 });

    // Log click
    await env.DB
      .prepare(
        "INSERT INTO clicks(token, campaign_id, recipient_id, clicked_at, ip, ua) VALUES(?, ?, ?, datetime('now'), ?, ?)"
      )
      .bind(
        token,
        link.campaign_id,
        link.recipient_id,
        request.headers.get("CF-Connecting-IP"),
        request.headers.get("User-Agent")
      )
      .run();

    // Redirect to the destination
    return Response.redirect(link.destination, 302);
  },
};
