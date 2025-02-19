import { A, useParams } from "@solidjs/router";
import { createEffect, createResource, createSignal, For, Match, Setter, Show, Switch, useContext } from "solid-js";
import { getTags } from "../lib/appview";
import { At, XyzJerobaTagsGetTags } from "@atcute/client/lexicons";
import { Add, Delete, Close, Edit } from "../assets/icons";
import { SessionCtx } from "../lib/auth";
import { atUriToParts } from "../lib/util";
import ConfirmDialog from "../components/ConfirmDialog";
import Navigation from "../components/Navigation";

const TagsScreen = () => {
  const params = useParams();
  const session = useContext(SessionCtx);
  const [addingTag, setAddingTag] = createSignal(false);
  const [deletingTag, setDeletingTag] = createSignal<XyzJerobaTagsGetTags.TagsView | undefined>();
  const [editingTag, setEditingTag] = createSignal<XyzJerobaTagsGetTags.TagsView | undefined>();
  const [loadingDelete, setLoadingDelete] = createSignal(false);
  // If it's incorrect, it's just gonna return an empty tag array anyways #yolo
  const [tags, { mutate }] = createResource(params.did as At.DID, getTags);

  const deleteTag = async (confirm: boolean, rkey: string | undefined) => {
    if (!session.active || !confirm || !rkey) {
      setDeletingTag();
      return;
    }
    setLoadingDelete(true);
    try {
      await session.rpc.call('com.atproto.repo.deleteRecord', {
        data: {
          repo: session.did,
          collection: 'xyz.jeroba.tags.tag',
          rkey,
        }
      });
      mutate((prev) => {
        if (!prev) return prev;
        const index = prev.findIndex(tag => tag.rkey === rkey);
        if (index === -1) return prev;
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });
    } finally {
      setDeletingTag();
      setLoadingDelete(false);
    }
  }

  return (
    <>
      <Navigation selected="tags" />
      <div class="flex my-5">
        <Show when={deletingTag()}>
          <ConfirmDialog
            text={`Are you sure you want to delete "${deletingTag()?.title ?? deletingTag()?.rkey}"?`}
            disableButtons={loadingDelete()}
            callback={(confirm) => deleteTag(confirm, deletingTag()?.rkey)} />
        </Show>
        <div class="mx-auto shrink rounded-xl border border-gray-400 dark:border-theme-pink px-2 py-4 flex justify-center">
          <div>
            <Show when={tags.loading}>
              <p>Loading tags...</p>
            </Show>
            <Switch>
              <Match when={tags.error}>
                <span>Error loading tags: {tags.error.message}</span>
              </Match>
              <Match when={tags()}>
                <Show when={session.active}>
                  <Switch>
                    <Match when={addingTag()}>
                      <AddTags mutate={mutate} done={() => setAddingTag(false)} />
                    </Match>
                    <Match when={!addingTag()}>
                      <div class="flex justify-center pb-3">
                        <button onClick={() => setAddingTag(true)} class="cursor-pointer dark:text-theme-pink"><Add /></button>
                      </div>
                    </Match>
                  </Switch>
                </Show>
                <Switch>
                  <Match when={!tags()?.length}>
                    <p class="text-center">No tags found</p>
                  </Match>
                  <Match when={tags()?.length}>
                    <For each={tags()}>
                      {(item) => (
                        <div class="flex justify-between py-1">
                          <div class="flex flex-col justify-center">
                            <A
                              class="underline text-blue-500 dark:text-light-pink align-middle pr-4"
                              href={`/${params.did}/tag/${item.rkey}`}>
                              {item.title.length ? item.title : item.rkey}
                            </A>
                          </div>
                          <Show when={session.active && session.did === params.did}>
                            <div class="flex">
                              <div class="flex flex-col justify-center px-1">
                                <button
                                  onClick={() => setDeletingTag(item)}
                                  class="cursor-pointer text-red-600 dark:text-theme-pink">
                                  <Delete />
                                </button>
                              </div>
                              <div class="flex flex-col justify-center pl-1">
                                <button
                                  onClick={() => setEditingTag(item)}
                                  class="cursor-pointer dark:text-theme-pink">
                                  <Edit />
                                </button>
                              </div>
                            </div>
                          </Show>
                        </div>)}
                    </For>
                  </Match>
                </Switch>
              </Match>
            </Switch>
          </div>
          <EditTag tag={editingTag()} mutate={mutate} done={setEditingTag} />
        </div>
      </div>
    </>

  );
}

type MutateTags = Setter<XyzJerobaTagsGetTags.TagsView[] | undefined>;

const AddTags = (props: { mutate: MutateTags, done: () => void }) => {
  const [loading, setLoading] = createSignal(false);
  const session = useContext(SessionCtx);
  const [titleInput, setTitleInput] = createSignal('');
  const [descriptionInput, setDescriptionInput] = createSignal('');
  const [error, setError] = createSignal<string | undefined>();

  if (!session.active) {
    throw new Error('Session is not active');
  }

  const createTag = async (title: string, description: string) => {
    setLoading(true);
    try {
      const res = await session.rpc.call('com.atproto.repo.createRecord', {
        data: {
          collection: 'xyz.jeroba.tags.tag',
          repo: session.did,
          record: {
            "$type": 'xyz.jeroba.tags.tag',
            title,
            description,
          }
        }
      });
      // Since we got this from the pds, we're just gonna assume its correct
      const { rkey } = atUriToParts(res.data.uri)!;
      props.mutate((tags) => {
        const tag = { title, description, rkey, cid: res.data.cid };
        if (tags) {
          return [...tags, tag];
        } else {
          return [tag];
        }
      });
      props.done();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="mb-4">
      <div class="flex justify-center mb-2">
        <button class="cursor-pointer dark:text-theme-pink" onClick={() => props.done()}><Close /></button>
      </div>
      <div class="flex justify-between">
        <label class="px-2 py-1 my-1">Title</label>
        <input
          id="titleInput"
          class="rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 my-1 focus:dark:border-light-pink dark:focus:outline-none"
          disabled={loading()}
          onInput={(e) => setTitleInput(e.currentTarget.value)}
        />
      </div>
      <div class="flex justify-between">
        <label class="px-2 py-1 my-1">Description</label>
        <input
          id="descriptionInput"
          class="rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 my-1 focus:dark:border-light-pink dark:focus:outline-none"
          disabled={loading()}
          onInput={(e) => setDescriptionInput(e.currentTarget.value)}
        />
      </div>
      <Show when={error}>
        <p class="text-center text-red-500 my-2">{error()}</p>
      </Show>
      <div class="flex justify-center mt-2">
        <button
          class="cursor-pointer mx-auto rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink font-bold px-2 py-1 hover:bg-gray-100 dark:hover:bg-darkish-pink"
          disabled={loading()}
          onClick={() => createTag(titleInput(), descriptionInput())}
        >
          <Switch>
            <Match when={loading()}>
              Creating...
            </Match>
            <Match when={!loading()}>
              Create New Tag Category
            </Match>
          </Switch>
        </button>
      </div>
    </div>
  );
}

const EditTag = (props: { tag: XyzJerobaTagsGetTags.TagsView | undefined, mutate: MutateTags, done: () => void }) => {
  const [loading, setLoading] = createSignal(false);
  const session = useContext(SessionCtx);
  const [titleInput, setTitleInput] = createSignal('');
  const [descriptionInput, setDescriptionInput] = createSignal('');
  const [error, setError] = createSignal<string | undefined>();

  createEffect(() => {
    setTitleInput(props.tag?.title ?? '');
    setDescriptionInput(props.tag?.description ?? '');
  });

  const editTag = async (title: string, description: string) => {
    if (!session.active || !props.tag) return;
    const rkey = props.tag.rkey;
    setLoading(true);
    try {
      const res = await session.rpc.call('com.atproto.repo.putRecord', {
        data: {
          collection: 'xyz.jeroba.tags.tag',
          repo: session.did,
          rkey,
          record: {
            "$type": 'xyz.jeroba.tags.tag',
            title,
            description,
          }
        }
      });
      props.mutate((tags) => {
        if (!tags) return;
        const index = tags?.findIndex(tag => tag.rkey === rkey);
        if (index === -1) {
          return tags;
        }
        const newTags = [...tags];
        newTags[index] = {
          ...tags[index],
          title,
          description,
          cid: res.data.cid,
        }
        return newTags;
      });
      props.done();
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Show when={props.tag}>
      <div class="shrink w-px bg-neutral-300 mx-6"></div>
      <div>
        <div class="flex justify-center mb-2">
          <button class="cursor-pointer" onClick={() => props.done()}><Close /></button>
        </div>
        <p class="text-center my-3 font-bold">Editing "{props.tag?.title.length ? props.tag.title : props.tag?.rkey}"</p>
        <div class="flex justify-between">
          <label class="px-2 py-1 my-1">Title</label>
          <input
            id="titleInput"
            class="rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 my-1 focus:dark:border-light-pink dark:focus:outline-none"
            disabled={loading()}
            value={titleInput()}
            onInput={(e) => setTitleInput(e.currentTarget.value)}
          />
        </div>
        <div class="flex justify-between">
          <label class="px-2 py-1 my-1">Description</label>
          <input
            id="descriptionInput"
            class="rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 my-1 focus:dark:border-light-pink dark:focus:outline-none"
            disabled={loading()}
            value={descriptionInput()}
            onInput={(e) => setDescriptionInput(e.currentTarget.value)}
          />
        </div>
        <Show when={error}>
          <p class="text-center text-red-500 my-2">{error()}</p>
        </Show>
        <div class="flex justify-center mt-2">
          <button
            class="cursor-pointer mx-auto rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink font-bold px-2 py-1 hover:bg-gray-100"
            disabled={loading()}
            onClick={() => editTag(titleInput(), descriptionInput())}
          >
            <Switch>
              <Match when={loading()}>
                Editing...
              </Match>
              <Match when={!loading()}>
                Edit Tag
              </Match>
            </Switch>
          </button>
        </div>
      </div>
    </Show>
  );
}

export default TagsScreen;