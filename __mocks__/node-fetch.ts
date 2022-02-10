// cannot import RequestInfo type dynamically with import()
// https://stackoverflow.com/questions/68983419/dynamically-import-type-in-typesript
import { Response, RequestInit, RequestInfo, ResponseInit } from 'node-fetch';

const { default: fetch } = jest.requireActual('node-fetch') as typeof import('node-fetch');
const mockFetch: typeof fetch = function(url: RequestInfo, init?: RequestInit): Promise<Response> {
    if (typeof url !== "string") {
        throw new Error('Mock fetch unable to handle non-string URLs.')
    }
    const response = (
        mockResponseMap.get(url) || new Response(undefined, {status: 404})
    );
    // fetch only rejects promise in case of network errors
    return Promise.resolve(response);
}
mockFetch.isRedirect = fetch.isRedirect;

const mockResponseMap: Map<string, Response> = new Map();

export function __setMockResponse(
    reqUrl: string,
    resBody: string,
    resInit?: ResponseInit
): void {
    const response = new Response(resBody, resInit);
    mockResponseMap.set(reqUrl, response);
}

export function __clearMockResponses(): void {
    mockResponseMap.clear();
}

export default mockFetch;
export * from 'node-fetch';
