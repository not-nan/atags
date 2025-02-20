import { At } from "@atcute/client/lexicons";
import { A, useParams } from "@solidjs/router";
import { Accessor, createResource, createSignal, For, JSX, Match, Show, Switch, useContext } from "solid-js";
import { getTagged } from "../../lib/appview";
import { createStore } from "solid-js/store";
import { SessionCtx } from "../../lib/auth";
import { Loading, OpenRecord, TagRemove } from "../../assets/icons";
import Navigation from "../../components/Navigation";
import { addViews, TaggedViewSkeleton } from "./views";

export type TaggedView = {
  skeleton: TaggedViewSkeleton,
  content: Accessor<(() => JSX.Element) | undefined>,
  appviewUrl: string,
}

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

      addViews(taggedPosts, loadedTaggedPosts, setLoadedTaggedPosts, session);

      return { taggedPosts };
    })
  );

  const loadMorePosts = () => {
    setCursor(newCursor);
    setNewCursor(undefined);
  }

  const removeTagged = async (rkey: string) => {
    if (!session.active) return;
    setLoadedTaggedPosts(loadedTaggedPosts.filter(p => p.skeleton.rkey !== rkey));
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
      <div class="flex my-5 px-1">
        <div class="mx-auto shrink rounded-xl border border-gray-400 dark:border-theme-pink px-4 py-4">
          <Show when={!loadedTaggedPosts.length}>
            <p>No tagged records found</p>
          </Show>
          <For each={loadedTaggedPosts}>
            {(item) => (
              <>
                <div class="flex justify-between">
                  <Switch>
                    <Match when={item.content()}>
                      <div class="max-w-xl my-3">
                        {item.content()!()}
                      </div>
                    </Match>
                    <Match when={!item.content()}>
                      <div class="flex grow justify-center">
                        <Loading />
                      </div>
                    </Match>
                  </Switch>
                  <div class="flex ml-3">
                    <A class="flex flex-col justify-center dark:text-theme-pink" href={item.appviewUrl} target="_blank"><OpenRecord/></A>
                    <Show when={session.active && session.did === params.did}>
                      <button
                        class="cursor-pointer text-red-600 dark:text-theme-pink"
                        onClick={() => removeTagged(item.skeleton.rkey)}>
                        <TagRemove />
                      </button>
                    </Show>
                  </div>
                </div>
                <hr class="text-gray-300 dark:text-darkish-pink"/>
              </>)}
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