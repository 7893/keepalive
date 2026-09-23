import { handleRequest } from "./router.js";
import { handleScheduled } from "./scheduled.js";

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },

  scheduled(_event, env, ctx) {
    return handleScheduled(env, ctx);
  }
};
