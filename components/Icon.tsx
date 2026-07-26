const PATHS: Record<string, string> = {
  diamond: '<polygon points="12,2 20,9 12,22 4,9" fill="none" stroke="currentColor" stroke-width="1"/><path d="M4 9 h16 M12 2 L8.5 9 L12 22 M12 2 L15.5 9 L12 22" stroke="currentColor" stroke-width=".4" fill="none"/>',
  ruby: '<polygon points="12,2 20,9 12,22 4,9" fill="none" stroke="currentColor" stroke-width="1"/><path d="M8 5.5 L16 12.6" stroke="currentColor" stroke-width=".4"/>',
  emeraldst: '<rect x="6" y="4" width="12" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="9" y="7" width="6" height="10" fill="none" stroke="currentColor" stroke-width=".4"/>',
  sapphire: '<ellipse cx="12" cy="12" rx="8" ry="9" fill="none" stroke="currentColor" stroke-width="1"/><ellipse cx="12" cy="12" rx="4" ry="5" fill="none" stroke="currentColor" stroke-width=".4"/>',
  round: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width=".4"/>',
  princess: '<rect x="5" y="5" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1"/><path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" stroke-width=".35"/>',
  cushion: '<rect x="4.5" y="4.5" width="15" height="15" rx="5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="8" y="8" width="8" height="8" rx="2.5" fill="none" stroke="currentColor" stroke-width=".35"/>',
  emeraldcut: '<rect x="5.5" y="3.5" width="13" height="17" rx="1.5" fill="none" stroke="currentColor" stroke-width="1"/><rect x="8.5" y="6.5" width="7" height="11" fill="none" stroke="currentColor" stroke-width=".35"/>',
  marquise: '<path d="M12 2 C18 8 18 16 12 22 C6 16 6 8 12 2 Z" fill="none" stroke="currentColor" stroke-width="1"/>',
  oval: '<ellipse cx="12" cy="12" rx="6.5" ry="9.5" fill="none" stroke="currentColor" stroke-width="1"/>',
  radiant: '<polygon points="8,3.5 16,3.5 20,8 20,16 16,20.5 8,20.5 4,16 4,8" fill="none" stroke="currentColor" stroke-width="1"/>',
  asscher: '<rect x="5" y="5" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1"/><rect x="8" y="8" width="8" height="8" fill="none" stroke="currentColor" stroke-width=".35"/>',
  ring: '<circle cx="12" cy="14" r="7" fill="none" stroke="currentColor" stroke-width="1"/><polygon points="12,1.5 15.5,5 12,9.5 8.5,5" fill="none" stroke="currentColor" stroke-width=".9"/>',
  halo: '<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width=".5" stroke-dasharray="2 2.4"/>',
  three: '<circle cx="12" cy="11" r="4.5" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="4.5" cy="13" r="2.8" fill="none" stroke="currentColor" stroke-width=".75"/><circle cx="19.5" cy="13" r="2.8" fill="none" stroke="currentColor" stroke-width=".75"/>',
  vintage: '<circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M12 2 v3 M12 19 v3 M2 12 h3 M19 12 h3 M4.9 4.9 l2.2 2.2 M16.9 16.9 l2.2 2.2 M19.1 4.9 l-2.2 2.2 M7.1 16.9 l-2.2 2.2" stroke="currentColor" stroke-width=".75"/>',
  band: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width=".5"/>',
  heart: '<path d="M12 20 C4 13.5 4.5 7 8.6 6 C11 5.5 12 7.6 12 7.6 C12 7.6 13 5.5 15.4 6 C19.5 7 20 13.5 12 20 Z" fill="none" stroke="currentColor" stroke-width="1"/>',
  quill: '<path d="M5 19 C7 10 13 4.5 19.5 3.5 C18 10.5 12.5 16.5 6.5 18.2 M5 19 L8.5 15.5" fill="none" stroke="currentColor" stroke-width=".9"/>',
  spark: '<path d="M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z" fill="none" stroke="currentColor" stroke-width=".8"/>',
  two: '<circle cx="9" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width=".85"/><circle cx="15" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width=".85"/>',
  fam: '<circle cx="7" cy="7" r="2.6" fill="none" stroke="currentColor" stroke-width=".8"/><circle cx="17" cy="7" r="2.6" fill="none" stroke="currentColor" stroke-width=".8"/><path d="M2.5 20 c0-4 2-6.5 4.5-6.5 s4.5 2.5 4.5 6.5 M12.5 20 c0-4 2-6.5 4.5-6.5 s4.5 2.5 4.5 6.5" fill="none" stroke="currentColor" stroke-width=".8"/>',
  letter: '<rect x="3" y="6" width="18" height="13" rx="1" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M3.5 7 L12 13.5 L20.5 7" fill="none" stroke="currentColor" stroke-width=".8"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="1.5" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M4 9.5 h16 M8.5 3 v4 M15.5 3 v4" stroke="currentColor" stroke-width=".8"/>',
  none: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width=".9"/><path d="M5.6 5.6 L18.4 18.4" stroke="currentColor" stroke-width=".8"/>',
  beach: '<path d="M3 18 h18 M6 18 C7.5 12 10 8.5 14 6.5 M14 6.5 C12 5.5 9.5 5.8 8 7 M14 6.5 C15.8 4.8 18.4 4.6 20 5.6 M14 6.5 C15.5 7.5 16.4 9.6 16 11.5" fill="none" stroke="currentColor" stroke-width=".95"/>',
  mtn: '<path d="M3 19 L10 6 L14 13 L17 8.5 L21 19 Z" fill="none" stroke="currentColor" stroke-width="1"/>',
  dine: '<path d="M7 3 v7 M4.5 3 v4.5 a2.5 2.5 0 0 0 5 0 V3 M7 10 v11 M16.5 3 c-2.5 1.5 -2.5 8 0 9.5 V21 M16.5 3 v18" fill="none" stroke="currentColor" stroke-width=".95"/>',
  tux: '<path d="M12 3 L8 7 L10.2 9 L9 21 h6 L13.8 9 L16 7 Z M10.5 21 L12 13 L13.5 21" fill="none" stroke="currentColor" stroke-width=".8"/>'
};

export default function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const path = PATHS[name] || PATHS.diamond;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}
