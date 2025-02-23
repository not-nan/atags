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
      class={`${props.class ?? ''} cursor-pointer rounded-lg border border-solid disabled:text-gray-400 border-gray-400 dark:border-theme-pink font-bold px-2 py-1 hover:bg-gray-100 dark:hover:bg-darkish-pink`}>
      { props.children }
    </button>
  );
}

export default Button;