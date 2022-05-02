// Creator types
////////////////

// Base creator type
export const BASE_CREATOR_TYPES = [
  "attorneyAgent",
  "author",
  "bookAuthor",
  "castMember",
  "commenter",
  "composer",
  "contributor",
  "cosponsor",
  "counsel",
  "editor",
  "guest",
  "interviewer",
  "producer",
  "recipient",
  "reviewedAuthor",
  "scriptwriter",
  "seriesEditor",
  "translator",
  "wordsBy",
] as const;
export type BaseCreatorType = typeof BASE_CREATOR_TYPES[number];

// Non-base creator type
const NON_BASE_CREATOR_TYPES = [
  "artist",
  "cartographer",
  "director",
  "interviewee",
  "inventor",
  "performer",
  "podcaster",
  "presenter",
  "programmer",
  "sponsor",
] as const;
export type NonBaseCreatorType = typeof NON_BASE_CREATOR_TYPES[number];

// Creator type
type CreatorType = BaseCreatorType | NonBaseCreatorType;

export function isCreatorType(type: unknown): type is CreatorType {
  return (
    BASE_CREATOR_TYPES.includes(type as BaseCreatorType) ||
    NON_BASE_CREATOR_TYPES.includes(type as NonBaseCreatorType)
  );
}
