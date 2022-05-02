import {
  MediaWikiBaseFieldCitation,
  MediaWikiCitation,
  SimpleCitoidCitation,
} from "./citationTypes";
import { BASE_CREATOR_TYPES } from "./creatorTypes";
import {
  SIMPLE_CITOID_FIELDS,
  baseFieldMap,
  isRegularField,
  isCreatorField,
} from "./keyTypes";

export class Citation {
  private citation: MediaWikiCitation;
  constructor(citation: MediaWikiCitation | MediaWikiBaseFieldCitation) {
    this.citation = citation;
  }

  get mediawiki(): MediaWikiCitation {
    return this.citation;
  }

  get mediawikibase(): MediaWikiBaseFieldCitation {
    // fixme: consider improving implementation
    const mwbCitation: MediaWikiBaseFieldCitation = {
      // required
      itemType: this.citation.itemType,
      url: this.citation.url,
      // title
      title: (this.citation.title ||
        this.citation.caseName ||
        this.citation.subject ||
        this.citation.nameOfAct)!,
      // special
      tags: this.citation.tags,
      key: this.citation.key,
      version: this.citation.version,
      // mediawiki
      isbn: this.citation.isbn,
      issn: this.citation.issn,
      PMCID: this.citation.PMCID,
      PMID: this.citation.PMID,
      oclc: this.citation.oclc,
    };
    for (const field of Object.keys(this.citation) as Array<
      keyof typeof this.citation
    >) {
      if (isRegularField(field)) {
        const baseField = baseFieldMap.get(field);
        if (baseField !== undefined && isRegularField(baseField)) {
          mwbCitation[baseField] = this.citation[field];
        } else {
          throw new Error(
            `Regular field "${field} not mapped to a regular base field!`
          );
        }
      } else if (isCreatorField(field)) {
        const baseField = baseFieldMap.get(field);
        if (baseField !== undefined && isCreatorField(baseField)) {
          mwbCitation[baseField] = this.citation[field];
        } else {
          throw new Error(
            `Creator field "${field} not mapped to a creator base field!`
          );
        }
      }
    }
    return mwbCitation;
  }

  get simple(): SimpleCitoidCitation {
    const mwbCitation = this.mediawikibase;
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
}
