import { version as VERSION } from "./version";
import { FieldName } from "./translationField";

export const CITOID_API_ENDPOINT =
  "https://en.wikipedia.org/api/rest_v1/data/citation/mediawiki";

// todo: should this be used directly by the translation template constructor
// instead of passing it as an argument?
export const forceRequiredFields: Array<FieldName> = ["itemType", "title"];

export const USER_AGENT = `web2cit-core/${VERSION}`;
