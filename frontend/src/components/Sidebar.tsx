import { createEffect, createResource, createSignal, For, Match, Setter, Show, Switch, useContext } from "solid-js";
import { ChevronDown, ChevronRight, LeftPanelClose, Loading, User } from "../assets/icons";
import { SessionCtx } from "../lib/auth";
import { getTags } from "../lib/appview";
import { At } from "@atcute/client/lexicons";
import { A } from "@solidjs/router";
import AButton from "./AButton";
import { sidebarIconSize } from "./Navigation";

const ChevronSize = 28;

const [tagsExpanded, setTagsExpanded] = createSignal(true);
const [did, setDid] = createSignal<At.DID | undefined>();
const [tags, { mutate }] = createResource(did, getTags);

export { mutate as mutateTags };

export type SidebarSelectedType = 'none' | 'create' | 'tag' | 'account';

export type SidebarProps = { 
  sidebarState: string, 
  setSidebarState: Setter<'expanded' | 'collapsed'>,
  selected?: SidebarSelectedType,
  selectedValue?: string,
}

const Sidebar = (props: SidebarProps) => {
  const session = useContext(SessionCtx);
  const collapseIfSmallScreen = () => { 
    if (window.innerWidth < 640 ) props.setSidebarState('collapsed') 
  };
  createEffect(() => {
    setDid(session.active ? session.did : undefined);
  });

  return (
    <div class="mt-2 grow shrink basis-0 data-[state=collapsed]:hidden sm:min-w-40 md:min-w-52 lg:min-w-0" data-state={props.sidebarState}>
      <div class="sm:ml-1 flex">
        <div class="grow">
          <div class="flex justify-between mx-2 mb-2">
            <p class="text-2xl font-semibold">📌 Boards</p>
            <button
              class="inline-block cursor-pointer sm:hidden dark:text-theme-pink"
              onClick={() => props.setSidebarState("collapsed")}>
              <LeftPanelClose width={sidebarIconSize} height={sidebarIconSize} />
            </button>
          </div>
          <Show when={session.loginInProcess || tags.loading}>
            <div class="ml-2 mt-4"> <Loading /> </div>
          </Show>
          <Show when={!session.active && !session.loginInProcess}>
            <AButton
              href="/"
              class="ml-2 my-2 mx-auto text-xl"
              onClick={collapseIfSmallScreen}>
              Login
            </AButton>
          </Show>
          <Show when={session.active}>
            <div class="flex flex-col ml-2 my-2 gap-1 w-fit">
              <div>
                <div 
                  classList={{ 
                    'bg-gray-100': props.selected === 'account',
                    'dark:bg-darkish-pink': props.selected === 'account',
                  }}
                  class="w-fit rounded-full p-0.5">
                  <A
                    class="dark:text-theme-pink"
                    href="/account"
                    onClick={collapseIfSmallScreen}>
                    <User />
                  </A>
                </div>
              </div>
              <AButton
                href="/create-board"
                onClick={collapseIfSmallScreen}
                classList={{ 
                  'bg-gray-100': props.selected === 'create',
                  'dark:bg-darkish-pink': props.selected === 'create',
                }}>
                Create new board
              </AButton>
            </div>
            <button class="flex text-lg" onClick={() => setTagsExpanded(!tagsExpanded())}>
              <Show when={tagsExpanded()} fallback={<ChevronRight width={ChevronSize} height={ChevronSize} />}>
                <ChevronDown width={ChevronSize} height={ChevronSize} />
              </Show>
              <span class="text-lg font-bold">Your boards</span>
            </button>
            <Show when={tagsExpanded()}>
              <Switch>
                {/* TODO: Show error */}
                <Match when={tags()}>
                  <div class="flex flex-col sm:w-fit mt-2 divide-y divide-gray-300 border border-gray-300 dark:divide-theme-pink dark:border-theme-pink">
                    <For each={tags()}>
                      {(item) => (
                        <A
                          href={`/profile/${did()}/board/${item.rkey}`}
                          onClick={collapseIfSmallScreen}
                          classList={{ 
                            'bg-gray-100': props.selected === 'tag' && item.rkey === props.selectedValue,
                            'dark:bg-darkish-pink': props.selected === 'tag' && item.rkey === props.selectedValue,
                          }}
                          class="px-2 py-1 hover:bg-gray-100 dark:hover:bg-darkish-pink cursor-pointer">
                          {item.title.length ? item.title : item.rkey}
                        </A>
                      )}
                    </For>
                  </div>
                </Match>
              </Switch>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;