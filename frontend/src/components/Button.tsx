import { JSX } from "solid-js";

export type ButtonProps = {
  children?: JSX.Element,
  class?: string, 
  classList?: { [k: string]: boolean | undefined }
  onClick?: () => void,
  disabled?: boolean,
}

const Button = (props: ButtonProps) => {
  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      classList={props.classList}
      class={`${props.class ?? ''} text-lg sm:text-base px-3 sm:px-2 py-3 sm:py-1 cursor-pointer rounded-lg border border-solid disabled:text-gray-400 border-gray-400 dark:border-theme-pink font-bold hover:bg-gray-100 dark:hover:bg-darkish-pink`}>
      { props.children }
    </button>
  );
}

export default Button;