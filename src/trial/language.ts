import { normalize } from "../engine/language";
import type { TrialState } from "./state";

// Local surface cleanup only. Never remove negation or conditional clauses.
export function trialText(raw: string) {
  const nearName = (word: string) => {
    for (const name of ["sable", "vesper"]) {
      const variants = new Set<string>();
      for (let i = 0; i < name.length; i++) {
        variants.add(name.slice(0, i) + name.slice(i + 1));
        if (i + 1 < name.length)
          variants.add(
            name.slice(0, i) + name[i + 1] + name[i] + name.slice(i + 2),
          );
      }
      if (variants.has(word)) return name;
    }
    return word;
  };
  return normalize(raw)
    .replace(/^(?:actually|sorry|please|okay|ok)\s+/, "")
    .replace(/\s+please$/, "")
    .replace(
      /\b(cant|dont|wont|im)\b/g,
      (w) => ({ cant: "can't", dont: "don't", wont: "won't", im: "i'm" })[w]!,
    )
    .replace(
      /^((?:(?:hi|hello|hey|thanks|thank you) )?)([a-z]+)\b/,
      (_, lead: string, word: string) => lead + nearName(word),
    )
    .replace(
      /\b((?:ask|tell|to|with) )([a-z]+)\b/g,
      (_, lead: string, word: string) => lead + nearName(word),
    );
}

export function speechText(text: string) {
  return text
    .replace(
      /^(?:(?:hi|hello|hey|thanks|thank you) )?(?:sable|vesper)\b\s*/,
      "",
    )
    .replace(/\s+(?:sable|vesper)$/, "")
    .replace(/^(?:please|actually)\s+/, "")
    .replace(/^(?:ask|tell) (?:sable|vesper) (?:about |to )?/, "");
}

export type Topic = NonNullable<TrialState["context"]>["topic"];
// One anchored greeting rule. A question that merely begins "how are you"
// ("how are you feeling about this?") is not a greeting.
export function greeting(text: string) {
  const bare = text
    .replace(/^(?:hi|hello|hey)\b ?/, "")
    .replace(/^sable ?/, "")
    .replace(/ ?sable$/, "");
  return bare
    ? /^how (?:are you(?: doing)?(?: today| tonight| this evening)?|have you been)$|^how's things$/.test(
        bare,
      )
    : /^(?:hi|hello|hey)\b/.test(text);
}
// While one of these subjects is active, a passing "night" or "evening" does
// not change the subject to party plans; the caller asks instead.
export const sensitiveTopics = [
  "hospital",
  "photo",
  "listing",
  "investigation",
  "report",
];
export function namedTopic(text: string, active?: string): Topic {
  if (/\b(menu|cocktail|minor administrative disappointment)\b/.test(text))
    return "drink";
  if (/\b(lids?|jars?|supplier|complaint)\b/.test(text)) return "supplier";
  if (
    /\b(deep sea|prom|octopus|party plans|theme|themed|smoke machine|snacks)\b/.test(
      text,
    )
  )
    return "party";
  if (/\b(music|playlist|speakers)\b/.test(text)) return "music";
  if (
    /\b(hospital|hospitalization|dream|memories|recollection|past)\b/.test(text)
  )
    return "hospital";
  if (/\b(report|medical record)\b/.test(text)) return "report";
  if (
    /\b(notebook|documentation|documenting|observations|write down|writing down)\b/.test(
      text,
    )
  )
    return "notebook";
  if (/\b(listing|provenance|headline|date)\b/.test(text)) return "listing";
  if (
    /\b(photo|photograph|picture|print|cat's cradle|closing party)\b/.test(text)
  )
    return "photo";
  if (
    /\b(investigation|decision|appointment|doctor|examination|exam|update|results?|specialist)\b/.test(
      text,
    )
  )
    return "investigation";
  if (/\b(roleplay|kink|switch|recording)\b/.test(text)) return "roleplay";
  if (greeting(text)) return "plans";
  if (
    /\b(evening|night|plans)\b/.test(text) &&
    !(active && sensitiveTopics.includes(active))
  )
    return "plans";
  return undefined;
}

export function companyReply(
  text: string,
): "offer" | "decline" | "uncertain" | "ask-preference" | undefined {
  const company =
    /\b(company|accompany|come with|go with|join you|sit with|stay with)\b/.test(
      text,
    );
  if (!company) return undefined;
  // Asking what Sable wants is neither an offer nor a refusal.
  if (
    /^(?:have you decided|do you (?:want|prefer)|would you (?:like|prefer|want)|what (?:do|would) you (?:want|prefer|like)|do you know (?:yet )?(?:whether|if))\b/.test(
      text,
    )
  )
    return "ask-preference";
  if (
    /^(?:what if|if i|should i|would you|do you|are you|can you|don't|do not|never)\b/.test(
      text,
    ) ||
    /\b(maybe|perhaps|might|not sure|don't know|do not know)\b/.test(text)
  )
    return "uncertain";
  if (
    /^(?:i (?:can't|cannot|can not|won't|will not|don't want to|do not want to|am not able to|would rather not)|i'm not able to|i'd rather not)\b/.test(
      text,
    )
  )
    return "decline";
  if (/\b(not|never|don't|do not)\b/.test(text)) return "uncertain";
  if (
    /^(?:i(?:'ll| will| can| could| would| offer| am offering)|i'd|offer|can i|could i|may i)\b/.test(
      text,
    )
  )
    return "offer";
  return "uncertain";
}
