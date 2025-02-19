import { Portal } from "solid-js/web";

type Props = { 
  text: string, 
  callback: (confirm: boolean) => void,
  disableButtons?: boolean,
}

const ConfirmDialog = (props: Props) => {
  return (
    <Portal>
      <div class="absolute left-0 top-0 z-50 w-full h-full bg-black/50">
        <div class="flex justify-center">
          <div class="shrink bg-white m-5 p-5 rounded-lg">
            <p class="mb-5 font-bold">{props.text}</p>
            <div class="flex justify-center mt-2">
              <button 
                onClick={() => props.callback(true)}
                disabled={!!props.disableButtons}
                class="cursor-pointer mx-auto rounded-lg border border-gray-400 font-bold px-2 py-1 hover:bg-gray-100">
                Yes
              </button>
              <button 
                onClick={() => props.callback(false)}
                disabled={!!props.disableButtons}
                class="cursor-pointer mx-auto rounded-lg border border-gray-400 font-bold px-2 py-1 hover:bg-gray-100">
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