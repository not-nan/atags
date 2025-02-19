import { At, XyzJerobaTagsGetTaggedPosts, XyzJerobaTagsGetTags } from "@atcute/client/lexicons";

class HttpError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(`${code}: ${message}`);
    this.code = code;
    this.name = 'HttpError';
  }
}

const apiBase = new URL(import.meta.env.DEV ? 'http://localhost:3001/xrpc/' : 'https://appview.atags.jeroba.xyz/xrpc/');

async function fetchJson(path: string | URL, options?: RequestInit) {
  const res = await fetch(new URL(path, apiBase), options);
  if (!res.ok) {
    throw new HttpError(res.status, await res.text());
  }

  return res.json();
}

export async function getTags(did: At.DID) {
  // TODO: Validation
  const tags = (await fetchJson(`xyz.jeroba.tags.getTags?repo=${did}`) as XyzJerobaTagsGetTags.Output).tags;
  return tags;
}

export async function getTagged(did: At.DID, tagRkey: string, cursor?: string)
  : Promise<{ taggedPosts: XyzJerobaTagsGetTaggedPosts.TaggedPostsView[], cursor?: string }> {
  let url = `xyz.jeroba.tags.getTaggedPosts?repo=${did}&tag=${tagRkey}`;
  if (cursor) url += `&cursor=${cursor}`;
  // TODO: Validation
  const res = (await fetchJson(url) as XyzJerobaTagsGetTaggedPosts.Output);
  return { taggedPosts: res.taggedPosts, cursor: res.cursor };
}