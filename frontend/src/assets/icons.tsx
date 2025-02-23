export type Size = { width: number | string, height: number | string }

export const Add = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M11 17h2v-4h4v-2h-4V7h-2v4H7v2h4zm1 5q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"/></svg>

export const Delete = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zm2-4h2V8H9zm4 0h2V8h-2z"/></svg>

export const Settings = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="m9.25 22l-.4-3.2q-.325-.125-.612-.3t-.563-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2zm2.8-6.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5"/></svg>

export const Edit = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M3 21v-4.25L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.438.65T21 6.4q0 .4-.137.763t-.438.662L7.25 21zM17.6 7.8L19 6.4L17.6 5l-1.4 1.4z"/></svg>

export const TagRemove = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M17 3v2h-1v8.175l-2-2V5h-4v2.175L7.825 5L7 4.175V3zm-5 20l-1-1v-6H6v-2l2-2v-1.15L1.4 4.2l1.4-1.4l18.4 18.4l-1.45 1.4l-6.6-6.6H13v6zm-3.15-9h2.3l-1.1-1.1l-.05-.05zm1.2-1.1"/></svg>

export const Close = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="m8.4 17l3.6-3.6l3.6 3.6l1.4-1.4l-3.6-3.6L17 8.4L15.6 7L12 10.6L8.4 7L7 8.4l3.6 3.6L7 15.6zm3.6 5q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"/></svg>

export const User = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M12 12q-1.65 0-2.825-1.175T8 8t1.175-2.825T12 4t2.825 1.175T16 8t-1.175 2.825T12 12m-8 8v-2.8q0-.85.438-1.562T5.6 14.55q1.55-.775 3.15-1.162T12 13t3.25.388t3.15 1.162q.725.375 1.163 1.088T20 17.2V20z"/></svg>

export const Loading = () => 
  <div role="status">
      <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 dark:fill-theme-pink" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
      </svg>
      <span class="sr-only">Loading...</span>
  </div>

export const OpenRecord = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h14v-7h2v7q0 .825-.587 1.413T19 21zm4.7-5.3l-1.4-1.4L17.6 5H14V3h7v7h-2V6.4z"/></svg>

export const ChevronLeft = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="m14 18l-6-6l6-6l1.4 1.4l-4.6 4.6l4.6 4.6z"/></svg>

export const ChevronDown = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="m12 15.4l-6-6L7.4 8l4.6 4.6L16.6 8L18 9.4z"/></svg>

export const ChevronRight = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M12.6 12L8 7.4L9.4 6l6 6l-6 6L8 16.6z"/></svg>

export const RightPanelOpen = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M11.5 16V8l-4 4zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm11-2h3V5h-3zm-2 0V5H5v14zm2 0h3z"/></svg>

export const RightPanelClose = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M7.5 8v8l4-4zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm11-2h3V5h-3zm-2 0V5H5v14zm2 0h3z"/></svg>

export const LeftPanelOpen = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M12.5 8v8l4-4zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm3-2V5H5v14zm2 0h9V5h-9zm-2 0H5z"/></svg>

export const LeftPanelClose = (props: Partial<Size>) => <svg xmlns="http://www.w3.org/2000/svg" width={props.width ?? "32"} height={props.height ?? "32"} viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 16V8l-4 4zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm3-2V5H5v14zm2 0h9V5h-9zm-2 0H5z"/></svg>