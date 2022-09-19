import { Headers } from "node-fetch";
import { fetchWrapper } from "./utils";
import { HTTPResponseError } from "./errors";
import { CITOID_API_ENDPOINT as API_ENDPOINT } from "./config";
import { CitoidCitation, isCitoidCitation } from "./citation/citationTypes";
import { Citation } from "./citation/citation";

// type CitoidRequestFormat = "mediawiki" | "mediawiki-basefields" | "zotero";
// | 'bibtex'
// | 'wikibase'

function translateUrl(
  query: string,
  // format: CitoidRequestFormat = "mediawiki-basefields",
  language?: string
): Promise<CitoidCitation> {
  const url = [API_ENDPOINT, encodeURIComponent(query)].join("/");
  const headers = new Headers();
  headers.append("accept", "application/json; charset=utf-8;");
  if (language) headers.append("Accept-Language", language);

  return new Promise<CitoidCitation>((resolve, reject) => {
    fetchWrapper
      .fetch(url, { headers })
      .then(async (response) => {
        if (response.ok) {
          const responseText = await response.text();
          let citations;
          try {
            citations = JSON.parse(responseText);
          } catch {
            citations = null;
          }
          if (
            Array.isArray(citations) &&
            citations.every((citation) => isCitoidCitation(citation))
          ) {
            // url queries should return only one citation
            // https://www.mediawiki.org/wiki/Citoid/API#Successful_response_in_mediawiki_format
            resolve(citations[0]);
          } else {
            reject(
              new Error(`Unknown Citoid response format: ${responseText}`)
            );
          }
        } else {
          // the response contains client (4xx) or server (5xx) error responses
          // see https://github.com/node-fetch/node-fetch#handling-client-and-server-errors
          const error = new HTTPResponseError(url, response);
          if (response.status === 504) {
            // response.body = upstream request timeout
            reject(error);
          } else if (response.status === 520) {
            // custom 520 response that returns a citation object
            // even if no data is able to be retrieved
            // https://www.mediawiki.org/wiki/Citoid/API#Unsuccessful_response
            reject(error);
          } else {
            // some errors will return a problem json
            // https://www.mediawiki.org/wiki/HyperSwitch/errors
            reject(error);
          }
        }
      })
      .catch((reason) => {
        // see https://github.com/node-fetch/node-fetch/blob/main/docs/ERROR-HANDLING.md
        // All operational errors other than aborted requests are rejected with a FetchError.
        reject(reason);
      });
  });
}

export function fetchCitation(
  url: string,
  language?: string
): Promise<Citation> {
  return new Promise((resolve, reject) => {
    translateUrl(url, language)
      .then((citation) => {
        resolve(new Citation(citation));
      })
      .catch((reason) => {
        reject(reason);
      });
  });
}
