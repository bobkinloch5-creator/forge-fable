import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: { handlers: { GET: async () => {
    const entries = [{ path: "/", priority: "1.0" }, { path: "/auth", priority: "0.2" }];
    const urls = entries.map((entry) => `  <url>\n    <loc>${BASE_URL}${entry.path}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`);
    return new Response([`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`, ...urls, `</urlset>`].join("\n"), { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
  } } },
});