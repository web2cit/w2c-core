// cannot import RequestInfo type dynamically with import()
// https://stackoverflow.com/questions/68983419/dynamically-import-type-in-typesript
import { Response, RequestInit, RequestInfo, ResponseInit } from 'node-fetch';
import { CITOID_API_ENDPOINT } from '../src/config';

const { default: fetch } = jest.requireActual('node-fetch') as typeof import('node-fetch');

type ResponseDescription = {
    resBody?: string,
    resInit?: ResponseInit
};

const notFoundResponse: ResponseDescription = { resInit: { status: 404 } };

const responseMap: Map<RequestInfo, ResponseDescription> = new Map();
let defaultResponse = notFoundResponse;
let isOnline = true;

const mockFetch: typeof fetch = function(
    url: RequestInfo, init?: RequestInit
): Promise<Response> {
    if (typeof url !== "string") {
        throw new Error('Mock fetch unable to handle non-string URLs.')
    }
    if (!isOnline) {
        // emulate a network error
        return Promise.reject(new Error());
    }
    const { resBody, resInit } = responseMap.get(url) || defaultResponse;
    return Promise.resolve(new Response(
        resBody, {
            ...resInit,
            url: (resInit && resInit.url) || url
        }
    ));
}
mockFetch.isRedirect = fetch.isRedirect;

export function __addResponse(
    url: RequestInfo, resBody?: string, resInit?: ResponseInit
): void {
    responseMap.set(url, { resBody, resInit });
}

export function __addCitoidResponse (
    url: string, resBody?: string, resInit?: ResponseInit
): void {
    url = [CITOID_API_ENDPOINT, encodeURIComponent(url)].join("/");
    __addResponse(url, resBody, resInit);
}

export function __setDefaultResponse(
    resBody?: string, resInit?: ResponseInit
): void {
    defaultResponse = { resBody, resInit };
}

export function __reset() {
    responseMap.clear();
    defaultResponse = notFoundResponse;
    isOnline = true;
}

export function __connect() { isOnline = true; }
export function __disconnect() { isOnline = false; }

export default mockFetch;
export * from 'node-fetch';
