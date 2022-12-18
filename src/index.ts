import { createCacheInstance } from "./instance";

export { createCacheInstance }
export const { suspend, preload, peek, clear } = createCacheInstance();
