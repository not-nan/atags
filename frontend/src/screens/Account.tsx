import { Match, Switch, useContext } from "solid-js";
import { SessionCtx } from "../lib/auth";
import { useNavigate } from "@solidjs/router";
import Navigation from "../components/Navigation";

const Account = () => {
  const session = useContext(SessionCtx);
  const navigate = useNavigate();
  const logOut = () => {
    if (!session.active) return;
    session.logout();
    navigate('/');
  }
  return (
    <Navigation selected="account">
      <Switch>
        <Match when={session.active}>
          <div class="flex my-5">
            <div class="mx-auto shrink rounded-xl border border-solid border-gray-400 dark:border-theme-pink flex justify-center">
              <div class="divide-y divide-gray-400">
                <button
                  class="py-2 px-4 cursor-pointer hover:bg-gray-100 rounded-xl"
                  onClick={() => logOut()}>
                  <span class="text-red-500 font-bold">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </Match>
        <Match when={!session.active}>
          <div class="flex my-5">
            <div class="mx-auto shrink rounded-xl border border-solid border-gray-400 dark:border-theme-pink flex justify-center">
              <p class="py-2 px-4">You are not logged in</p>
            </div>
          </div>
        </Match>
      </Switch>
    </Navigation>
  )
}

export default Account;