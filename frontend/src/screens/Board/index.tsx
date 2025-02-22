import { At, ComAtprotoRepoApplyWrites } from "@atcute/client/lexicons";
import { A, useNavigate, useParams } from "@solidjs/router";
import { Accessor, createResource, createSignal, For, JSX, Match, on, Show, Switch, useContext } from "solid-js";
import { getTag, getTagged } from "../../lib/appview";
import { createStore, SetStoreFunction } from "solid-js/store";
import { ActiveSession, sessionAssertActive, SessionCtx } from "../../lib/auth";
import { Delete, Edit, Loading, OpenRecord, TagRemove } from "../../assets/icons";
import { createViewObjectHydrated, instantiateViewObjectsHydrated, TaggedViewSkeleton } from "./views";
import { atUriToParts, isDid, partsToAtUri } from "../../lib/util";
import * as TID from "@atcute/tid";
import Navigation from "../../components/Navigation";
import { resolveHandle } from "../../lib/resolution";
import ConfirmDialog from "../../components/ConfirmDialog";
import { mutateTags } from "../../components/Sidebar";
import Button from "../../components/Button";

export type TaggedView = {
  skeleton: TaggedViewSkeleton,
  content: Accessor<(() => JSX.Element) | undefined>,
  appviewUrl: string,
}

type EditingState =
  { editing: false }
  | { editing: true } & ActiveEdit

type ActiveEdit = { title: string, description: string, loading: boolean, error?: string }

const activeEdit = (state: EditingState): ActiveEdit => {
  if (state.editing) return state;
  throw new Error('Editing state not active');
}

const BoardScreen = () => {
  const params = useParams();
  const session = useContext(SessionCtx);
  const [newCursor, setNewCursor] = createSignal<string | undefined>();
  const [cursor, setCursor] = createSignal<string | undefined>();
  const [loadedTaggedPosts, setLoadedTaggedPosts] = createStore<TaggedView[]>([]);
  const [deletingTag, setDeletingTag] = createSignal(false);
  const [editingState, setEditingState] = createStore<EditingState>({ editing: false });
  const [loadingDelete, setLoadingDelete] = createSignal(false);
  const navigate = useNavigate();

  // For some fucking reason, this shit gives me the error, the content
  // insde the show gets evaluated, and then none of the content inside is displayed
  // Hack to work around that
  const [tagError, setTagError] = createSignal<any>();
  const [tag, { mutate }] = createResource(
    () => ({ did: params.did as At.DID, tag: params.tag }),
    async ({ did, tag }) => {
      setLoadedTaggedPosts([]);
      setCursor();
      setNewCursor();
      setEditingState({ editing: false });
      try {
        return await getTag(did, tag);
      } catch (err) {
        setTagError(err);
      }
    }
  );

  const tagTitle = () => tag()?.title.length ? tag()?.title : tag()?.rkey;
  const isTagOwner = () => session.active && session.did === params.did;

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

  const applyDeletes = (
    session: ActiveSession,
    batch: (ComAtprotoRepoApplyWrites.Delete & { $type: "com.atproto.repo.applyWrites#delete"; })[]) =>
    session.rpc.call('com.atproto.repo.applyWrites', {
      data: {
        repo: session.did,
        writes: batch
      }
    });

  const deleteTag = async () => {
    if (!session.active) return;
    const did = params.did as At.DID;
    const rkey = params.tag;
    setLoadingDelete(true);
    try {
      const batch: (ComAtprotoRepoApplyWrites.Delete & { $type: "com.atproto.repo.applyWrites#delete"; })[] = [];
      let cursor: string | undefined;
      do {
        const result = await getTagged(did, rkey, cursor);
        cursor = result.cursor;
        for (const tagged of result.taggedPosts) {
          batch.push({
            '$type': 'com.atproto.repo.applyWrites#delete',
            collection: 'xyz.jeroba.tags.tagged',
            rkey: tagged.rkey,
          });
          if (batch.length >= 200) {
            await applyDeletes(session, batch);
            batch.length = 0;
          }
        }
      } while (cursor);
      if (batch.length) await applyDeletes(session, batch);

      await session.rpc.call('com.atproto.repo.deleteRecord', {
        data: {
          repo: session.did,
          collection: 'xyz.jeroba.tags.tag',
          rkey,
        }
      });

      mutateTags((prev) => {
        if (!prev) return prev;
        const index = prev.findIndex(tag => tag.rkey === rkey);
        if (index === -1) return prev;
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });

      navigate('/create-board');
    } finally {
      setDeletingTag(false);
      setLoadingDelete(false);
    }
  }

  const editTag = async () => {
    if (!session.active || !editingState.editing) return;
    const rkey = params.tag;
    setEditingState({ loading: true });
    try {
      const res = await session.rpc.call('com.atproto.repo.putRecord', {
        data: {
          collection: 'xyz.jeroba.tags.tag',
          repo: session.did,
          rkey,
          record: {
            "$type": 'xyz.jeroba.tags.tag',
            title: editingState.title,
            description: editingState.description,
          }
        }
      });

      mutateTags((tags) => {
        if (!tags) return;
        const index = tags?.findIndex(tag => tag.rkey === rkey);
        if (index === -1) {
          return tags;
        }

        const newTags = tags.toSpliced(index, 1);
        let insertAt = newTags.findIndex(other => other.title.localeCompare(editingState.title) > 0);
        if (insertAt === -1) insertAt = newTags.length;

        newTags.splice(insertAt, 0, {
          ...tags[index],
          title: editingState.title,
          description: editingState.description,
          cid: res.data.cid,
        });

        return newTags;
      });

      mutate((tag) => {
        if (!tag) return tag;
        return {
          ...tag,
          title: editingState.title,
          description: editingState.description,
        }
      });
    } catch (err: any) {
      console.error(err);
      setEditingState({ error: err.message ?? JSON.stringify(err) });
    } finally {
      setEditingState({ editing: false });
    }
  }

  return (
    <Navigation
      selected={'tag'}
      selectedValue={params.tag}
      topbar={
        <Show when={tag() && isTagOwner()}>
          <button
            onClick={() => setEditingState({ editing: true, title: tag()?.title, description: tag()?.description, loading: false })}
            class="cursor-pointer dark:text-theme-pink mx-1">
            <Edit />
          </button>
          <button
            onClick={() => setDeletingTag(true)}
            class="cursor-pointer text-red-600 dark:text-theme-pink mx-1">
            <Delete width={42} height={42} />
          </button>
        </Show>
      }>
      <Show when={deletingTag() && tag()}>
        <ConfirmDialog
          title={`Are you sure you want to delete "${tagTitle()}"?`}
          subtitle="This will also remove all records added to the board, be warned if you have a very big board."
          disableButtons={loadingDelete()}
          callback={(confirm) => confirm ? deleteTag() : setDeletingTag(false)} />
      </Show>
      <div class="w-full px-4">
        <Show when={tagError()}>
          <div class="mb-5">
            <p class="text-center text-xl font-bold">
              <span class="text-red-500">ERROR:</span> Board not found
            </p>
          </div>
        </Show>
        <div class="mb-5">
          <Switch>
            <Match when={tag() && !editingState.editing}>
              <p class="text-center text-xl font-bold">{tag()?.title}</p>
              <div class="flex justify-center mt-1">
                <p class="text-sm max-w-sm break-words">{tag()?.description}</p>
              </div>
            </Match>
            <Match when={tag() && editingState.editing}>
              <EditTag 
                state={activeEdit(editingState)} 
                setState={setEditingState}
                done={(confirm) => confirm ? editTag() : setEditingState('editing', false) } />
            </Match>
          </Switch>
        </div>
        <Show when={isTagOwner() && !tagError()}>
          <ApplyTag
            tagRkey={params.tag}
            session={sessionAssertActive(session)}
            registerNewTag={registerNewTag}
          />
        </Show>
        <Show when={!loadTagged.loading && !loadedTaggedPosts.length && !tagError()}>
          <p class="text-center my-5">No tagged records found</p>
        </Show>
        <hr class="text-gray-300 dark:text-darkish-pink" />
        <For each={loadedTaggedPosts}>
          {(item) => (
            <>
              <div class="flex justify-between">
                <Switch>
                  <Match when={item.content()}>
                    <div class="my-3">
                      {item.content()!()}
                    </div>
                  </Match>
                  <Match when={!item.content()}>
                    <div class="flex grow justify-center py-3">
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
        <Show when={newCursor()} fallback={<div class="h-16"></div>}>
          <div class="flex justify-center pt-2">
            <Button
              onClick={() => loadMorePosts()}
              class="mx-auto text-3xl">
              Load More
            </Button>
          </div>
        </Show>
      </div>
    </Navigation>
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

type EditTagProps = {
  state: ActiveEdit, 
  setState: SetStoreFunction<EditingState>,
  done: (confirm: boolean) => void,
}
const EditTag = (props: EditTagProps) => {
  return (
    <div class="flex flex-col">
      <p> { props.state.title } </p>
      <input
        disabled={props.state.loading}
        onInput={(e) => props.setState({ title: e.target.value })}
        value={props.state.title}
        class="text-xl font-bold text-center rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 mx-3 focus:dark:border-light-pink dark:focus:outline-none"
      />
      <div class="flex justify-center mt-1">
        <textarea
          disabled={props.state.loading}
          onInput={(e) => props.setState({ description: e.target.value })}
          value={props.state.description}
          rows={6}
          class="text-sm grow text-center max-w-sm rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 mx-3 focus:dark:border-light-pink dark:focus:outline-none"
        />
      </div>
      <Show when={props.state.error}>
        <p class="text-center text-red-500 my-2">{props.state.error}</p>
      </Show>
      <div class="flex justify-center mt-3 gap-2">
        <Button disabled={props.state.loading} onClick={() => props.done(true)}>
          Save
        </Button>
        <Button disabled={props.state.loading} onClick={() => props.done(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default BoardScreen;