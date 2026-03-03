export interface FriendlyErrorMessage {
  label: string;
  summary: string;
  technical: string;
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function humanizeToken(value: string | null | undefined): string {
  if (!value) return "unknown resource";
  const normalized = value
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return normalized ? titleCase(normalized) : "unknown resource";
}

function extractUrl(raw: string): URL | null {
  const match = raw.match(/https?:\/\/[^\s]+/i);
  if (!match) return null;
  try {
    return new URL(match[0]);
  } catch {
    return null;
  }
}

function endpointFromUrl(raw: string): string | null {
  const url = extractUrl(raw);
  if (!url) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return url.hostname;
  return humanizeToken(last);
}

function iconInfo(raw: string): { iconType: string; iconName: string } | null {
  const match = raw.match(/icon\s+([a-z-]+):([a-z0-9-]+)/i);
  if (!match) return null;
  return {
    iconType: humanizeToken(match[1]),
    iconName: humanizeToken(match[2]),
  };
}

function normalize(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\s+/g, " ").trim();
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function toFriendlyError(rawMessage: string | null | undefined): FriendlyErrorMessage {
  const technical = normalize(rawMessage);
  if (!technical || technical.toLowerCase() === "nan") {
    return {
      label: "No error sample captured",
      summary: "No raw error message was captured for this group.",
      technical: technical || "n/a",
    };
  }

  if (/cannot read properties of null \(reading ['"]?0['"]?\)/i.test(technical)) {
    return {
      label: "Empty selection used in UI",
      summary:
        "The UI tried to read the first item from an empty selection. Add a null/length guard before indexing.",
      technical,
    };
  }

  if (/\[object object\]/i.test(technical)) {
    return {
      label: "App error details missing",
      summary:
        "Something went wrong, but the app did not send readable error details.",
      technical,
    };
  }

  if (/http failure response/i.test(technical) && /\/technology-names\b/i.test(technical) && /: 0 unknown error/i.test(technical)) {
    return {
      label: "Net/CORS issue: Technology catalog API unavailable",
      summary:
        "The app could not load the technology-name catalog because the request failed before any HTTP response (often CORS/network).",
      technical,
    };
  }

  if (/error retrieving icon/i.test(technical) && /404/i.test(technical)) {
    const icon = iconInfo(technical);
    const label = icon
      ? `Missing ${icon.iconType.toLowerCase()} icon (${icon.iconName})`
      : "Missing CDN icon file";
    return {
      label,
      summary:
        "The app requested an icon file that does not exist at the configured CDN path (404). Users may see blank icons.",
      technical,
    };
  }

  if (/error retrieving icon/i.test(technical) && /: 0 unknown error/i.test(technical)) {
    const icon = iconInfo(technical);
    const label = icon
      ? `Icon request blocked (${icon.iconName})`
      : "Icon request failed before response";
    return {
      label,
      summary:
        "The icon request failed before receiving an HTTP response. This usually indicates CORS, network, or CDN availability issues.",
      technical,
    };
  }

  if (/http failure response/i.test(technical) && /: 0 unknown error/i.test(technical)) {
    const endpoint = endpointFromUrl(technical);
    return {
      label: endpoint ? `Network/CORS issue: ${endpoint}` : "Network request failed before response",
      summary:
        "The request did not receive an HTTP response (status 0). Typical causes are CORS policy, blocked cross-origin calls, or transient network/CDN failures.",
      technical,
    };
  }

  if (/http failure response/i.test(technical)) {
    const endpoint = endpointFromUrl(technical);
    return {
      label: endpoint ? `HTTP request failed: ${endpoint}` : "HTTP request failed",
      summary:
        "The backend returned a non-success HTTP status. Review endpoint health, routing, and response handling.",
      technical,
    };
  }

  if (/<svg>\s*tag\s*not\s*found/i.test(technical)) {
    return {
      label: "Invalid SVG icon payload",
      summary:
        "An icon response was received but did not contain a valid SVG document, so rendering failed.",
      technical,
    };
  }

  if (/127\.0\.0\.1|localhost/i.test(technical)) {
    return {
      label: "Local development request noise",
      summary:
        "This error originates from local development URLs and is usually not a production user issue.",
      technical,
    };
  }

  return {
    label: "Application error",
    summary: "The app emitted an unclassified error. Review the raw message for exact context.",
    technical,
  };
}
