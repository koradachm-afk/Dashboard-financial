const UNKNOWN = "ไม่ทราบ";

// Order matters: Edge UAs also contain "Chrome/", and Chrome UAs also contain "Safari/".
const BROWSERS: readonly [name: string, pattern: RegExp][] = [
  ["Edge", /Edg(?:e|A|iOS)?\/(\d+)/],
  ["Firefox", /Firefox\/(\d+)/],
  ["Chrome", /Chrome\/(\d+)/],
  ["Safari", /Version\/(\d+)[^]*Safari\//],
];

// Order matters: iOS UAs say "like Mac OS X", Android UAs say "Linux".
const SYSTEMS: readonly [name: string, pattern: RegExp][] = [
  ["Windows", /Windows NT/],
  ["iOS", /iPhone|iPad/],
  ["Android", /Android/],
  ["macOS", /Mac OS X/],
  ["Linux", /Linux/],
];

/** Small, best-effort label for the audit log (major version only). Unknown parts read "ไม่ทราบ". */
export function describeUserAgent(ua: string): { browser: string; os: string; label: string } {
  let browser = UNKNOWN;
  let version = "";
  for (const [name, pattern] of BROWSERS) {
    const match = pattern.exec(ua);
    if (match) {
      browser = name;
      version = match[1] ?? "";
      break;
    }
  }
  // Safari without a Version/ token: name known, version unknown
  if (browser === UNKNOWN && /Safari\//.test(ua)) browser = "Safari";

  const os = SYSTEMS.find(([, pattern]) => pattern.test(ua))?.[0] ?? UNKNOWN;
  const name = version ? `${browser} ${version}` : browser;
  return { browser, os, label: `${name} · ${os}` };
}
