import type { NPCId } from "../engine/types";
export type SocialIntent =
  | "deny"
  | "agree"
  | "thank"
  | "reassure"
  | "challenge"
  | "tease"
  | "joke"
  | "change";
export const socialResponses: Record<SocialIntent, Record<NPCId, string>> = {
  deny: {
    mara: "All right. I won't put an agreement in your mouth.",
    celeste: "Then it is not an agreement. I'll keep the distinction explicit.",
    luca: "Okay. I heard the no. I won't report it as a maybe.",
    inez: "No is a complete entry. I can leave the rest blank.",
  },
  agree: {
    mara: "About which part? I'd rather ask once than remember it wrong.",
    celeste: "Name the part you agree to. The rest can remain open.",
    luca: "Say which bit. I'm trying not to turn company into a commitment.",
    inez: "A specific yes travels better than a general one.",
  },
  thank: {
    mara: "You're welcome. Leave the towel where it is; someone else will need it.",
    celeste:
      "You're welcome. You don't owe me a different answer because of it.",
    luca: "Any time. Well, most times. I'm learning to check.",
    inez: "That's all right. Keep the practical part; you needn't make a speech.",
  },
  reassure: {
    mara: "Thanks. I'll finish the count, then find a quieter corner.",
    celeste:
      "I appreciate that. It doesn't settle the paperwork, but it helps with the evening.",
    luca: "Thanks. I'm still responsible for getting the correction right.",
    inez: "Thank you. Concern is easier to accept when it doesn't arrive with instructions.",
  },
  challenge: {
    mara: "Which part doesn't hold up? I'm willing to separate what I saw from what I assumed.",
    celeste: "Then let's keep the claim and its evidence on separate lines.",
    luca: "Fair question. What I believe and what I can prove aren't the same thing.",
    inez: "You can doubt my account. Tell me which detail you want checked.",
  },
  tease: {
    mara: "Careful. The second pencil is management.",
    celeste:
      "A little irreverence is survivable. The paperwork has survived worse.",
    luca: "I'd object, but I've lost a fight with this cable twice tonight.",
    inez: "Put it in the book. Under unnecessary but not inaccurate.",
  },
  joke: {
    mara: "I needed that. The room could use a laugh.",
    celeste: "All right. That deserved a minute away from the paperwork.",
    luca: "I'm counting that as additional percussion.",
    inez: "Not bad. Don't make me write a review while I'm on shift.",
  },
  change: {
    mara: "Fine by me. We can leave that thread where it is.",
    celeste: "Of course. An unfinished subject isn't a debt.",
    luca: "Sure. We can put the argument down for a minute.",
    inez: "There's more to an evening than its most difficult question.",
  },
};
export function socialIntent(topic: string): SocialIntent | undefined {
  if (
    /^(?:i (?:don't|do not|can't|cannot) believe (?:that|it|you)|that (?:isn't|is not) true|i doubt (?:that|it)|you(?:'re| are) (?:wrong|lying))\b/.test(
      topic,
    )
  )
    return "challenge";
  if (
    /^(?:no(?: thanks)?|i (?:don't|do not) agree|i (?:refuse|decline)|not interested|i never agreed)(?:\b|$)/.test(
      topic,
    )
  )
    return "deny";
  if (/^(?:thanks|thank you|cheers)(?:\b|$)/.test(topic)) return "thank";
  if (/^(?:yes|okay|ok|i agree|agreed)[.! ]*$/.test(topic)) return "agree";
  if (
    /^(?:it's (?:okay|ok)|don't worry|you(?:'re| are) doing (?:fine|your best)|i'm here for you)(?:\b|$)/.test(
      topic,
    )
  )
    return "reassure";
  if (
    /^(?:let's talk about something else|change the subject|something else)[.! ]*$/.test(
      topic,
    )
  )
    return "change";
  return undefined;
}
