import { A } from "@solidjs/router";
import { JSX } from "solid-js";

export type AButtonProps = {
  href: string,
  children?: JSX.Element,
  class?: string, 
  classList?: { [k: string]: boolean | undefined }
  onClick?: () => void,
}

const AButton = (props: AButtonProps) => {
  return (
    <A
      href={props.href}
      onClick={props.onClick}
      classList={props.classList}
      class={`${props.class ?? ''} inline-block cursor-pointer rounded-lg border disabled:text-gray-400 border-gray-400 dark:border-theme-pink font-bold px-2 py-1 hover:bg-gray-100 dark:hover:bg-darkish-pink`}>
      { props.children }
    </A>
  );
}

export default AButton;