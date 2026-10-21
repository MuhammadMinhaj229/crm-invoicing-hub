/**
 * Business facts for the public website, derived from `seed.json`.
 * Do not add copy here — edit the seed (or the builder after bootstrap).
 */
import { blueprint } from "../lib/site/blueprint";
import type { SiteConfig } from "../types/site";

export const site: SiteConfig = {
  brand: {
    name: blueprint.brand.name,
    tagline: blueprint.brand.tagline,
    description: blueprint.brand.description,
    motto: blueprint.brand.motto,
  },
  contact: { ...blueprint.contact },
  location: { ...blueprint.location },
  serviceAreas: [...blueprint.serviceAreas],
  hours: blueprint.hours,
  navigation: blueprint.navigation.map((l) => ({ ...l })),
  legalLinks: blueprint.legalLinks.map((l) => ({ ...l })),
  cta: { ...blueprint.cta },
};
