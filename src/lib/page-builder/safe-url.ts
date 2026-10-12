/**
 * Shared URL allow-list for page-builder documents and render-time links.
 *
 * Keep this module dependency-light so public rendering does not need to import
 * the full Zod schema registry merely to validate a link.
 */
function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
}

export function isSafeHref(value: string): boolean {
  const href = value.trim();
  if (href === "" || href === "whatsapp" || href === "phone" || href === "email") return true;
  if (hasControlCharacters(href) || href.includes("\\\\")) return false;
  if (href.startsWith("#")) return /^#[A-Za-z0-9_.:-]*$/.test(href);
  if (href.startsWith("/")) return !href.startsWith("//");
  try {
    const url = new URL(href);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isSafeAssetReference(value: string): boolean {
  const source = value.trim();
  if (source === "") return true;
  if (hasControlCharacters(source) || source.includes("\\\\")) return false;
  if (source.startsWith("/")) return !source.startsWith("//");
  try {
    const url = new URL(source);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}
