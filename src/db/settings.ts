import data from "./settings.json";

export type Settings = { branchName: string };

// Single access point for branch settings. Pages and components must call
// this instead of importing settings.json, so a backend can replace the mock.
export function getSettings(): Settings {
  return { branchName: data.branchName };
}
