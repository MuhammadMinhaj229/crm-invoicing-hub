import { site } from "../../content/site";
import { services } from "../../content/services";
import { faqs } from "../../content/faqs";
import type { ServiceDefinition } from "../../types/service";

/**
 * Structured data is generated from the same content layer the pages render,
 * so a schema can never claim something the visitor does not see.
 * Fields with no real value are omitted rather than filled with placeholders.
 */
export function organizationSchema() {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.brand.name,
    description: site.brand.description,
    slogan: site.brand.motto,
  };
  if (site.contact.email) schema['email'] = site.contact.email;
  if (site.contact.phone) schema['telephone'] = site.contact.phone;
  if (site.serviceAreas.length) schema['areaServed'] = site.serviceAreas;
  return schema;
}

export function serviceSchema(service: ServiceDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    serviceType: service.title,
    provider: { "@type": "Organization", name: site.brand.name },
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
      url: `/services/${service.slug}`,
    })),
  };
}

export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
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
