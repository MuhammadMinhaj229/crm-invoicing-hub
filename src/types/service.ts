export interface ServiceStep {
  step: number;
  title: string;
  description: string;
}

export interface ServiceDefinition {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  /** Lucide icon name, resolved in the UI layer. */
  icon: string;
  features: string[];
  deliverables: string[];
  process: ServiceStep[];
  /** No invented prices. We state how pricing is agreed, not a number. */
  pricingNote: string;
  seo: {
    title: string;
    description: string;
  };
}
