import { XRPC } from "@atcute/client";
import { At } from "@atcute/client/lexicons";
import { createContext } from "solid-js";
import { configureOAuth } from '@atcute/oauth-browser-client';

configureOAuth({
	metadata: {
    client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
		redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URL,
	},
});

export type ActiveSession = {
  type: 'oauth' | 'password',
  did: At.DID,
  rpc: XRPC,
  logout: () => void,
};

export type AuthTypes = 'oauth' | 'password';

export type LoginOptions = {
  type: 'oauth',
  didOrHandle: string,
} | {
  type: 'password',
  didOrHandle: string,
  password: string,
}

export type InactiveSession = {
  login: (options: LoginOptions) => Promise<ActiveSession>,
  loginInProcess: boolean,
}

export type Session = 
    { isDreary: () => boolean }
  & ({ active: true } & ActiveSession 
  | { active: false } & InactiveSession)

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
  isDreary: () => false,
});