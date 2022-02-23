import { FieldName } from "./translationField";

export const CITOID_API_ENDPOINT =
  "https://en.wikipedia.org/api/rest_v1/data/citation/mediawiki-basefields";

// todo: should this be used directly by the translation template constructor
// instead of passing it as an argument?
export const forceRequiredFields: Array<FieldName> = ["itemType", "title"];
