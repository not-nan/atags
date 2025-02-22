import { XyzJerobaTagsGetTaggedPosts } from "@atcute/client/lexicons";
import { AtUriParts, Equal, ReplaceAtUriTo } from "../../../lib/util";
import bskyView from "./bsky";
import whtwndView from "./whtwnd";
import { TaggedView } from "..";
import { createSignal, JSX } from "solid-js";
import { SetStoreFunction } from "solid-js/store";
import fallbackView from "./fallback";

export type TaggedViewSkeleton = ReplaceAtUriTo<XyzJerobaTagsGetTaggedPosts.TaggedPostsView, 'record', 'uri'>;
export type ToHydrateView = { skeleton: TaggedViewSkeleton, setRender: (render: () => JSX.Element) => void};

export type RecordView<Collection extends string> = {
  collection: Collection,
  hydrate: (views: ToHydrateView[]) => Promise<void>,
  getAppviewLink: (uri: AtUriParts) => string,
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
export type ViewKeys = keyof TypedViews | 'fallback';
const viewKeys = Object.keys(typedViews);

function isSupportedView(collection: string): collection is keyof TypedViews {
  return viewKeys.includes(collection);
}


export type ViewObject = ToHydrateView & TaggedView & { viewKey: ViewKeys };
export function createViewObject(skeleton: TaggedViewSkeleton): ViewObject {
  const viewKey = isSupportedView(skeleton.uri.collection) ? skeleton.uri.collection : 'fallback';
  const [content, setContent] = createSignal<(() => JSX.Element) | undefined>();
  return { 
    skeleton,
    viewKey,
    content, 
    setRender: (render: () => JSX.Element) => setContent(() => render),
    appviewUrl: 
    viewKey === 'fallback' 
      ? fallbackView.getAppviewLink(skeleton.uri) 
      : typedViews[viewKey].getAppviewLink(skeleton.uri)
  };
}

export async function hydrateViewObject(viewObject: ViewObject) {
  const view = viewObject.viewKey === 'fallback' ? fallbackView : typedViews[viewObject.viewKey];
  return await view.hydrate([viewObject]);
}

export function createViewObjectHydrated(skeleton: TaggedViewSkeleton): [ViewObject, Promise<void>] {
  const obj = createViewObject(skeleton);
  const hydrationPromise = hydrateViewObject(obj);
  return [obj, hydrationPromise];
}

export async function instantiateViewObjectsHydrated(
  skeletons: TaggedViewSkeleton[], 
  store: TaggedView[], 
  setStore: SetStoreFunction<TaggedView[]>) {
  const toHydrateViews: Record<string, ToHydrateView[]> = {};
  for (const view in typedViews) {
    toHydrateViews[view] = [];
  }
  toHydrateViews.fallback = [];

  for (const skeleton of skeletons) {
    const obj = createViewObject(skeleton);
    toHydrateViews[obj.viewKey].push(obj);
    setStore(store.length, obj);
  }

  await Promise.all([...Object.keys(typedViews).map(viewKeyRaw => {
    const viewKey = viewKeyRaw as keyof TypedViews;
    const view = typedViews[viewKey];
    return view.hydrate(toHydrateViews[viewKey]);
  }), 
    (async () => fallbackView.hydrate(toHydrateViews['fallback']))()
  ]);
}