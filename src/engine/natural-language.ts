/** Conservative surface grammar. Quoted speech is never treated as an instruction. */
export interface SurfaceCommand {
  text: string;
  negated: boolean;
  tentative?: boolean;
  duration?: number;
  manner?: string;
  until?: string;
}
const numbers: Record<string, number> = {
  half: 0.5,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  sixty: 60,
};
export function numberWords(s: string) {
  return s.replace(
    /\b(half|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|sixty)\b/g,
    (w) => String(numbers[w]),
  );
}
export function surfaceCommand(input: string): SurfaceCommand {
  let text = input
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  text = text
    .replace(/\b(dont|don't|do not)\b/g, "don't")
    .replace(/\b(cant)\b/g, "can't")
    .replace(/\b(wont)\b/g, "won't")
    .replace(/\b(whats)\b/g, "what's")
    .replace(/\b(whos)\b/g, "who's")
    .replace(/\b(im)\b/g, "i'm");
  text = text.replace(/^(?:please\s+|ok(?:ay)?[, ]+|alright[, ]+)+/, "");
  text = text.replace(/^(?:(?:carefully|quietly|gently|slowly) )+/, "");
  // Guard the whole request BEFORE stripping conversational wrappers or splitting chains.
  const negated =
    /^(?:(?:i\s+)?(?:don't|won't|can't|wouldn't|shouldn't|never|refuse to|do not|will not|am not going to|am not|decide not to|would rather not|don't want to|do not want to)\b|no[, ]|not\b|please don't\b|i'm not\b|i'd rather not\b|i would prefer not\b)/.test(
      text,
    );
  if (negated) return { text, negated: true };
  if (
    /^(?:should i|would it|what (?:if|happens if|would happen)|if i|maybe|perhaps|i might|i wonder|i'm thinking|i am thinking|explain (?:how|what)|can you explain)\b/.test(
      text,
    )
  )
    return { text, negated: false, tentative: true };
  text = text
    .replace(/^(?:can|could|may) i (?:please )?/, "")
    .replace(
      /^i (?:would like to|want to|wanna|am going to|will|try to|try and) /,
      "",
    )
    .replace(/^i'd like to /, "");
  // A request such as "can I not give it" still carries a negation.
  if (/^(?:not|never|don't)\b/.test(text)) return { text, negated: true };
  text = text.replace(/^(?:carefully|quietly|gently|slowly) /, "");
  if (
    /^(?:where am i|where are we|what (?:can|do) i see|what is here|what's here|what does (?:this place|the room) look like)[?.!]*$/.test(
      text,
    )
  )
    text = "look";
  if (
    /^(?:who(?:'s| is) (?:here|around)|is anyone here|anyone (?:here|around))[?.!]*$/.test(
      text,
    )
  )
    text = "look people";
  text = text
    .replace(/^(?:have|take) a look(?: at)? /, "look at ")
    .replace(
      /^check (?:out )?(?:the |this )?(?:room|place|surroundings)[?.!]*$/,
      "look",
    )
    .replace(/^look at around[?.!]*$/, "look")
    .replace(/^have a look[?.!]*$/, "look");
  text = text
    .replace(/^observe /, "watch ")
    .replace(/^listen closely(?: to)? /, "listen ");
  text = text
    .replace(/^keep an eye on /, "watch ")
    .replace(/^keep watch(?: on)? /, "watch ");
  text = text.replace(
    /^see if (?:anyone|someone) is watching[?.!]*$/,
    "watch observers",
  );
  text = text.replace(
    /^listen to what (?:they're|they are|people are) (?:talking|saying)(?: about)?[?.!]*$/,
    "listen conversation",
  );
  text = text
    .replace(/^stay (?:here|put)(?: for)?(?: a)? /, "wait ")
    .replace(/^stay here[?.!]*$/, "wait");
  text = text
    .replace(/^what do i know about /, "remember ")
    .replace(
      /^what (?:did|has) (mara|luca|inez|celeste) (?:just )?sa(?:y|id)[?.!]*$/,
      "remember $1",
    );
  text = text
    .replace(/^what(?:'s| is) up with (?:this |that |the )?/, "examine ")
    .replace(/^what is (?:this|that) /, "examine ");
  text = text.replace(
    /^check (?:whether|if) (?:the )?(.+?) is (?:locked|open|closed)[?.!]*$/,
    "check $1",
  );
  text = text
    .replace(/^look (?:behind|beneath|underneath) /, "search ")
    .replace(/^peek (?:inside|into|in) /, "peek ")
    .replace(/^peer (?:inside|into|in) /, "peek ");
  text = text.replace(
    /^put (.+?) (?:somewhere safe|away|out of sight)[?.!]*$/,
    "put $1 in coat",
  );
  text = text.replace(/^stash (.+?)(?: away)?[?.!]*$/, "put $1 in coat");
  text = text.replace(
    /^(mara|celeste|luca|inez),? (?:tell me|what do you know) about (.+)$/,
    "ask $1 about $2",
  );
  text = text.replace(
    /^ask about (.+?) (?:to|from) (mara|celeste|luca|inez)$/,
    "ask $2 about $1",
  );
  text = text.replace(/^confront /, "challenge ");
  text = text.replace(
    /^(mara|celeste|luca|inez|she|he) (?:is|are|'s) lying[?.!]*$/,
    "accuse $1 of lying",
  );
  text = text.replace(/^change (?:the )?subject(?: with)?/, "change");
  text = text.replace(
    /^ask (.+?) (?:a |something )?personal(?: question)?[?.!]*$/,
    "ask $1 about company",
  );
  text = text.replace(
    /^(thank|reassure|challenge|deny|agree|tease|joke|flirt|apologise|apologize) (?:to|with) /,
    "$1 ",
  );
  text = text.replace(
    /\b(?:what the (?:hell|heck|fuck)|what on earth)\b/g,
    "what",
  );
  // Casual spelling of WHY is corrected only in questions, never in a text body.
  if (/^ask\b/.test(text)) text = text.replace(/\by\b/g, "why");
  let duration: number | undefined,
    until: string | undefined,
    manner: string | undefined;
  if (/^(watch|wait|listen|follow)\b/.test(text)) {
    text = text
      .replace(/half a (minute|second)/g, "half $1")
      .replace(/a couple of minutes/g, "two minutes")
      .replace(/(?:a|one) (minute|second)/g, "one $1");
    text = numberWords(text);
    text = text.replace(
      /\s+(?:but )?(?:keep(?:ing)? my distance|at a distance|discreetly|quietly)[?.!]*$/,
      () => {
        manner = "distant";
        return "";
      },
    );
    text = text.replace(
      /\s+(?:for )?(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)[?.!]*$/,
      (_, n, unit) => {
        duration = Number(n) * (unit.startsWith("s") ? 1 / 60 : 1);
        return "";
      },
    );
    text = text.replace(/\s+for (?:a |a little )?while[?.!]*$/, () => {
      duration = 5;
      return "";
    });
    const match = text.match(
      /^wait until (.+?) (?:leaves|goes|moves|heads out)[?.!]*$/,
    );
    if (match) {
      until = match[1];
      text = "wait";
    }
    if (text === "wait for") text = "wait";
  }
  return { text, negated: false, duration, until, manner };
}
