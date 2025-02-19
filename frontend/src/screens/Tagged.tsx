import { At, XyzJerobaTagsGetTaggedPosts } from "@atcute/client/lexicons";
import { A, useParams } from "@solidjs/router";
import { createResource, createSignal, For, Show, useContext } from "solid-js";
import { getTagged } from "../lib/appview";
import { createStore } from "solid-js/store";
import { SessionCtx } from "../lib/auth";
import { TagRemove } from "../assets/icons";
import Navigation from "../components/Navigation";
import { AtUriParts, atUriToParts } from "../lib/util";

type TaggedView = XyzJerobaTagsGetTaggedPosts.TaggedPostsView & { parts: AtUriParts };

const TaggedScreen = () => {
  const params = useParams();
  const session = useContext(SessionCtx);
  const [newCursor, setNewCursor] = createSignal<string | undefined>();
  const [cursor, setCursor] = createSignal<string | undefined>();
  const [loadedTaggedPosts, setLoadedTaggedPosts] = createStore<TaggedView[]>([]);

  const [loadTagged] = createResource(
    () => ({ did: params.did as At.DID, tag: params.tag, cursor: cursor() }),
    ({ did, tag, cursor }) => getTagged(did, tag, cursor).then(({ taggedPosts, cursor }) => {
      setNewCursor(cursor);
      for (const post of taggedPosts) {
        setLoadedTaggedPosts(loadedTaggedPosts.length, { ...post, parts: atUriToParts(post.record) });
      }
      return { taggedPosts };
    })
  );

  const loadMorePosts = () => {
    setCursor(newCursor);
    setNewCursor(undefined);
  }

  const removeTagged = async (rkey: string) => {
    if (!session.active) return;
    setLoadedTaggedPosts(loadedTaggedPosts.filter(p => p.rkey !== rkey));
    await session.rpc.call('com.atproto.repo.deleteRecord', {
      data: {
        repo: session.did,
        collection: 'xyz.jeroba.tags.tagged',
        rkey,
      }
    });
  }

  return (
    <>
      <Navigation />
      <div class="flex my-5">
        <div class="mx-auto shrink rounded-xl border border-gray-400 px-4 py-4">
          <Show when={!loadedTaggedPosts.length}>
            <p>No tagged records found</p>
          </Show>
          <For each={loadedTaggedPosts}>
            {(item) => (
              <div class="flex justify-between py-1">
                <div class="flex flex-col justify-center">
                  <A
                    class="underline text-blue-500"
                    href={
                      (item.parts?.collection === 'app.bsky.feed.post') 
                      ?  `https://bsky.app/profile/${item.parts.did}/post/${item.parts.rkey}`
                      : `https://pdsls.dev/${item.record}`}
                    target="_blank">
                    {item.record}
                  </A>
                </div>
                <Show when={session.active && session.did === params.did}>
                  <button
                    class="cursor-pointer text-red-600 ml-3"
                    onClick={() => removeTagged(item.rkey)}>
                    <TagRemove />
                  </button>
                </Show>
              </div>)}
          </For>
          <Show when={loadTagged.loading}>
            <p class="text-center">Loading...</p>
          </Show>
          <Show when={newCursor()}>
            <div class="flex justify-center pt-2">
              <button
                onClick={() => loadMorePosts()}
                class="cursor-pointer mx-auto rounded-lg border border-gray-400 font-bold px-2 py-1 hover:bg-gray-100">
                Load More
              </button>
            </div>
          </Show>
        </div>
      </div>
    </>
  );
}

export default TaggedScreen;