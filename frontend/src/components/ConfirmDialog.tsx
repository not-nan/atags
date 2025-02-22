import { Portal } from "solid-js/web";

type Props = { 
  title: string, 
  subtitle?: string,
  callback: (confirm: boolean) => void,
  disableButtons?: boolean,
}

const ConfirmDialog = (props: Props) => {
  return (
    <Portal>
      <div class="absolute left-0 top-0 z-50 w-full h-full bg-black/50 dark:bg-black/75">
        <div class="flex justify-center">
          <div class="shrink bg-white dark:bg-dark-background-color border border-gray-400 dark:border-theme-pink m-5 p-5 rounded-lg">
            <div class="mb-5">
              <p class="font-bold text-lg text-center">{props.title}</p>
              <p>{ props.subtitle ?? '' }</p>
            </div>
            <div class="flex justify-center mt-2">
              <button 
                onClick={() => props.callback(true)}
                disabled={!!props.disableButtons}
                class="cursor-pointer mx-auto rounded-lg border border-gray-400 dark:border-theme-pink font-bold px-2 py-1 hover:bg-gray-100 dark:hover:bg-darkish-pink">
                Yes
              </button>
              <button 
                onClick={() => props.callback(false)}
                disabled={!!props.disableButtons}
                class="cursor-pointer mx-auto rounded-lg border border-gray-400 dark:border-theme-pink font-bold px-2 py-1 hover:bg-gray-100 dark:hover:bg-darkish-pink">
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export default ConfirmDialog;