import { STORAGE_KEY } from "./reading-repository.js";
import { DICE_STORAGE_KEY } from "./dice-repository.js";

const LOCAL_DATA_KEYS = Object.freeze([STORAGE_KEY, DICE_STORAGE_KEY]);

/** Clears all local Veil records together and restores both values on failure. */
export function createLocalDataService(storage) {
  return {
    clearAll() {
      let snapshots;
      try {
        snapshots = new Map(
          LOCAL_DATA_KEYS.map((key) => [key, storage.getItem(key)]),
        );
        for (const key of LOCAL_DATA_KEYS) storage.removeItem(key);
      } catch {
        if (snapshots)
          for (const [key, value] of snapshots) {
            try {
              if (value === null) storage.removeItem(key);
              else storage.setItem(key, value);
            } catch {
              // Keep trying the other snapshot; the user still receives a failure.
            }
          }
        throw new Error("无法完整清空本地记录，原有数据已尽力恢复。");
      }
    },
  };
}
