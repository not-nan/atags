import { createSignal, JSX, Show } from "solid-js";
import Sidebar, { SidebarSelectedType } from "./Sidebar";
import { LeftPanelClose, LeftPanelOpen } from "../assets/icons";

export const sidebarIconSize = 42;

export const [sidebarState, setSidebarState] = createSignal<'expanded' | 'collapsed'>('expanded');
const sidebarStateInverted = () => sidebarState() === 'expanded' ? 'collapsed' : 'expanded';

export type NavigationProps = { 
  children: JSX.Element, 
  selected?: SidebarSelectedType, 
  selectedValue?: string,
  topbar?: JSX.Element,
}
const Navigation = (props: NavigationProps) => {
  return (
    <div class="flex lg:justify-center max-h-dvh">
      <Sidebar sidebarState={sidebarState()} setSidebarState={setSidebarState} selected={props.selected} selectedValue={props.selectedValue} />
      <div class="grow shrink lg:max-w-2xl xl:max-w-3xl mx-1 max-sm:data-[state=collapsed]:hidden overflow-clip" data-state={sidebarStateInverted()}>
        <div class="flex justify-between pl-2 my-1">
          <button class="cursor-pointer dark:text-theme-pink" onClick={() => setSidebarState(sidebarStateInverted())}>
            <Show when={sidebarState() === 'expanded'} fallback={<LeftPanelOpen width={sidebarIconSize} height={sidebarIconSize} />}>
              <LeftPanelClose width={sidebarIconSize} height={sidebarIconSize} />
            </Show>
          </button>
          <div class="flex">
            { props.topbar ?? <></> }
          </div>
        </div>
        <div class="overflow-scroll h-full">
          { props.children }
          <div class="h-16" />
        </div>
      </div>
      <div class="lg:grow lg:shrink lg:basis-0 data-[state=collapsed]:hidden" data-state={sidebarState()}/>
    </div>
  );
}

export default Navigation;