import { STORAGE_KEY } from "./data.js";
let expected,
  readable = false;
const validSnapshot = (s) =>
  !!s &&
  typeof s.id === "string" &&
  typeof s.consulted === "string" &&
  ["month", "ytd", "year"].every(
    (k) =>
      s[k] && typeof s[k].na === "string" && typeof s[k].original === "string",
  ) &&
  Array.isArray(s.positions) &&
  s.positions.every((r) => typeof r.name === "string") &&
  !!s.benchmark;
const validProfile = (p) =>
  !!p &&
  ["id", "url", "pseudo", "name", "strategy", "checked"].every(
    (k) => typeof p[k] === "string",
  ) &&
  Array.isArray(p.snapshots) &&
  p.snapshots.every(validSnapshot) &&
  Array.isArray(p.publications) &&
  p.publications.every(
    (h) =>
      typeof h.text === "string" &&
      validSnapshot(h.snapshot) &&
      h.profile &&
      h.image,
  );

export function load() {
  try {
    expected = localStorage.getItem(STORAGE_KEY);
    const v = expected ? JSON.parse(expected) : { version: 1, profiles: [] };
    if (
      v.version !== 1 ||
      !Array.isArray(v.profiles) ||
      !v.profiles.every(validProfile)
    )
      throw Error();
    readable = true;
    return v;
  } catch {
    readable = false;
    return {
      version: 1,
      profiles: [],
      error:
        "Stockage illisible ou indisponible. Les données existantes sont préservées.",
    };
  }
}
export function save(value) {
  try {
    if (!readable || localStorage.getItem(STORAGE_KEY) !== expected)
      throw Error();
    const raw = JSON.stringify(value);
    localStorage.setItem(STORAGE_KEY, raw);
    expected = raw;
    return true;
  } catch {
    return false;
  }
}
