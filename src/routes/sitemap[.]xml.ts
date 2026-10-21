import { createFileRoute } from "@tanstack/react-router";

import { routablePages } from "../lib/site/blueprint";

/** Sitemap built from the seed's page list — a new page is indexed automatically. */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const paths = [...new Set(routablePages.map((p) => p.path))];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (path) =>
      `  <url><loc>${origin}${path}</loc><changefreq>weekly</changefreq><priority>${path === "/" ? "1.0" : "0.7"}</priority></url>`,
  )
  .join("\n")}
</urlset>`;
        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
