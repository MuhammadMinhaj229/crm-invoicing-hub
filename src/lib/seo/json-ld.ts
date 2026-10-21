import { blueprint, faqsForDocument, services, type ServiceSummary } from "../site/blueprint";
import type { PageDocument } from "../page-builder/model";

/**
 * Structured data generated from the same seed/published documents the pages
 * render. Fields without a real value are omitted, never invented.
 */
export function organizationSchema() {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: blueprint.brand.name,
  };
  if (blueprint.brand.description) schema["description"] = blueprint.brand.description;
  if (blueprint.brand.motto) schema["slogan"] = blueprint.brand.motto;
  if (blueprint.contact.email) schema["email"] = blueprint.contact.email;
  if (blueprint.contact.phone) schema["telephone"] = blueprint.contact.phone;
  if (blueprint.serviceAreas.length) schema["areaServed"] = blueprint.serviceAreas;
  return schema;
}

export function serviceSchema(service: ServiceSummary) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    serviceType: service.title,
    provider: { "@type": "Organization", name: blueprint.brand.name },
  };
}

export function serviceListSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: service.title,
      description: service.shortDescription,
      url: service.path,
    })),
  };
}

export function faqSchema(document: PageDocument | null) {
  const items = faqsForDocument(document);
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.url,
    })),
  };
}
