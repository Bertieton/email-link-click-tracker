export default {
  async fetch(): Promise<Response> {
    return new Response("WORKER HIT ✅", { status: 200 });
  },
};
