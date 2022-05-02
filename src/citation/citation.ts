import {
  MediaWikiBaseFieldCitation,
  SimpleCitoidCitation,
} from "./citationTypes";
import { BASE_CREATOR_TYPES } from "./creatorTypes";
import { SIMPLE_CITOID_FIELDS } from "./keyTypes";

export function simplifyCitation(
  mwbCitation: MediaWikiBaseFieldCitation
): SimpleCitoidCitation {
  const simpleCitation: SimpleCitoidCitation = {
    itemType: mwbCitation.itemType,
    title: mwbCitation.title,
    url: mwbCitation.url,
    tags: mwbCitation.tags?.map((tag) => tag.tag),
  };
  // split mediawiki creator arrays into creatorFirst and creatorLast arrays
  for (const baseCreatorType of BASE_CREATOR_TYPES) {
    const creators = mwbCitation[baseCreatorType];
    if (creators) {
      simpleCitation[`${baseCreatorType}First`] = creators.map(
        (creator) => creator[0]
      );
      simpleCitation[`${baseCreatorType}Last`] = creators.map(
        (creator) => creator[1]
      );
    }
  }
  for (const field of SIMPLE_CITOID_FIELDS) {
    if (
      field in mwbCitation &&
      !(field in simpleCitation) &&
      field !== "itemType"
    ) {
      const value = mwbCitation[field as keyof MediaWikiBaseFieldCitation] as
        | string
        | Array<string>;
      simpleCitation[field] = value;
    }
  }
  return simpleCitation;
}
