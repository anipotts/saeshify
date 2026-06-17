const DICTIONARY: Record<string, string[]> = {
  align: ["AH", "L", "AY", "N"],
  backend: ["B", "AE", "K", "EH", "N", "D"],
  bite: ["B", "AY", "T"],
  bright: ["B", "R", "AY", "T"],
  clock: ["K", "L", "AA", "K"],
  clocks: ["K", "L", "AA", "K", "S"],
  close: ["K", "L", "OW", "S"],
  code: ["K", "OW", "D"],
  cold: ["K", "OW", "L", "D"],
  dense: ["D", "EH", "N", "S"],
  dial: ["D", "AY", "AH", "L"],
  file: ["F", "AY", "AH", "L"],
  folds: ["F", "OW", "L", "D", "Z"],
  flows: ["F", "L", "OW", "Z"],
  glow: ["G", "L", "OW"],
  hand: ["HH", "AE", "N", "D"],
  keep: ["K", "IY", "P"],
  light: ["L", "AY", "T"],
  line: ["L", "AY", "N"],
  live: ["L", "AY", "V"],
  low: ["L", "OW"],
  maps: ["M", "AE", "P", "S"],
  measured: ["M", "EH", "ZH", "ER", "D"],
  mode: ["M", "OW", "D"],
  night: ["N", "AY", "T"],
  private: ["P", "R", "AY", "V", "AH", "T"],
  public: ["P", "AH", "B", "L", "IH", "K"],
  right: ["R", "AY", "T"],
  rides: ["R", "AY", "D", "Z"],
  scheme: ["S", "K", "IY", "M"],
  schemes: ["S", "K", "IY", "M", "Z"],
  speakers: ["S", "P", "IY", "K", "ER", "Z"],
  tails: ["T", "EY", "L", "Z"],
  tight: ["T", "AY", "T"],
  time: ["T", "AY", "M"],
  vowels: ["V", "AW", "AH", "L", "Z"],
  word: ["W", "ER", "D"],
  writes: ["R", "AY", "T", "S"]
};

const VOWELS = new Set(["AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW"]);

export function normalizeWord(word: string) {
  return word.toLowerCase().replace(/[^a-z0-9']/g, "");
}

export function phonemesForWord(word: string) {
  const normalized = normalizeWord(word);
  if (!normalized) return [];
  if (DICTIONARY[normalized]) return DICTIONARY[normalized];

  if (normalized.endsWith("ight")) return ["AY", "T"];
  if (normalized.endsWith("and")) return ["AE", "N", "D"];
  if (normalized.endsWith("ine")) return ["AY", "N"];
  if (normalized.endsWith("ime")) return ["AY", "M"];
  if (normalized.endsWith("ow")) return ["OW"];
  if (normalized.endsWith("old")) return ["OW", "L", "D"];
  if (normalized.endsWith("ode")) return ["OW", "D"];
  if (normalized.endsWith("ing")) return ["IH", "NG"];

  return approximateLetters(normalized);
}

export function rhymeTail(phonemes: string[]) {
  let lastVowel = -1;
  phonemes.forEach((phone, index) => {
    if (VOWELS.has(phone.replace(/\d/g, ""))) lastVowel = index;
  });
  if (lastVowel < 0) return phonemes.slice(-2).join(" ");
  return phonemes.slice(lastVowel).map((phone) => phone.replace(/\d/g, "")).join(" ");
}

export function vowelNucleus(tail: string) {
  return tail.split(" ").find((phone) => VOWELS.has(phone)) || tail.split(" ")[0] || "";
}

function approximateLetters(word: string) {
  return word
    .replace(/tion$/, " shun")
    .split("")
    .map((letter) => letter.toUpperCase());
}

