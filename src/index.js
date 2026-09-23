import { handleRequest } from "./router.js";
import { handleScheduled } from "./scheduled.js";
import { protectPublicRequest } from "./public-protection.js";

export default {
  fetch(request, env, ctx) {
    return protectPublicRequest(request, env, ctx, () => handleRequest(request, env));
  },

  scheduled(_event, env, ctx) {
    return handleScheduled(env, ctx);
  }
};
