import { createFileRoute } from "@tanstack/react-router";

import { services } from "../content/services";

/**
 * Sitemap built from the same content layer the pages render, so a new service
 * is indexed automatically without a second list to maintain.
 * URLs are absolute, derived from the request host at serve time.
 */
const STATIC_PATHS = ["/", "/services", "/about", "/faq", "/contact", "/privacy", "/terms"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        const paths = [
          ...STATIC_PATHS,
          ...services.map((service) => `/services/${service.slug}`),
        ];
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
