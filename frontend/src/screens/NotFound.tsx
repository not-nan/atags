import { Show, useContext } from "solid-js";
import Navigation from "../components/Navigation";
import { SessionCtx } from "../lib/auth";
import AButton from "../components/AButton";

const NotFound = () => {
  const session = useContext(SessionCtx);
  return (
    <Navigation>
      <p class="text-center text-4xl font-bold">Page not found</p>
      <Show when={!session.active && !session.loginInProcess}>
        <div class="flex justify-center mt-4">
          <AButton
            class="text-3xl px-4 py-2"
            href="/">
            Go to login
          </AButton>
        </div>
      </Show>
    </Navigation>
  );
}

export default NotFound;