import { createResource, createSignal, For, Match, Show, Switch, useContext } from "solid-js";
import { ActiveSession, sessionAssertActive, SessionCtx } from "../lib/auth";
import { getTags } from "../lib/appview";
import { atUriToParts, partsToAtUri } from "../lib/util";
import Navigation from "../components/Navigation";

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
      const atUriParts = atUriToParts(atUri);
      if (!atUriParts) {
        throw new Error('Invalid At Uri');
      }
      await props.session.rpc.call('com.atproto.repo.createRecord', {
        data: {
          repo: props.session.did,
          collection: 'xyz.jeroba.tags.tagged',
          record: {
            tag: tagRkey,
            record: partsToAtUri(atUriParts),
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
        <option value=""></option>
        <For each={tags()}>
          {(item) => <option value={item.rkey}>{(item.title.length) ? item.title : item.rkey}</option>}
        </For>
      </select>
      <div class="flex justify-between">
        <div class="flex flex-col justify-center">
          <label class="px-2">At Uri</label>
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
              Tag Record
            </Match>
          </Switch>
        </button>
      </div>
    </div>
  );
}

export default AddTagged;