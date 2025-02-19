import { XRPC } from "@atcute/client";
import { At } from "@atcute/client/lexicons";
import { createContext } from "solid-js";

export type ActiveSession = {
  did: At.DID,
  rpc: XRPC,
  logout: () => void,
};

export type InactiveSession = {
  login: (handleOrDid: string, password: string) => Promise<ActiveSession>,
  loginInProcess: boolean,
}

export type Session = 
  { active: true } & ActiveSession 
  | { active: false } & InactiveSession

export const sessionAssertActive = (session: Session): ActiveSession => {
  if (session.active) {
    return session;
  } else {
    throw new Error('Session is not active');
  }
}

export const SessionCtx = createContext<Session>({
  active: false, 
  login: async () => { throw new Error('Session Context not set up yet') },
  loginInProcess: false,
});