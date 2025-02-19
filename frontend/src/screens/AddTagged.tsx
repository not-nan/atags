import { createResource, createSignal, For, Match, Show, Switch, useContext } from "solid-js";
import { ActiveSession, sessionAssertActive, SessionCtx } from "../lib/auth";
import { getTags } from "../lib/appview";
import { atUriToParts, isDid, partsToAtUri } from "../lib/util";
import Navigation from "../components/Navigation";
import * as TID from "@atcute/tid";
import { At } from "@atcute/client/lexicons";
import { resolveHandle } from "../lib/resolution";

const AddTagged = () => {
  const session = useContext(SessionCtx);
  return (
    <>
      <Navigation selected="tag-records" />
      <Switch>
        <Match when={session.active}>
          <AddTaggedInner session={sessionAssertActive(session)} />
        </Match>
        <Match when={!session.active && session.loginInProcess}>
          <div class="flex justify-center">
            <div class="shrink rounded-xl border border-gray-400 px-2 py-4 my-5">
              <p class="text-center">Logging in...</p>
            </div>
          </div>
        </Match>
        <Match when={!session.active && !session.loginInProcess}>
          <div class="flex justify-center">
            <div class="shrink rounded-xl border border-gray-400 px-2 py-4 my-5">
              <p class="text-center">You are not logged in.</p>
            </div>
          </div>
        </Match>
      </Switch>
    </>
  )
}

const AddTaggedInner = (props: { session: ActiveSession }) => {
  const [error, setError] = createSignal<string | undefined>();
  const [loading, setLoading] = createSignal<boolean>(false);
  const [atUriInput, setAtUriInput] = createSignal('');
  const [selectedTagRkey, setSelectedTagRkey] = createSignal<string | undefined>();
  const [tags] = createResource(props.session.did, getTags);

  const tagRecord = async (tagRkey: string, atUri: string) => {
    setLoading(true);
    try {
      let url: string;
      const atUriParts = atUriToParts(atUri);
      if (atUriParts) {
        url = partsToAtUri(atUriParts);
      } else {
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
          url = partsToAtUri({ did, collection: 'app.bsky.feed.post', rkey: path[3] });
        } catch {
          throw new Error('Invalid At Uri Or URL');
        }
      }
      await props.session.rpc.call('com.atproto.repo.createRecord', {
        data: {
          repo: props.session.did,
          collection: 'xyz.jeroba.tags.tagged',
          record: {
            tag: tagRkey,
            record: url,
          }
        }
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

    <div class="mx-auto max-w-lg rounded-xl border border-gray-400 px-2 py-4 my-5">
      <select
        disabled={loading()}
        onChange={(e) => setSelectedTagRkey(e.target.value.length ? e.target.value : undefined)}
        class="block mx-auto rounded-lg border disabled:text-gray-400 border-gray-400 p-2 mb-2"
      >
        <Switch>
          <Match when={!tags.length}>
            <option value="">Select a tag category</option>
          </Match>
          <Match when={tags.length}>
          <option value=""></option>
          </Match>
        </Switch>
        
        <For each={tags()}>
          {(item) => <option value={item.rkey}>{(item.title.length) ? item.title : item.rkey}</option>}
        </For>
      </select>
      <div class="flex justify-between">
        <div class="flex flex-col justify-center">
          <label class="px-2">At Uri or URL</label>
        </div>
        <input
          id="atUriInput"
          disabled={loading()}
          value={atUriInput()}
          class="rounded-lg grow border disabled:text-gray-400 border-gray-400 px-2 py-1"
          onInput={(e) => setAtUriInput(e.currentTarget.value)} />
      </div>
      <Show when={error}>
        <p class="text-center text-red-500 my-2">{error()}</p>
      </Show>
      <div class="flex justify-center mt-4">
        <button
          disabled={!selectedTagRkey() || loading()}
          class="cursor-pointer mx-auto rounded-lg border disabled:text-gray-400 border-gray-400 font-bold px-2 py-1 hover:bg-gray-100"
          onClick={() => tagRecord(selectedTagRkey()!, atUriInput())}
        >
          <Switch>
            <Match when={loading()}>
              Tagging...
            </Match>
            <Match when={!loading()}>
              Apply Tag to Record
            </Match>
          </Switch>
        </button>
      </div>
    </div>
  );
}

export default AddTagged;