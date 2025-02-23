import { createSignal, Match, Show, Switch, useContext } from "solid-js";
import Navigation from "../components/Navigation";
import { SessionCtx } from "../lib/auth";
import { atUriToParts, wait } from "../lib/util";
import { mutateTags } from "../components/Sidebar";
import { useNavigate } from "@solidjs/router";
import { Loading } from "../assets/icons";

const CreateBoard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = createSignal(false);
  const session = useContext(SessionCtx);
  const [titleInput, setTitleInput] = createSignal('');
  const [descriptionInput, setDescriptionInput] = createSignal('');
  const [error, setError] = createSignal<string | undefined>();

  const createTag = async (title: string, description: string) => {
    if (!session.active) return;
    setLoading(true);
    try {
      if (title.length < 1) throw new Error('Title is required');
      const res = await session.rpc.call('com.atproto.repo.createRecord', {
        data: {
          collection: 'xyz.jeroba.tags.tag',
          repo: session.did,
          record: {
            "$type": 'xyz.jeroba.tags.tag',
            title,
            description: description.length ? description : undefined,
          }
        }
      });

      // TODO: this is a hack to ensure the appview got it, make an actual mechanism
      await wait(1000);

      // Since we got this from the pds, we're just gonna assume its correct
      const { rkey } = atUriToParts(res.data.uri)!;
      mutateTags((tags) => {
        const tag = { title, description, rkey, cid: res.data.cid };
        if (tags) {
          let insertAt = tags.findIndex(other => other.title.localeCompare(tag.title) > 0);
          if (insertAt === -1) insertAt = tags.length;
          return [...tags.slice(0, insertAt), tag, ...tags.slice(insertAt)];
        } else {
          return [tag];
        }
      });
      
      navigate(`/profile/${session.did}/board/${rkey}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Navigation selected="create">
      <Switch>
        <Match when={session.loginInProcess}>
          <div class="ml-3 mt-2">
            <Loading />
          </div>
        </Match>
        <Match when={!session.active && !session.loginInProcess}>
          <p>You are not logged in</p>
        </Match>
        <Match when={session.active}>
          <div class="flex flex-col mt-4 mx-2">
            <label for="titleInput" class="px-2 py-1 my-1 text-lg">Title</label>
            <input
              required
              id="titleInput"
              class="rounded-lg border border-solid disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 my-1 focus:dark:border-light-pink dark:focus:outline-none"
              disabled={loading()}
              onInput={(e) => setTitleInput(e.currentTarget.value)}
            />
            <label for="descriptionInput" class="px-2 py-1 my-1 text-lg">Description</label>
            <textarea
              rows={6}
              id="descriptionInput"
              class="rounded-lg border border-solid disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 my-1 focus:dark:border-light-pink dark:focus:outline-none"
              disabled={loading()}
              onInput={(e) => setDescriptionInput(e.currentTarget.value)}
            />
          </div>
          <Show when={error}>
            <p class="text-center text-red-500 my-2">{error()}</p>
          </Show>
          <div class="flex justify-center mt-2">
            <button
              class="cursor-pointer text-lg mx-auto rounded-lg border border-solid disabled:text-gray-400 border-gray-400 dark:border-theme-pink font-bold px-2 py-1 hover:bg-gray-100 dark:hover:bg-darkish-pink"
              disabled={loading()}
              onClick={() => createTag(titleInput(), descriptionInput())}
            >
              <Switch>
                <Match when={loading()}>
                  Creating...
                </Match>
                <Match when={!loading()}>
                  Create New Board
                </Match>
              </Switch>
            </button>
          </div>
        </Match>
      </Switch>
    </Navigation>
  );
}

export default CreateBoard;