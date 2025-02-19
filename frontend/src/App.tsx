import { Route, Router } from "@solidjs/router";
import LoginScreen from "./screens/Login";
import { Session, SessionCtx } from "./lib/auth";
import TagsScreen from "./screens/Tags";
import TaggedScreen from "./screens/Tagged";
import { resolveDid, resolveHandle } from "./lib/resolution";
import { isDid } from "./lib/util";
import { getPdsEndpoint } from "@atcute/client/utils/did";
import { AtpSessionData, CredentialManager, XRPC } from "@atcute/client";
import { At } from "@atcute/client/lexicons";
import { createStore } from "solid-js/store";
import AddTagged from "./screens/AddTagged";
import Account from "./screens/Account";

function isAtpSessionData(o: any): o is AtpSessionData { 
  return o.refreshJwt && o.accessJwt && o.handle && o.did;
}

function App() {
  const autoLogin = async () => {
    let successful = false;
    try {
      const autoLoginStr = localStorage.getItem('autoLogin');
      if (!autoLoginStr) return;
      const autoLoginInfo = JSON.parse(autoLoginStr);
      if (!isAtpSessionData(autoLoginInfo)) {
        return;
      }
      const didDoc = await resolveDid(autoLoginInfo.did);
      const pds = getPdsEndpoint(didDoc);
      if (!pds) {
        console.error('Autologin failed due to invalid/unreachable pds');
        return;
      }
      const manager = new CredentialManager({ service: pds });
      try {
        await manager.resume(autoLoginInfo);
      } catch (err) {
        console.error('Autologin failed', err);
        return;
      }
      const rpc = new XRPC({ handler: manager });

      setSession({ 
        active: true,
        did: autoLoginInfo.did,
        rpc,
        logout,
      });
      successful = true;
    } catch (err) {
      console.error('Autologin failed', err);
    } finally {
      if (!successful) {
        logout();
      }
    }
  }

  const login = async (didOrHandle: string, password: string) => {
    const did: At.DID = isDid(didOrHandle)
      ? didOrHandle
      : await resolveHandle(didOrHandle);
    const didDoc = await resolveDid(did);
    const pds = getPdsEndpoint(didDoc);
    if (!pds) throw new Error('DID Doc does not contain a pds reference');
    const manager = new CredentialManager({ service: pds });
    await manager.login({ identifier: did, password: password });
    const rpc = new XRPC({ handler: manager });

    setSession({ 
      active: true,
      did,
      rpc,
      logout,
      isDreary: () => did === 'did:plc:hx53snho72xoj7zqt5uice4u'
    });

    localStorage.setItem('autoLogin', JSON.stringify({
      refreshJwt: manager.session?.refreshJwt,
      accessJwt: manager.session?.accessJwt,
      handle: manager.session?.handle,
      did,
    }));
    
    return {
      did,
      rpc,
      logout
    };
  }

  const logout = () => {
    localStorage.removeItem('autoLogin');
    setSession({
      active: false,
      login,
      loginInProcess: false,
    });
  }

  const [session, setSession] = createStore<Session>({
    active: false,
    login,
    loginInProcess: true,
    isDreary: () => false,
  });

  autoLogin();

  return (
    <SessionCtx.Provider value={session}>
      <Router>
        <Route path="/" component={LoginScreen} />
        <Route path="/:did/tag" component={TagsScreen}/>
        <Route path="/:did/tag/:tag" component={TaggedScreen}/>
        <Route path="/tag-records" component={AddTagged} />
        <Route path="/account" component={Account} />
      </Router>
    </SessionCtx.Provider>
  )
}

export default App