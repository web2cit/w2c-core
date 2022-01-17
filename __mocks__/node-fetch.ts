// export * from 'node-fetch';
const nodeFetch = jest.requireActual('node-fetch');

let mockResponseMap: Map<string, Response> = new Map();
nodeFetch.__setMockResponseMap = function(
    responseMap: Map<string, Response>
) {
    mockResponseMap = responseMap;
}

nodeFetch.default = function(url: string): Promise<Response> {
    return new Promise((resolve, reject) => {
        const response = mockResponseMap.get(url);
        if (response) {
            resolve(response)
        } else {
            reject(Response.error())
        }
    })
}

module.exports = nodeFetch;
// export default nodeFetch.default;
// export const { __setMockResponseMap } = nodeFetch;