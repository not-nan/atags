import type { At } from "@atcute/client/lexicons";

export const isDid = (did: string): did is At.DID => {
  return /^did:([a-z]+):([a-zA-Z0-9._:%-]*[a-zA-Z0-9._-])$/.test(did);
};

export type AtUriParts = { did: At.DID, collection: string, rkey: string }

export function atUriToParts(atUri: string): AtUriParts | undefined {
  if (!atUri.startsWith('at://')) return;
  atUri = atUri.trim().substring('at://'.length);

  const firstSlash = atUri.indexOf('/');
  if (firstSlash === -1) return;
  const did = atUri.substring(0, firstSlash);
  if (!isDid(did)) return;
  atUri = atUri.substring(firstSlash+1);

  const secondSlash = atUri.indexOf('/');
  if (secondSlash === -1) return;
  const collection = atUri.substring(0, secondSlash);
  if (!collection.length) return;
  atUri = atUri.substring(secondSlash+1);

  let thirdSlash: number | undefined = atUri.indexOf('/');
  if (thirdSlash === -1) thirdSlash = undefined;
  const rkey = atUri.substring(0, thirdSlash);
  if (!rkey.length) return;
  
  return { did, collection, rkey };
}

export function partsToAtUri({did, collection, rkey}: AtUriParts): string {
  return `at://${did}/${collection}/${rkey}`;
}