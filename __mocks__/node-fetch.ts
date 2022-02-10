// cannot import RequestInfo type dynamically with import()
// https://stackoverflow.com/questions/68983419/dynamically-import-type-in-typesript
import { Response, RequestInit, RequestInfo, ResponseInit } from 'node-fetch';

const { default: fetch } = jest.requireActual('node-fetch') as typeof import('node-fetch');
export function __getImplementation(resBody?: string, resInit?: ResponseInit) {
    const implementation: typeof fetch = function(
        url: RequestInfo, init?: RequestInit
    ): Promise<Response> {
        if (typeof url !== "string") {
            throw new Error('Mock fetch unable to handle non-string URLs.')
        }
        const response = new Response(
            resBody,
            {
                ...resInit,
                url: (resInit && resInit.url) || url
            }
        );
        return Promise.resolve(response);
    }
    implementation.isRedirect = fetch.isRedirect;
    return implementation;
}
export default jest.fn();
export * from 'node-fetch';
