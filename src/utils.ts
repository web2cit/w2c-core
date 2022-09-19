import fetch, { Headers } from "node-fetch";

/**
 * Return whether the host name provided is a valid fully qualified domain name
 * https://en.wikipedia.org/wiki/Fully_qualified_domain_name
 */
export function isDomainName(hostname: string): boolean {
  // remove trailing dot
  hostname = hostname.replace(/\.$/, "");

  // max 255 octets https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873
  if (hostname.length > 253) return false;

  const labels = hostname.split(".");

  // at least two labels: label + tld
  if (labels.length < 2) return false;

  // letters, numbers or hyphen, do not start or end with hyphen
  const labelPattern = /^([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
  for (const label of labels) {
    if (!labelPattern.test(label)) return false;
    if (label.length > 63) return false;
  }

  return true;
}

export function normalizeUrlPath(path: string): string {
  const url = new URL(path, "https://example.com");
  const normalizedPath = url.pathname + url.search;
  return normalizedPath;
}

// wrap the fetch function to enable defining some global settings, such as
// user-agent header
class FetchWrapper {
  userAgent?: string;
  userAgentHeaderName = "user-agent";
  // defines custom fetch functions to be used for specific origins
  // this is needed to circumvent CORS restrictions in w2c-editor
  customFetchByOrigin = new Map();
  // headers: Headers;

  fetch(
    ...[url, init = {}]: Parameters<typeof fetch>
  ): ReturnType<typeof fetch> {
    let origin;
    if (typeof url === "string")
      try {
        origin = new URL(url).origin;
      } catch {
        //
      }
    const customFetch = this.customFetchByOrigin.get(origin);
    if (customFetch) {
      return customFetch(url, init);
    } else {
      const headers = new Headers(init.headers);
      if (!headers.has(this.userAgentHeaderName) && this.userAgent) {
        headers.set(this.userAgentHeaderName, this.userAgent);
      }
      init.headers = headers;
      return fetch(url, init);
    }
  }
}

export const fetchWrapper = new FetchWrapper();
