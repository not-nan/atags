import { Match, Switch, useContext } from "solid-js";
import { sessionAssertActive, SessionCtx } from "../lib/auth";
import { useNavigate } from "@solidjs/router";
import { User } from "../assets/icons";

type SelectableOptions = 'tags' | 'tag-records' | 'bskyfeeds' | 'account'

const Navigation = (props: { selected?: SelectableOptions }) => {
  const session = useContext(SessionCtx);
  const navigate = useNavigate();
  const activeSession = () => sessionAssertActive(session);
  const selectedClassList = (condition: boolean) => ({
    'font-bold': condition,
    'bg-gray-100': condition,
    'dark:bg-darkish-pink': condition,
  });

  return (
    <div class="mx-auto flex justify-center my-4">
      <div class="shrink flex justify-center rounded-xl border border-gray-400 dark:border-theme-pink divide-x divide-solid divide-gray-400">
        <Switch>
          <Match when={session.active}>
            <button
              classList={selectedClassList(props.selected === 'tags')}
              class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-darkish-pink rounded-l-xl"
              onClick={() => navigate(`/${activeSession().did}/tag`)}>
              Tag Categories
            </button>
            <button
              classList={selectedClassList(props.selected === 'tag-records')}
              class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-darkish-pink"
              onClick={() => navigate('/tag-records')}>
              Apply Tags
            </button>
            {/* 
          <button 
            classList={selectedClassList(props.selected === 'bskyfeeds')} 
            class="p-2 hover:bg-gray-100">
              Bluesky Feeds
          </button>
          */}
            <div
              classList={selectedClassList(props.selected === 'account')}
              class="flex flex-col justify-center cursor-pointer dark:hover:bg-darkish-pink rounded-r-xl px-1"
              onClick={() => navigate('/account')}>
              <User />
            </div>
          </Match>
          <Match when={!session.active}>
            <button
              class="p-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-darkish-pink rounded-xl font-bold"
              onClick={() => navigate(`/`)}>
              Go to login
            </button>
          </Match>
        </Switch>
      </div>
    </div>
  );
}

export default Navigation;