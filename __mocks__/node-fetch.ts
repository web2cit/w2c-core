// cannot import RequestInfo type dynamically with import()
// https://stackoverflow.com/questions/68983419/dynamically-import-type-in-typesript
import { Response, RequestInfo } from 'node-fetch';

const { default: fetch } = jest.requireActual('node-fetch') as typeof import('node-fetch');
const mockFetch: typeof fetch = function(url: RequestInfo): Promise<Response> {
    if (typeof url !== "string") {
        throw new Error('Mock fetch unable to handle non-string URLs.')
    }
    const response = mockResponseMap.get(url);
    if (response) {
        return Promise.resolve(response);
    } else {
        return Promise.reject(Response.error());
    }
}
mockFetch.isRedirect = fetch.isRedirect;

let mockResponseMap: Map<string, Response> = new Map();
export function __setMockResponseMap(
    responseMap: Map<string, Response>
): void {
    mockResponseMap = responseMap;
}

export default mockFetch;
export * from 'node-fetch';
