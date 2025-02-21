import { At } from "@atcute/client/lexicons";
import { atUriToParts } from "./util";
import { TaggedViewSkeleton } from "../screens/Tagged/views";
import { simpleFetchHandler, XRPC } from "@atcute/client";

const server = new URL(
  import.meta.env.VITE_APPVIEW
  ? import.meta.env.VITE_APPVIEW
  : import.meta.env.DEV 
  ? 'http://localhost:3001' 
  : 'https://appview.atags.jeroba.xyz');

const rpc = new XRPC({ handler: simpleFetchHandler({ service: server  }) });

export async function getTags(did: At.DID) {
  // TODO: Validation
  return (await rpc.get('xyz.jeroba.tags.getTags', {
    params: {
      repo: did
    }
  })).data.tags;
}

export async function getTagged(did: At.DID, tagRkey: string, cursor?: string)
  : Promise<{ taggedPosts: TaggedViewSkeleton[], cursor?: string }> {
  // TODO: Validation
  const res = (await rpc.get('xyz.jeroba.tags.getTaggedPosts', {
    params: {
      repo: did,
      tag: tagRkey,
      cursor,
    }
  })).data;
  return { taggedPosts: res.taggedPosts.map(t => ({ ...t, uri: atUriToParts(t.record)! })), cursor: res.cursor };
}

export async function getTag(did: At.DID, tag: string) {
  return (await rpc.get('xyz.jeroba.tags.getTag', {
    params: {
      repo: did,
      tag,
    }
  })).data.tag;
}