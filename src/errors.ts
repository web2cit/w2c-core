import { Response } from "node-fetch";

export class HTTPResponseError extends Error {
  response: Response;
  url: string;
  constructor(reqUrl: string, response: Response) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`);
    this.url = reqUrl;
    this.response = response;
    this.name = "HTTPResponseError";
  }
}

export class DomainNameError extends Error {
  constructor(domain: string) {
    super(`"${domain}" is not a valid domain name`);
  }
}
