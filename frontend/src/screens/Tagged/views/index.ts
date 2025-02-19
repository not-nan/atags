import { XyzJerobaTagsGetTaggedPosts } from "@atcute/client/lexicons";
import { AtUriParts, Equal } from "../../../lib/util";
import bskyView from "./bsky";
import whtwndView from "./whtwnd";
import { TaggedView } from "..";
import { createSignal, JSX } from "solid-js";
import { SetStoreFunction } from "solid-js/store";
import fallbackView from "./fallback";

export type TaggedViewSkeleton = Exclude<XyzJerobaTagsGetTaggedPosts.TaggedPostsView, 'uri'> & { uri: AtUriParts; };
export type ToHydrateView = { skeleton: TaggedViewSkeleton, setRender: (render: () => JSX.Element) => void};

export type RecordView<Collection extends string> = {
  collection: Collection,
  hydrate: (views: ToHydrateView[]) => Promise<void>,
}

type RecordViews<Views extends object> = {
  [Property in keyof Views]: 
  Views[Property] extends RecordView<infer C> 
    ? Equal<Property, C> extends never 
      ? never 
      : Views[Property] 
    : never;
}

const baseViews = {
  'app.bsky.feed.post': bskyView,
  'com.whtwnd.blog.entry': whtwndView
};

type TypedViews = RecordViews<typeof baseViews>;
const typedViews: TypedViews = baseViews;
const viewKeys = Object.keys(typedViews);

function isSupportedView(collection: string): collection is keyof TypedViews {
  return viewKeys.includes(collection);
}

export async function addViews(skeletons: TaggedViewSkeleton[], store: TaggedView[], setStore: SetStoreFunction<TaggedView[]>) {
  const toHydrateViews: Record<string, ToHydrateView[]> = {};
  for (const view in typedViews) {
    toHydrateViews[view] = [];
  }
  toHydrateViews.fallback = [];

  for (const skeleton of skeletons) {
    const key = isSupportedView(skeleton.uri.collection) ? skeleton.uri.collection : 'fallback';
    const [content, setContent] = createSignal<(() => JSX.Element) | undefined>();
    const obj = { skeleton, content, setRender: (render: () => JSX.Element) => setContent(() => render)};
    toHydrateViews[key].push(obj);
    setStore(store.length, obj);
  }

  await Promise.all([...Object.keys(typedViews).map(viewKeyRaw => {
    const viewKey = viewKeyRaw as keyof TypedViews;
    const view = typedViews[viewKey];
    return view.hydrate(toHydrateViews[viewKey]);
  }), (async () => fallbackView.hydrate(toHydrateViews['fallback']))()]);
}