import { At } from "@atcute/client/lexicons";
import { A, useParams } from "@solidjs/router";
import { Accessor, createResource, createSignal, For, JSX, Match, Show, Switch, useContext } from "solid-js";
import { getTagged } from "../../lib/appview";
import { createStore } from "solid-js/store";
import { ActiveSession, sessionAssertActive, SessionCtx } from "../../lib/auth";
import { Loading, OpenRecord, TagRemove } from "../../assets/icons";
import Navigation from "../../components/Navigation";
import { createViewObjectHydrated, instantiateViewObjectsHydrated, TaggedViewSkeleton } from "./views";
import { atUriToParts, isDid, partsToAtUri } from "../../lib/util";
import * as TID from "@atcute/tid";
import { resolveHandle } from "../../lib/resolution";

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

      instantiateViewObjectsHydrated(taggedPosts, loadedTaggedPosts, setLoadedTaggedPosts);

      return { taggedPosts };
    })
  );

  const registerNewTag = async (tag: TaggedViewSkeleton) => {
    const [obj, hydrationPromise] = createViewObjectHydrated(tag);
    setLoadedTaggedPosts([obj, ...loadedTaggedPosts]);
    await hydrationPromise;
  }

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
          <div>
            <p></p>
          </div>
          <Show when={!loadTagged.loading && !loadedTaggedPosts.length}>
            <p>No tagged records found</p>
          </Show>
          <Show when={session.active && session.did === params.did}>
            <ApplyTag 
              tagRkey={params.tag} 
              session={sessionAssertActive(session)} 
              registerNewTag={registerNewTag} 
            />
          </Show>
          <hr class="text-gray-300 dark:text-darkish-pink" />
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
                    <A class="flex flex-col justify-center dark:text-theme-pink" href={item.appviewUrl} target="_blank"><OpenRecord /></A>
                    <Show when={session.active && session.did === params.did}>
                      <button
                        class="cursor-pointer text-red-600 dark:text-theme-pink"
                        onClick={() => removeTagged(item.skeleton.rkey)}>
                        <TagRemove />
                      </button>
                    </Show>
                  </div>
                </div>
                <hr class="text-gray-300 dark:text-darkish-pink" />
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

type ApplyTagProps = { 
  tagRkey: string, 
  session: ActiveSession,
  registerNewTag: (tag: TaggedViewSkeleton) => void;
}

const ApplyTag = (props: ApplyTagProps) => {
  const [error, setError] = createSignal<string | undefined>();
  const [loading, setLoading] = createSignal<boolean>(false);
  const [atUriInput, setAtUriInput] = createSignal('');

  const tagRecord = async (tagRkey: string, atUri: string) => {
    setLoading(true);
    atUri = atUri.trim();
    try {
      let url: string;
      let atUriParts = atUriToParts(atUri);
      if (atUriParts) {
        url = partsToAtUri(atUriParts);
      } else {
        if (atUri.startsWith('at://')) throw new Error('Invalid AtURI');
        try {
          const urlParts = new URL(atUri);
          if (urlParts.host !== 'bsky.app') throw '';
          const path = urlParts.pathname.substring(1).split('/');
          if (path.length < 4) throw '';
          if (path[0] !== 'profile' || path[2] !== 'post' || !TID.validate(path[3])) throw '';
          const didOrHandle = path[1];
          const did: At.DID =
            isDid(didOrHandle)
              ? didOrHandle
              : await resolveHandle(didOrHandle);
          atUriParts = { did, collection: 'app.bsky.feed.post', rkey: path[3] };
          url = partsToAtUri(atUriParts);
        } catch {
          throw new Error('Invalid URL');
        }
      }

      const res = await props.session.rpc.call('com.atproto.repo.createRecord', {
        data: {
          repo: props.session.did,
          collection: 'xyz.jeroba.tags.tagged',
          record: {
            tag: tagRkey,
            record: url,
          }
        }
      });

      const { rkey } = atUriToParts(res.data.uri)!;
      props.registerNewTag({
        rkey,
        cid: res.data.cid,
        uri: atUriParts,
      });

      setAtUriInput('');
      setError();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="mb-3">
      <div class="flex justify-between">
        <div class="flex flex-col justify-center">
          <label class="px-2">Post URL or AtURI</label>
        </div>
        <input
          id="atUriInput"
          disabled={loading()}
          value={atUriInput()}
          class="rounded-lg grow border disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 focus:dark:border-light-pink dark:focus:outline-none"
          onInput={(e) => setAtUriInput(e.currentTarget.value)} />
      </div>
      <Show when={error}>
        <p class="text-center text-red-500 my-2">{error()}</p>
      </Show>
      <div class="flex justify-center mt-4">
        <button
          disabled={loading()}
          class="cursor-pointer mx-auto rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink font-bold px-2 py-1 hover:bg-gray-100 dark:hover:bg-darkish-pink"
          onClick={() => tagRecord(props.tagRkey, atUriInput())}
        >
          <Switch>
            <Match when={loading()}>
              Tagging...
            </Match>
            <Match when={!loading()}>
              Apply Tag
            </Match>
          </Switch>
        </button>
      </div>
    </div>
  );
}

export default TaggedScreen;