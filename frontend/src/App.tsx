import { Route, Router } from "@solidjs/router";
import LoginScreen from "./screens/Login";
import { ActiveSession, LoginOptions, Session, SessionCtx } from "./lib/auth";
import BoardScreen from "./screens/Board";
import { resolveDid, resolveHandle } from "./lib/resolution";
import { isDid, wait } from "./lib/util";
import { getPdsEndpoint } from "@atcute/client/utils/did";
import { AtpSessionData, CredentialManager, XRPC } from "@atcute/client";
import { At } from "@atcute/client/lexicons";
import { createStore } from "solid-js/store";
import Account from "./screens/Account";
import { createAuthorizationUrl, deleteStoredSession, finalizeAuthorization, getSession, OAuthUserAgent, resolveFromService } from "@atcute/oauth-browser-client";
import CreateBoard from "./screens/CreateBoard";
import NotFound from "./screens/NotFound";

function isAtpSessionData(o: any): o is AtpSessionData {
  return o.refreshJwt && o.accessJwt && o.handle && o.did;
}

function App() {
  const autoLogin = async () => {
    let successful = false;
    try {
      const autoLoginStr = localStorage.getItem('autoLogin');
      if (autoLoginStr) {
        const autoLoginInfo = JSON.parse(autoLoginStr);
        if (!isAtpSessionData(autoLoginInfo)) {
          return false;
        }
        const didDoc = await resolveDid(autoLoginInfo.did);
        const pds = getPdsEndpoint(didDoc);
        if (!pds) {
          console.error('Autologin failed due to invalid/unreachable pds');
          return false;
        }
        const manager = new CredentialManager({ service: pds });
        try {
          await manager.resume(autoLoginInfo);
        } catch (err) {
          console.error('Autologin failed', err);
          return false;
        }
        const rpc = new XRPC({ handler: manager });

        setSession({
          active: true,
          type: 'password',
          did: autoLoginInfo.did,
          rpc,
          logout,
          loginInProcess: false,
        });
        successful = true;
        return true;
      } else {
        const oauthDid = localStorage.getItem('oauthDid');
        if (!oauthDid || !isDid(oauthDid)) return false;
        const session = await getSession(oauthDid, { allowStale: true });
        const agent = new OAuthUserAgent(session);
        setSession({
          active: true,
          type: 'oauth',
          did: session.info.sub, 
          rpc: new XRPC({ handler: agent }), 
          logout,
          loginInProcess: false,
        })
        successful = true;
        return true;
      }
    } catch (err) {
      console.error('Autologin failed', err);
    } finally {
      if (!successful) {
        logout();
      }
    }
    return successful;
  }

  const finalizeOauth = async () => {
    try {
      // `createAuthorizationUrl` asks for the server to redirect here with the
      // parameters assigned in the hash, not the search string.
      const params = new URLSearchParams(location.hash.slice(1));

      if (params.size === 0) {
        return false;
      }

      // this is optional, but after retrieving the parameters, we should ideally
      // scrub it from history to prevent this authorization state to be replayed,
      // just for good measure.
      history.replaceState(null, '', location.pathname + location.search);

      const session = await finalizeAuthorization(params);
      const agent = new OAuthUserAgent(session);
      const did = session.info.sub;

      console.log('Finalize oauth', did);
      localStorage.setItem('oauthDid', did);

      setSession({
        active: true,
        type: 'oauth',
        did,
        rpc: new XRPC({ handler: agent }),
        logout,
        loginInProcess: false,
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  const login = async (options: LoginOptions): Promise<ActiveSession> => {
    const did: At.DID = isDid(options.didOrHandle)
      ? options.didOrHandle
      : await resolveHandle(options.didOrHandle);
    const didDoc = await resolveDid(did);
    const pds = getPdsEndpoint(didDoc);
    if (!pds) throw new Error('DID Doc does not contain a pds reference');

    if (options.type === 'password') {
      const manager = new CredentialManager({ service: pds });
      await manager.login({ identifier: did, password: options.password });
      const rpc = new XRPC({ handler: manager });

      setSession({
        active: true,
        type: 'password',
        did,
        rpc,
        logout,
        loginInProcess: false,
      });

      localStorage.setItem('autoLogin', JSON.stringify({
        refreshJwt: manager.session?.refreshJwt,
        accessJwt: manager.session?.accessJwt,
        handle: manager.session?.handle,
        did,
      }));

      return {
        type: 'password',
        did,
        rpc,
        logout
      };
    } else {
      const { metadata } = await resolveFromService(pds);
      const authUrl = await createAuthorizationUrl({
        metadata: metadata,
        identity: {
          id: did,
          raw: options.didOrHandle,
          pds: new URL(pds),
        },
        scope: import.meta.env.VITE_OAUTH_SCOPE,
      });
      await wait(200);
      window.location.assign(authUrl);

      await new Promise((_resolve, reject) => {
        const listener = () => {
          reject(new Error(`Login request was aborted`));
        };

        window.addEventListener('pageshow', listener, { once: true });
      });
      throw new Error(`Login request was aborted`);
    }
  }

  const logout = async () => {
    const oauthDid = localStorage.getItem('oauthDid');
    localStorage.removeItem('autoLogin');
    localStorage.removeItem('oauthDid');
    setSession({
      active: false,
      login,
      loginInProcess: false,
    });
    if (!oauthDid || !isDid(oauthDid)) return;
    try {
      const session = await getSession(oauthDid, { allowStale: true });
      const agent = new OAuthUserAgent(session);
      await agent.signOut();
    } catch {
      deleteStoredSession(oauthDid);
    }
  }

  const [session, setSession] = createStore<Session>({
    active: false,
    login,
    loginInProcess: true,
  });

  (async () => {
    if (!await autoLogin()) {
      await finalizeOauth();
    }
  })()

  return (
    <SessionCtx.Provider value={session}>
      <Router>
        <Route path="/" component={LoginScreen} />
        <Route path="/create-board" component={CreateBoard} />
        <Route path="/profile/:did/board/:tag" component={BoardScreen} />
        <Route path="/account" component={Account} />
        <Route path="*" component={NotFound} />
      </Router>
    </SessionCtx.Provider>
  )
}

export default App