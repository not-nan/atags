import { Portal } from "solid-js/web";
import Button from "./Button";

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
          <div class="shrink bg-white dark:bg-dark-background-color border border-solid border-gray-400 dark:border-theme-pink m-5 p-5 rounded-lg">
            <div class="mb-5">
              <p class="font-bold text-lg text-center">{props.title}</p>
              <p>{ props.subtitle ?? '' }</p>
            </div>
            <div class="flex justify-center mt-2">
              <Button 
                onClick={() => props.callback(true)}
                disabled={!!props.disableButtons}
                class="mx-auto">
                Yes
              </Button>
              <Button 
                onClick={() => props.callback(false)}
                disabled={!!props.disableButtons}
                class="mx-auto">
                No
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export default ConfirmDialog;