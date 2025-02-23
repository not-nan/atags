import { createEffect, createSignal, Match, Show, Switch, useContext } from "solid-js";
import { AuthTypes, SessionCtx } from "../lib/auth";
import { useNavigate } from "@solidjs/router";
import { setSidebarState } from "../components/Navigation";

const LoginScreen = () => {
  const session = useContext(SessionCtx);
  const navigate = useNavigate();
  const [authType, setAuthType] = createSignal<AuthTypes>('oauth');
  const [didInput, setDidInput] = createSignal('');
  const [passwordInput, setPasswordInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | undefined>();
  let passwordInputElement: HTMLInputElement | undefined;

  createEffect(() => {
    if (session.active) {
      setSidebarState('expanded');
      navigate(`/create-board`, { replace: true });
    }
  });

  const login = async () => {
    if (session.active) return;
    setLoading(true);
    try {
      await session.login({ type: authType(), didOrHandle: didInput(), password: passwordInput() });
      setSidebarState('expanded');
      navigate(`/create-board`, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? JSON.stringify(err));
      return;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="flex justify-center">
      <div>
        <p class="text-2xl text-center font-semibold mt-3">📌 Boards</p>
        <div class="shrink rounded-xl border border-solid border-gray-400 dark:border-theme-pink px-2 py-4 my-5">
          <select
            class="block mx-auto rounded-lg border border-solid disabled:text-gray-400 border-gray-400 dark:border-theme-pink p-2 mb-2"
            onChange={(e) => setAuthType(e.target.value as 'oauth' | 'password')}>
            <option value="oauth">OAuth</option>
            <option value="password">App Password</option>
          </select>
          <div class="flex justify-between">
            <label class="px-2 py-1 my-1">Handle or did</label>
            <input
              id="didOrHandle"
              class="rounded-lg border border-solid disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 my-1 focus:dark:border-light-pink dark:focus:outline-none"
              disabled={loading()}
              onKeyDown={(ev) =>
                ev.key === 'Enter'
                  ? (authType() === 'password' ? passwordInputElement?.focus() : login())
                  : undefined}
              onInput={(e) => setDidInput(e.currentTarget.value)}
            />
          </div>
          <Show when={authType() === 'password'}>
            <div class="flex justify-between">
              <label class="px-2 py-1 my-1">App password</label>
              <input
                id="password"
                type="password"
                ref={passwordInputElement}
                class="rounded-lg border border-solid disabled:text-gray-400 border-gray-400 dark:border-theme-pink px-2 py-1 my-1 focus:dark:border-light-pink dark:focus:outline-none"
                disabled={loading()}
                onKeyDown={(ev) => ev.key === 'Enter' ? login() : undefined}
                onInput={(e) => setPasswordInput(e.currentTarget.value)}
              />
            </div>
          </Show>
          <Show when={error}>
            <p class="text-center text-red-500 my-2">{error()}</p>
          </Show>
          <div class="flex justify-center mt-2">
            <button
              disabled={loading()}
              class="cursor-pointer mx-auto rounded-lg border border-solid disabled:text-gray-400 border-gray-400 dark:border-theme-pink font-bold px-2 py-1 hover:bg-gray-100 dark:hover:bg-darkish-pink"
              onClick={() => login()}>
              <Switch>
                <Match when={loading()}>
                  Loading...
                </Match>
                <Match when={!loading()}>
                  Login
                </Match>
              </Switch>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;