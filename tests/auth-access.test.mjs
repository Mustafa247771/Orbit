import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadSource(path, mocks, extra = "") {
  const source = readFileSync(new URL("../" + path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(
    "(function(require,module,exports,process){" +
      compiled +
      "\n" +
      extra +
      "\n})",
    {},
    { filename: path },
  )(
    (name) => {
      if (!(name in mocks)) throw new Error("Missing test mock: " + name);
      return mocks[name];
    },
    module,
    module.exports,
    {
      env: {
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: "test.apps.googleusercontent.com",
      },
    },
  );
  return module.exports;
}

function hooks() {
  const states = [],
    refs = [];
  let stateIndex = 0,
    refIndex = 0;
  return {
    react: {
      useState(initial) {
        const index = stateIndex++;
        if (!(index in states))
          states[index] = typeof initial === "function" ? initial() : initial;
        return [
          states[index],
          (value) => {
            states[index] =
              typeof value === "function" ? value(states[index]) : value;
          },
        ];
      },
      useRef(initial) {
        const index = refIndex++;
        return refs[index] ?? (refs[index] = { current: initial });
      },
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      useEffect: () => {},
    },
    render(fn) {
      stateIndex = refIndex = 0;
      return fn();
    },
  };
}

function googleHarness(options = {}) {
  const calls = [];
  const auth = {
    currentUser: {
      uid: "firebase-uid",
      providerData: [{ providerId: "google.com" }],
    },
  };
  const google = loadSource("src/features/auth/model/GoogleSignInService.ts", {
    "expo-constants": {
      __esModule: true,
      default: {
        executionEnvironment: options.expoGo ? "storeClient" : "bare",
      },
      ExecutionEnvironment: { StoreClient: "storeClient" },
    },
    "react-native": {
      Platform: { OS: options.platform ?? "android" },
      TurboModuleRegistry: {
        get: (name) => {
          calls.push("nativeModule:" + name);
          return options.missingNativeModule ? null : {};
        },
      },
    },
    "react-native-nitro-google-signin": {
      GoogleOneTapSignIn: {
        configure: () => calls.push("configure"),
        checkPlayServices: async () => calls.push("playServices"),
        presentExplicitSignIn: async () =>
          options.cancel
            ? { type: "cancelled", data: null }
            : {
                type: "success",
                data: {
                  idToken: "google-id-token",
                  user: { id: "google-native-id" },
                },
              },
        signOut: async () => {
          calls.push("googleLogout");
          if (options.googleLogoutError)
            throw new Error("native cleanup failed");
        },
      },
      isCancelledResponse: (value) => value.type === "cancelled",
      isSuccessResponse: (value) =>
        value.type === "success" && value.data !== null,
      isErrorWithCode: (error) => typeof error?.code === "string",
      statusCodes: { SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED" },
    },
  });
  const service = loadSource("src/features/auth/model/AuthService.ts", {
    "@/core/firebase/client": { getFirebaseAuth: () => auth },
    "./GoogleSignInService": google,
    "firebase/auth": {
      GoogleAuthProvider: {
        credential: (token) => {
          calls.push("credential:" + token);
          return { token };
        },
      },
      signInWithCredential: async () => {
        calls.push("firebaseGoogleLogin");
        if (options.firebaseLoginError) throw options.firebaseLoginError;
        return {
          user: {
            uid: "firebase-uid",
            email: "observer@example.com",
            displayName: "Observer",
            emailVerified: true,
          },
        };
      },
      signOut: async () => {
        calls.push("firebaseLogout");
        if (options.firebaseLogoutError) throw options.firebaseLogoutError;
        auth.currentUser = null;
      },
    },
  });
  return { service, auth, calls };
}

test("guests cannot open the menu and menu state is isolated when accounts change", () => {
  const h = hooks();
  let session = { canAccessAccount: false, user: null };
  class Catalogue {
    constructor() {
      this.objects = new Map();
    }
    get() {
      return null;
    }
  }
  const module = loadSource(
    "src/features/globe/viewmodels/useEarthViewModel.ts",
    {
      react: h.react,
      "expo-router": { useFocusEffect: () => {}, router: { push: () => {} } },
      "react-native": { AppState: { currentState: "active" } },
      "@/features/auth/viewmodels/AuthProvider": {
        useAuthSession: () => session,
      },
      "@/core/orbit/details": {},
      "@/core/orbit/frames": {},
      "@/core/orbit/propagate": {},
      "@/core/orbit/sun": {},
      "@/core/satellites/CatalogueRepository": {
        OBJECT_LABELS: {},
        catalogueRepository: {},
      },
      "@/core/satellites/family": {},
      "@/core/satellites/OrbitCatalogue": { OrbitCatalogue: Catalogue },
      "@/core/satellites/TrackingRepository": {},
      "./formatDetails": {},
    },
  );
  let model = h.render(module.useEarthViewModel);
  model.toggleMenu();
  assert.equal(h.render(module.useEarthViewModel).menuOpen, false);
  session = { canAccessAccount: true, user: { uid: "account-a" } };
  model = h.render(module.useEarthViewModel);
  model.toggleMenu();
  assert.equal(h.render(module.useEarthViewModel).menuOpen, true);
  session = { canAccessAccount: true, user: { uid: "account-b" } };
  assert.equal(h.render(module.useEarthViewModel).menuOpen, false);
  session = { canAccessAccount: false, user: null };
  assert.equal(h.render(module.useEarthViewModel).canAccessMenu, false);
  session = { canAccessAccount: true, user: { uid: "account-a" } };
  assert.equal(h.render(module.useEarthViewModel).menuOpen, false);
});

test("all menu destinations are behind the root route guard", () => {
  const jsx = (type, props) => ({ type, props });
  const Stack = Object.assign(() => {}, {
    Protected: "Protected",
    Screen: "Screen",
  });
  const session = { ready: true, canAccessAccount: false };
  const module = loadSource(
    "src/app/_layout.tsx",
    {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      react: { useEffect: () => {} },
      "expo-router": { Stack },
      "react-native": {
        View: "View",
        Text: "Text",
        ActivityIndicator: "ActivityIndicator",
      },
      "@/features/auth/viewmodels/AuthProvider": {
        AuthProvider: "Provider",
        useAuthSession: () => session,
      },
      "@/theme/colors": {
        __esModule: true,
        default: { space: "black", accent: "green" },
      },
      "@/components/three/expoGl": {},
      "fast-text-encoding": {},
      "@/theme/interop": {},
      "../../global.css": {},
      "@expo-google-fonts/jetbrains-mono": {},
      "@expo-google-fonts/space-grotesk": {},
      "expo-font": {},
      "expo-splash-screen": { preventAutoHideAsync: () => {} },
    },
    "module.exports.inspectNavigator = AppNavigator;",
  );
  const guard = module.inspectNavigator().props.children;
  assert.equal(guard.props.guard, false);
  const routes = guard.props.children.map((node) => node.props.name);
  for (const route of [
    "profile/index",
    "passes/[id]",
    "sky-finder/[id]",
    "sightings/new",
    "launches/index",
    "spaceflight/index",
    "apod/index",
    "community/index",
    "achievements/index",
  ]) {
    assert.ok(routes.includes(route), route + " must be protected");
  }
  session.canAccessAccount = true;
  assert.equal(module.inspectNavigator().props.children.props.guard, true);
  session.ready = false;
  assert.equal(module.inspectNavigator().type, "View");
});

test("Google cancellation makes no Firebase sign-in request", async () => {
  const h = googleHarness({ cancel: true });
  assert.equal(await h.service.logInWithGoogle(), null);
  assert.equal(h.calls.includes("firebaseGoogleLogin"), false);
});

test("missing Nitro reports the build requirement and still allows Firebase logout", async () => {
  const { authErrorMessage } = loadSource(
    "src/features/auth/model/authErrors.ts",
    {},
  );
  for (const platform of ["android", "ios"]) {
    const h = googleHarness({ missingNativeModule: true, platform });
    await assert.rejects(h.service.logInWithGoogle(), (failure) => {
      assert.equal(failure.code, "google/native-build-required");
      assert.equal(
        authErrorMessage(failure),
        "Google sign-in needs the updated app build. You can use email and password for now.",
      );
      return true;
    });
    assert.ok(h.calls.includes("nativeModule:NitroModules"));
    assert.equal(h.calls.includes("configure"), false);
    assert.equal(h.calls.includes("firebaseGoogleLogin"), false);
    await h.service.logOut();
    assert.equal(h.auth.currentUser, null);
  }
});

test("Expo Go reports the build requirement before accessing native Google modules", async () => {
  const h = googleHarness({ expoGo: true });
  await assert.rejects(
    h.service.logInWithGoogle(),
    (failure) => failure.code === "google/native-build-required",
  );
  assert.equal(h.calls.length, 0);
});

test("Google login uses the Firebase identity and propagates failed token verification", async () => {
  const h = googleHarness();
  const user = await h.service.logInWithGoogle();
  assert.equal(user.uid, "firebase-uid");
  assert.ok(h.calls.includes("credential:google-id-token"));
  const error = { code: "auth/invalid-credential" };
  await assert.rejects(
    googleHarness({ firebaseLoginError: error }).service.logInWithGoogle(),
    (failure) => failure === error,
  );
});

test("logout clears Firebase even if native Google cleanup fails; failed Firebase logout is reported", async () => {
  const h = googleHarness({ googleLogoutError: true });
  await h.service.logOut();
  assert.equal(h.auth.currentUser, null);
  assert.ok(
    h.calls.indexOf("googleLogout") < h.calls.indexOf("firebaseLogout"),
  );
  const error = { code: "auth/network-request-failed" };
  const failed = googleHarness({ firebaseLogoutError: error });
  await assert.rejects(failed.service.logOut(), (failure) => failure === error);
  assert.equal(failed.auth.currentUser.uid, "firebase-uid");
});
