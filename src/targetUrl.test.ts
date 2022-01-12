import { TargetUrl } from "./targetUrl";

describe("Good URL", () => {
  const urlString = "https://www.abc.example.com/path/to/route?abc=123&def=234";
  const url = new TargetUrl(urlString);

  it("isolates the domain", () => {
    expect(url.domain).toBe("www.abc.example.com");
  });

  it("isolates the path and query string", () => {
    expect(url.path).toBe("/path/to/route?abc=123&def=234");
  });
});
