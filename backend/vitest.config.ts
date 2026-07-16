import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      // Tests must never share caches/stores with a running dev server —
      // the unfold response cache would otherwise leak real model output
      // into runs that expect the deterministic fake gateway.
      DATABASE_PATH: "test/.tmp/versefold.db",
    },
  },
});
