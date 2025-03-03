/* eslint-disable */
// This file is automatically generated, do not edit!

import "@atcute/client/lexicons";

declare module "@atcute/client/lexicons" {
  /** Get tag for a repo */
  namespace XyzJerobaTagsGetTag {
    interface Params {
      repo: At.DID;
      tag: string;
    }
    type Input = undefined;
    interface Output {
      tag: XyzJerobaTagsGetTags.TagsView;
    }
    interface Errors {
      UnknownTag: {};
    }
  }

  /** Get tagged posts for a tag in a repo */
  namespace XyzJerobaTagsGetTaggedPosts {
    interface Params {
      repo: At.DID;
      tag: string;
      cursor?: string;
      /**
       * Minimum: 1 \
       * Maximum: 100
       * @default 50
       */
      limit?: number;
    }
    type Input = undefined;
    interface Output {
      taggedPosts: TaggedPostsView[];
      cursor?: string;
    }
    interface TaggedPostsView {
      [Brand.Type]?: "xyz.jeroba.tags.getTaggedPosts#taggedPostsView";
      cid: At.CID;
      record: At.Uri;
      rkey: string;
      indexedAt?: number;
    }
  }

  /** Get tags for a repo */
  namespace XyzJerobaTagsGetTags {
    interface Params {
      repo: At.DID;
    }
    type Input = undefined;
    interface Output {
      tags: TagsView[];
    }
    interface TagsView {
      [Brand.Type]?: "xyz.jeroba.tags.getTags#tagsView";
      cid: At.CID;
      rkey: string;
      /**
       * Maximum string length: 3000 \
       * Maximum grapheme length: 300
       */
      title: string;
      /**
       * Maximum string length: 12000 \
       * Maximum grapheme length: 1200
       */
      description?: string;
    }
  }

  namespace XyzJerobaTagsTag {
    /** A tag definition */
    interface Record {
      $type: "xyz.jeroba.tags.tag";
      /**
       * Maximum string length: 3000 \
       * Maximum grapheme length: 300
       */
      title: string;
      /**
       * Maximum string length: 12000 \
       * Maximum grapheme length: 1200
       */
      description?: string;
    }
  }

  namespace XyzJerobaTagsTagged {
    /** A tag on a record */
    interface Record {
      $type: "xyz.jeroba.tags.tagged";
      record: At.Uri;
      tag: string;
    }
  }

  interface Records {
    "xyz.jeroba.tags.tag": XyzJerobaTagsTag.Record;
    "xyz.jeroba.tags.tagged": XyzJerobaTagsTagged.Record;
  }

  interface Queries {
    "xyz.jeroba.tags.getTag": {
      params: XyzJerobaTagsGetTag.Params;
      output: XyzJerobaTagsGetTag.Output;
    };
    "xyz.jeroba.tags.getTaggedPosts": {
      params: XyzJerobaTagsGetTaggedPosts.Params;
      output: XyzJerobaTagsGetTaggedPosts.Output;
    };
    "xyz.jeroba.tags.getTags": {
      params: XyzJerobaTagsGetTags.Params;
      output: XyzJerobaTagsGetTags.Output;
    };
  }

  interface Procedures {}
}
