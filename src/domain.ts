class Domain {
  domain: string;
  constructor(domain: string) {
    this.domain = domain;
  }
}

export { Domain };

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

export class DomainNameError extends Error {
  constructor(domain: string) {
    super(`"${domain}" is not a valid domain name`);
  }
}
