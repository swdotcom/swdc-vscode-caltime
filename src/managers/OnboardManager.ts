import { ExtensionContext, window } from "vscode";
import { createAnonymousUser } from "./AccountManager";
import { getItem } from "./LocalManager";

const one_min_millis = 1000 * 60;

export function onboardInit(ctx: ExtensionContext, callback: any) {
  let jwt = getItem("jwt");

  if (jwt) {
    // we have the jwt, call the callback that anon was not created
    return callback(ctx);
  }

  if (window.state.focused) {
    // perform primary window related work
    primaryWindowOnboarding(ctx, callback);
  } else {
    // call the secondary onboarding logic
    secondaryWindowOnboarding(ctx, callback);
  }
}

async function primaryWindowOnboarding(ctx: ExtensionContext, callback: any) {
  // great, it's online, create the anon user
  const jwt = await createAnonymousUser();
  if (jwt) {
    // great, it worked. call the callback
    callback(ctx);
    return;
  }

  // server issue, try again in a minute
  setTimeout(() => {
    onboardInit(ctx, callback);
  }, one_min_millis * 2);
}

/**
 * This is called if there's no JWT and it's a secondary window
 * @param ctx
 * @param callback
 */
async function secondaryWindowOnboarding(ctx: ExtensionContext, callback: any) {
  if (!getItem("jwt")) {
    setTimeout(() => {
      onboardInit(ctx, callback);
    }, one_min_millis * 2);
  } else {
    callback(ctx);
  }
}
