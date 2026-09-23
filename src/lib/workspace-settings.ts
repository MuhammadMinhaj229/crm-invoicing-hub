/**
 * Workspace settings — every visible aspect of the console is driven
 * from here: branding, theme palette, navigation, currency, lifecycle
 * stages, lead sources and retention rules.
 *
 * Values live in this browser (localStorage) and, once the database is
 * connected, are mirrored into the `app_settings` table so the whole
 * team shares one configuration. Nothing visual is hardcoded in the
 * pages themselves.
 */
import { getSupabase } from "./supabase";

export interface ThemeSettings {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  radius: number;
  density: "comfortable" | "compact";
  sidebarStyle: "warm" | "plain";
  headingScale: number;
  buttonStyle: "soft" | "square";
}

export interface BrandingSettings {
  name: string;
  tagline: string;
  initial: string;
  logoUrl: string;
  faviconUrl: string;
  /** "lockup" draws the SAFAR mark in code; "image" uses the logo picture. */
  logoStyle: "lockup" | "image";
}

export interface WebsiteAppearanceSettings {
  sectionStyle: "zigzag" | "grid";
  showHeroHighlights: boolean;
  showTrustSection: boolean;
  showProcessSection: boolean;
  showFaqSection: boolean;
}

export interface NavItemSetting {
  id: string;
  label: string;
  enabled: boolean;
}

export interface RetentionSettings {
  /** Days of silence before a customer counts as at risk. */
  defaultInactivityDays: number;
  /** Optional per-service-category overrides, e.g. Groceries: 7. */
  categoryOverrides: { category: string; days: number }[];
  /** Days after which an at-risk customer is treated as churned. */
  churnedAfterDays: number;
  autoFollowUpTask: boolean;
}

export interface WorkspaceSettings {
  branding: BrandingSettings;
  theme: ThemeSettings;
  nav: NavItemSetting[];
  currency: string;
  locale: string;
  leadSources: string[];
  lifecycleStages: string[];
  leadStatuses: string[];
  serviceCategories: string[];
  retention: RetentionSettings;
  websiteAppearance: WebsiteAppearanceSettings;
}

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  branding: {
    name: "SAFAR N MANZIL",
    tagline: "We do. We assist. We connect.",
    initial: "S",
    logoUrl: "",
    faviconUrl: "",
    logoStyle: "lockup",
  },
  theme: {
    primary: "#FF9B70",
    secondary: "#FFC2A3",
    accent: "#FFDCCB",
    background: "#FFF8F3",
    foreground: "#18294A",
    radius: 8,
    density: "comfortable",
    sidebarStyle: "warm",
    headingScale: 100,
    buttonStyle: "soft",
  },
  nav: [
    { id: "/dashboard", label: "Dashboard", enabled: true },
    { id: "/website", label: "Website", enabled: true },
    { id: "/customers", label: "Customers", enabled: true },
    { id: "/operations", label: "Service Requests", enabled: true },
    { id: "/vendors", label: "Vendors & Partners", enabled: true },
    { id: "/tools", label: "Tools", enabled: true },
    { id: "/settings", label: "Settings", enabled: true },
  ],

  currency: "INR",
  locale: "en-IN",
  leadSources: [
    "Website",
    "WhatsApp",
    "Instagram",
    "Facebook",
    "LinkedIn",
    "Referral",
    "Community",
    "Campaign",
    "Manual entry",
  ],
  lifecycleStages: [
    "LEAD",
    "QUALIFIED",
    "CONVERTED",
    "CUSTOMER",
    "ACTIVE",
    "INACTIVE",
    "CHURN_RISK",
    "REACTIVATED",
  ],
  leadStatuses: ["new", "contacted", "qualified", "converted", "lost"],
  serviceCategories: [
    "Groceries & Essentials",
    "Fresh Produce",
    "Parcel & Logistics",
    "Home Services",
    "Healthcare Assistance",
    "Documentation & Legal",
    "Property & Coordination",
  ],
  retention: {
    defaultInactivityDays: 7,
    categoryOverrides: [],
    churnedAfterDays: 30,
    autoFollowUpTask: true,
  },
  websiteAppearance: {
    sectionStyle: "zigzag",
    showHeroHighlights: true,
    showTrustSection: true,
    showProcessSection: true,
    showFaqSection: true,
  },
};

const STORAGE_KEY = "safar.workspace.settings";
const listeners = new Set<() => void>();

function merge(stored: unknown): WorkspaceSettings {
  if (!stored || typeof stored !== "object") return DEFAULT_SETTINGS;
  const value = stored as Partial<WorkspaceSettings>;
  return {
    branding: { ...DEFAULT_SETTINGS.branding, ...(value.branding ?? {}) },
    theme: { ...DEFAULT_SETTINGS.theme, ...(value.theme ?? {}) },
    // Keep saved menu order/labels, but surface any newly shipped sections.
    nav: value.nav?.length
      ? [
          ...value.nav,
          ...DEFAULT_SETTINGS.nav.filter(
            (item) => !value.nav?.some((saved) => saved.id === item.id),
          ),
        ]
      : DEFAULT_SETTINGS.nav,

    currency: value.currency ?? DEFAULT_SETTINGS.currency,
    locale: value.locale ?? DEFAULT_SETTINGS.locale,
    leadSources: value.leadSources?.length ? value.leadSources : DEFAULT_SETTINGS.leadSources,
    lifecycleStages: value.lifecycleStages?.length
      ? value.lifecycleStages
      : DEFAULT_SETTINGS.lifecycleStages,
    leadStatuses: value.leadStatuses?.length ? value.leadStatuses : DEFAULT_SETTINGS.leadStatuses,
    serviceCategories: value.serviceCategories?.length
      ? value.serviceCategories
      : DEFAULT_SETTINGS.serviceCategories,
    retention: { ...DEFAULT_SETTINGS.retention, ...(value.retention ?? {}) },
    websiteAppearance: {
      ...DEFAULT_SETTINGS.websiteAppearance,
      ...(value.websiteAppearance ?? {}),
    },
  };
}

let cache: WorkspaceSettings | null = null;

export function getWorkspaceSettings(): WorkspaceSettings {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    cache = merge(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    cache = DEFAULT_SETTINGS;
  }
  return cache;
}

export function saveWorkspaceSettings(next: WorkspaceSettings): void {
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

/** Loads the shared configuration when the connected project has been initialized. */
export async function loadSharedWorkspaceSettings(): Promise<WorkspaceSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "workspace")
    .maybeSingle();
  if (error || !data) return null;
  const next = merge((data as { value?: unknown }).value);
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
  return next;
}

/** Publishes configuration for the public website and every signed-in team member. */
export async function saveSharedWorkspaceSettings(next: WorkspaceSettings): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "workspace", value: next, updated_by: userData.user.id }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export function resetWorkspaceSettings(): void {
  cache = DEFAULT_SETTINGS;
  window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

export function onWorkspaceSettingsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Applies branding + palette to the document as CSS custom properties. */
export function applyTheme(settings: WorkspaceSettings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const { theme } = settings;
  const readable = (hex: string) => (isLight(hex) ? theme.foreground : "#FFFFFF");

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", readable(theme.primary));
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--secondary-foreground", readable(theme.secondary));
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-foreground", readable(theme.accent));
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--foreground", theme.foreground);
  root.style.setProperty("--card", "#FFFFFF");
  root.style.setProperty("--card-foreground", theme.foreground);
  root.style.setProperty("--popover", "#FFFFFF");
  root.style.setProperty("--popover-foreground", theme.foreground);
  root.style.setProperty("--ring", theme.primary);
  root.style.setProperty(
    "--sidebar",
    theme.sidebarStyle === "warm" ? mix(theme.background, "#FFFFFF", 0.45) : "#FFFFFF",
  );
  root.style.setProperty("--sidebar-foreground", theme.foreground);
  root.style.setProperty("--sidebar-accent", mix(theme.accent, "#FFFFFF", 0.7));
  root.style.setProperty("--sidebar-accent-foreground", theme.foreground);
  root.style.setProperty("--sidebar-border", mix(theme.foreground, theme.background, 0.88));
  root.style.setProperty("--border", mix(theme.foreground, theme.background, 0.86));
  root.style.setProperty("--input", mix(theme.foreground, theme.background, 0.82));
  root.style.setProperty("--muted", mix(theme.background, "#FFFFFF", 0.4));
  root.style.setProperty("--muted-foreground", mix(theme.foreground, theme.background, 0.45));
  root.style.setProperty("--radius", `${theme.radius}px`);
  root.style.setProperty("--heading-scale", `${theme.headingScale / 100}`);
  root.dataset["buttonStyle"] = theme.buttonStyle;
  root.dataset["density"] = theme.density;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = Number.parseInt(full.slice(0, 6) || "000000", 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function isLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 165;
}

/** Blends `a` into `b` by `weight` (0 = all a, 1 = all b). */
function mix(a: string, b: string, weight: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const channel = (x: number, y: number) =>
    Math.round(x + (y - x) * weight)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}

/** Currency formatter driven by the configured currency + locale. */
export function formatMoney(amount: number, settings: WorkspaceSettings): string {
  return new Intl.NumberFormat(settings.locale, {
    style: "currency",
    currency: settings.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
