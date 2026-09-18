import { carriedBy, visibleAt } from "../engine/custody";
import { normalize } from "../engine/language";
import type {
  ActorDefinition,
  DrinkKind,
  InteractionContext,
  InteractionHost,
  InteractionResult,
  InteractionState,
  ResponseMeaning,
  TopicDefinition,
} from "./interaction-model";
import {
  actOnObject,
  clarified,
  fillVessel,
  rejected,
  vesselView,
} from "./vessels";
import {
  addressedSpeech,
  beveragesIn,
  interactionText,
  isFollowup,
  namedSubjects,
  negated,
  nounWords,
  objectRequest,
  polarity,
  qualified,
  words,
  hesitation,
  opinionMeaning,
  explicitTeasing,
} from "./interaction-language";

export function activeInteraction(s: InteractionState) {
  return s.context?.room === s.room && s.time - s.context.at <= 30
    ? s.context
    : undefined;
}
export function setInteraction(
  s: InteractionState,
  actor: string,
  kind: InteractionContext["kind"],
  topic: string,
  question?: InteractionContext["question"],
  references: string[] = [],
) {
  s.context = {
    interlocutor: actor,
    kind,
    topic,
    question,
    references,
    at: s.time,
    room: s.room,
  };
}
function describeCandidates(s: InteractionState, ids: string[]) {
  return ids.map((id) => s.entities[id].name).join(" or ");
}
export function entityCandidates(s: InteractionState, phrase: string) {
  const noun = nounWords(phrase);
  if (/^(it|that|this|this one|that one)$/.test(noun))
    return [...s.objectFocus];
  return Object.values(s.entities)
    .filter((e) => {
      const aliases = [e.name, ...e.aliases];
      const drink = vesselView(e);
      if (drink)
        aliases.push(
          drink.kind,
          "drink",
          ...(drink.kind.includes("special") ? ["special", "cocktail"] : []),
        );
      const normalized = aliases.map((a) => nounWords(normalize(a)));
      if (normalized.includes(noun)) return true;
      // Compositional noun groups such as "coffee cup"; no arbitrary trailing verbs.
      const vocabulary = new Set(normalized.flatMap((a) => a.split(" ")));
      return !!noun && noun.split(" ").every((w) => vocabulary.has(w));
    })
    .map((e) => e.id);
}
function resolveEntity(
  s: InteractionState,
  phrase: string,
  host: InteractionHost,
) {
  const all = entityCandidates(s, phrase);
  const reachable = all.filter((id) =>
    (host.accessible ?? ((id) => visibleAt(s.entities, id, s.room)))(id),
  );
  return reachable.length ? reachable : all;
}
export function responseMemory(s: InteractionState) {
  return (s.interactionMemory ??= {
    replies: {},
    opinions: {},
    served: [],
    declined: [],
  });
}
function authoredReply(
  s: InteractionState,
  key: string,
  first: string,
  repeated?: string,
) {
  const memory = responseMemory(s);
  const count = memory.replies[key] ?? 0;
  memory.replies[key] = count + 1;
  return count && repeated ? repeated : first;
}
type ServiceMode = "new" | "refill";
function cleanCandidates(
  s: InteractionState,
  actor: ActorDefinition,
  kind?: DrinkKind,
) {
  const service = actor.service!;
  const ids = service.vessels.filter((id) => {
    const e = s.entities[id];
    return (
      e &&
      !e.destroyed &&
      e.visible &&
      (e.location === "unplaced" ||
        (e.location === service.counter &&
          e.properties.remaining === 0 &&
          visibleAt(s.entities, id, s.room)))
    );
  });
  const preferred = kind === "coffee" || kind === "tea" ? "cup" : "glass";
  return ids.sort(
    (a, b) =>
      Number(s.entities[b].aliases.includes(preferred)) -
      Number(s.entities[a].aliases.includes(preferred)),
  );
}
function refillCandidates(
  s: InteractionState,
  actor: ActorDefinition,
  kind?: DrinkKind,
  preferred?: string,
) {
  if (preferred)
    return actor.service!.vessels.includes(preferred) ? [preferred] : [];
  return actor.service!.vessels.filter((id) => {
    const drink = vesselView(s.entities[id]);
    return drink && (!kind || drink.kind === kind);
  });
}
function serviceAction(
  s: InteractionState,
  host: InteractionHost,
  actor: ActorDefinition,
  kind: DrinkKind,
  vesselId: string | undefined,
  meaning: ResponseMeaning,
  mode: ServiceMode = "new",
): InteractionResult {
  const service = actor.service;
  if (!service || !service.kinds.includes(kind))
    return rejected(
      `${actor.name} cannot serve that drink.`,
      "service:unavailable",
    );
  const ids = vesselId
    ? [vesselId]
    : mode === "new"
      ? cleanCandidates(s, actor, kind).slice(0, 1)
      : refillCandidates(s, actor, kind);
  if (!ids.length)
    return rejected(
      mode === "new"
        ? (service.noClean ??
            "There isn't a clean serving vessel available. Return an empty one to the counter, or request a refill of one you have.")
        : "There isn't a drink here to refill yet.",
      "service:no-vessel",
    );
  if (ids.length !== 1)
    return clarified(
      `Which would you like refilled: ${describeCandidates(s, ids)}?`,
      "service:vessel-choice",
    );
  if (!service.vessels.includes(ids[0]))
    return rejected("That isn't a serving vessel.");
  const result = fillVessel(
    s,
    ids[0],
    kind,
    service.counter,
    host.present(actor.id),
    mode,
  );
  result.meaning = { ...meaning, entities: ids, serviceMode: mode };
  if (result.failed) return result;
  host.record(actor.id, "preference", "preference", `Asked for ${kind}.`, ids);
  setInteraction(s, actor.id, "drink", "drink", undefined, ids);
  const memory = responseMemory(s),
    key = `${actor.id}:${kind}`;
  const line = memory.served.includes(key) ? "" : (service.served[kind] ?? "");
  if (!memory.served.includes(key)) memory.served.push(key);
  memory.declined = memory.declined.filter((id) => id !== actor.id);
  result.lines = [`${actor.name} ${result.lines[0]} ${line}`.trim()];
  result.intent =
    meaning.kind === "accept"
      ? "conversation:accept-offered-drink"
      : "conversation:order-drink";
  return result;
}
function serviceChoice(
  s: InteractionState,
  actor: ActorDefinition,
  kind: DrinkKind,
  ids: string[],
) {
  setInteraction(
    s,
    actor.id,
    "drink",
    "drink",
    { kind: "service-choice", subject: "drink", offered: kind },
    ids,
  );
  return clarified(
    `Would you like a fresh ${kind} in a clean cup or glass, or a refill of your ${ids.length === 1 ? s.entities[ids[0]].name : "earlier drink"}?`,
    "service:new-or-refill",
  );
}
export function offerService(
  s: InteractionState,
  host: InteractionHost,
  actor: ActorDefinition,
  kind = s.preference,
  vesselId?: string,
): InteractionResult {
  const service = actor.service;
  if (!service || !host.present(actor.id))
    return rejected(`${actor.name} isn't here to take an order.`);
  if (!visibleAt(s.entities, service.counter, s.room))
    return rejected("Return to the serving counter for a drink.");
  if (
    vesselId &&
    (!service.vessels.includes(vesselId) ||
      !visibleAt(s.entities, vesselId, s.room) ||
      s.entities[vesselId].properties.remaining !== 0)
  )
    return rejected(
      "Bring that empty cup or glass within reach before asking for its refill.",
    );
  const refills = refillCandidates(s, actor, kind, vesselId).filter(
    (id) =>
      s.entities[id].properties.remaining === 0 &&
      visibleAt(s.entities, id, s.room),
  );
  const mode: ServiceMode = refills.length === 1 ? "refill" : "new";
  const ids = kind
    ? mode === "refill"
      ? refills
      : cleanCandidates(s, actor, kind).slice(0, 1)
    : [];
  if (kind && !ids.length)
    return rejected(
      service.noClean ?? "No clean serving vessel is available just now.",
      "service:no-vessel",
    );
  setInteraction(
    s,
    actor.id,
    "drink",
    "drink",
    {
      kind: kind ? "confirm-drink" : "choose-drink",
      subject: "drink",
      offered: kind,
      vesselId: ids[0],
      serviceMode: mode,
    },
    ids,
  );
  const template =
    mode === "refill" ? service.confirmRefill : service.confirmNew;
  const prompt = template
    ?.replaceAll("{drink}", kind ?? "drink")
    .replaceAll("{vessel}", ids[0] ? s.entities[ids[0]].name : "cup")
    .replaceAll("{alias}", s.alias ?? "");
  return {
    lines: [
      kind ? (prompt ?? `${actor.name}: Another ${kind}?`) : service.offer,
    ],
    minutes: 2,
    intent: "service:offer",
    meaning: {
      kind: "request",
      interlocutor: actor.id,
      subject: "drink",
      entities: ids,
      serviceMode: mode,
    },
  };
}
function topicReply(
  s: InteractionState,
  host: InteractionHost,
  actor: ActorDefinition,
  topic: TopicDefinition,
  meaning: ResponseMeaning,
  body = "",
): InteractionResult {
  if (!host.present(actor.id))
    return clarified(
      `${actor.name} isn't here to continue that conversation.`,
      "conversation:absent",
    );
  const evidence = topic.entityId;
  const existing = activeInteraction(s);
  const detail = topic.details?.find((d) =>
    d.aliases.some((a) => words(body, normalize(a))),
  );
  const stage = evidence
    ? !host.observed(actor.id, evidence)
      ? "unseen"
      : host.corroborated?.(actor.id, evidence)
        ? "corroborated"
        : "seen"
    : detail
      ? detail.aliases[0]
      : meaning.kind === "followup"
        ? "followup"
        : "question";
  const line = evidence
    ? stage === "unseen"
      ? topic.unseen!
      : stage === "corroborated"
        ? (topic.corroborated ?? topic.followup)
        : topic.followup
    : (detail?.response ??
      (meaning.kind === "followup"
        ? topic.followup
        : (topic.question ?? topic.followup)));
  setInteraction(
    s,
    actor.id,
    evidence ? "evidence" : "social",
    topic.id,
    topic.kind === "opinion" && meaning.kind !== "followup"
      ? { kind: "opinion", subject: topic.id }
      : existing?.topic === topic.id
        ? existing.question
        : undefined,
    evidence ? [evidence] : [],
  );
  return {
    lines: [
      authoredReply(
        s,
        `${actor.id}:${topic.id}:${stage}`,
        line,
        topic.repeated,
      ),
    ],
    minutes: 2,
    intent: `conversation:${topic.id}`,
    meaning,
  };
}

/** One reusable interaction dispatcher. Story knowledge enters only through declarations/hooks. */
export function handleInteraction(
  s: InteractionState,
  raw: string,
  host: InteractionHost,
): InteractionResult | undefined {
  const text = interactionText(raw),
    speech = addressedSpeech(text, host.actors),
    body = speech.body;
  const context = activeInteraction(s);
  const actor =
    host.actors.find((a) => a.id === (speech.actor ?? context?.interlocutor)) ??
    host.actors.find((a) => host.present(a.id));
  const accessible =
    host.accessible ?? ((id) => visibleAt(s.entities, id, s.room));
  const request = objectRequest(text);
  if (request) {
    const ids = resolveEntity(s, request.noun, host);
    if (!ids.length) return undefined; // Other chapter-specific actions retain their adapter.
    const meaning: ResponseMeaning = { kind: "object", entities: ids };
    if (qualified(text) || /\b(and|both|all|then)\b/.test(request.noun))
      return {
        ...clarified(
          "Please name one object and one action. No object changed.",
          "object:competing",
        ),
        meaning,
      };
    if (ids.length !== 1)
      return {
        ...clarified(
          `Which object do you mean: ${describeCandidates(s, ids)}? Please repeat the action with its name.`,
          "object:ambiguous",
        ),
        meaning,
      };
    const id = ids[0],
      e = s.entities[id];
    if (request.verb === "show" || request.verb === "give") {
      const recipients = host.actors.filter((a) =>
        a.aliases.some(
          (alias) => nounWords(normalize(alias)) === nounWords(request.person!),
        ),
      );
      if (recipients.length !== 1)
        return {
          ...clarified(
            "Name one present recipient; nothing was shown or transferred.",
          ),
          meaning,
        };
      const recipient = recipients[0];
      meaning.interlocutor = recipient.id;
      if (
        !accessible(id) ||
        !carriedBy(s.entities, id) ||
        !host.present(recipient.id)
      )
        return {
          ...rejected(
            "Hold an accessible object and name a present recipient. Nothing has moved or been inspected.",
          ),
          meaning,
        };
      if (request.verb === "give") {
        e.location = recipient.id;
        e.owner = recipient.id;
        host.record(
          recipient.id,
          "custody",
          id,
          `Received ${e.name} without inspecting it.`,
          [id],
        );
        return {
          lines: [
            `You give ${recipient.name} the ${e.name}. They put it aside unread.`,
          ],
          minutes: 2,
          intent: "object:give",
          meaning,
        };
      }
      host.inspect(recipient.id, id);
      const topic = recipient.topics.find((t) => t.entityId === id);
      if (topic)
        setInteraction(s, recipient.id, "evidence", topic.id, undefined, [id]);
      return {
        lines: [
          `${recipient.name} takes a close look at the ${e.name}, then hands it back to you.`,
          ...(host.afterShow?.(recipient.id, id) ?? []),
        ],
        minutes: 2,
        intent: "object:show",
        meaning,
      };
    }
    let destination: string | undefined;
    if (request.destination) {
      const destinations = resolveEntity(s, request.destination, host);
      if (destinations.length !== 1)
        return {
          ...clarified("Name one accessible destination. Nothing moved."),
          meaning,
        };
      destination = destinations[0];
    }
    const result = actOnObject(
      s,
      { verb: request.verb, id, destination },
      accessible,
    );
    result.meaning = meaning;
    if (!result.failed) {
      s.objectFocus = [id];
      if (request.verb === "examine") host.inspect("player", id);
      else if (["take", "drop", "put"].includes(request.verb))
        host.record("player", "custody", id, result.lines[0], [id]);
      if (request.verb === "take" && e.kind === "Evidence")
        result.lines[0] += host.observed("player", id)
          ? " You recognise the details you read earlier."
          : " You tuck it away unread.";
    }
    return result;
  }
  if (!actor) return undefined;
  const social =
    /^(?:thanks|thank you|cheers)(?: for (?:the drink|the coffee|that))?$/.test(
      body,
    )
      ? "thanks"
      : /^(?:(?:i'm|i am)(?: just)? here for (?:the )?company|just (?:the )?company|i(?:'d| would) like (?:some )?company|let's just chat)$/.test(
            body,
          )
        ? "company"
        : /^(?:goodnight|good night|goodbye|bye|see you(?: later| soon)?)$/.test(
              body,
            )
          ? "goodbye"
          : undefined;
  if (social && actor.social && host.present(actor.id)) {
    if (social !== "thanks") {
      setInteraction(s, actor.id, "social", "plans");
      if (
        social === "company" &&
        !responseMemory(s).declined.includes(actor.id)
      )
        responseMemory(s).declined.push(actor.id);
    }
    return {
      lines: [actor.social[social]],
      minutes: 1,
      intent: `conversation:${social}`,
      meaning: {
        kind: "social",
        interlocutor: actor.id,
        subject: social,
        entities: [],
      },
    };
  }
  const subjects = namedSubjects(body, actor.topics),
    explicit = subjects.filter((t) => !t.external);
  const namedDrinks = [...new Set(beveragesIn(body, host.beverages))];
  const followup = isFollowup(body),
    response = polarity(body);
  const query =
    /^(ask about|ask .* about|what|why|how|when|where|who|does|do |did |is |are |has |have |can you explain|could you explain)/.test(
      body,
    );
  const accepting = /^(?:i )?accept\b/.test(body);
  const explicitRefill = /\b(refill|top up)\b/.test(body);
  const explicitNew =
    /\b(new|fresh|different) (?:one|cup|glass|drink|coffee|tea|water)\b/.test(
      body,
    );
  const requestDrink =
    /^(?:ask for|request|order|refill|top up|(?:a )?(?:new|fresh) (?:one|drink|coffee|tea|water)|(?:can|could|may) i (?:have|try|get|order)|i(?:'d| would) like|i(?:'ll| will) have|yes\b.*(?:have|get|coffee|tea|water)|another (?:drink|coffee|tea|water)|more (?:coffee|tea|water))\b/.test(
      body,
    ) ||
    explicitRefill ||
    explicitNew ||
    host.beverages.some((d) =>
      d.aliases.some((a) => body === a || body.startsWith(a + " ")),
    );
  const another = /\b(another|more)\b/.test(body);
  const clearClaim =
    (/^tell\b/.test(body) ||
      /\b(?:i (?:found|saw|have|discovered|came across)|there is|there's)\b/.test(
        body,
      )) &&
    !requestDrink;
  const opinion =
    explicit.find((t) => t.kind === "opinion" || t.positive) ??
    (context?.topic && context.interlocutor === actor.id
      ? actor.topics.find(
          (t) => t.id === context.topic && (t.kind === "opinion" || t.positive),
        )
      : undefined);
  const bareAnswer =
    /^(?:yes|yeah|yep|no|no thanks.*|no thank you.*|i agree|i disagree|that sounds good|sure|absolutely)$/.test(
      body,
    );
  const opinionClause = body.replace(/^(?:yes|no|yeah|yep)\s+/, "");
  const isOpinion =
    !!opinion &&
    !query &&
    !followup &&
    !requestDrink &&
    !clearClaim &&
    (!subjects.length || explicit.includes(opinion)) &&
    (explicit.includes(opinion) ||
      explicitTeasing(body) ||
      hesitation(body) ||
      bareAnswer ||
      /^(?:yes|yeah|no(?: it| that|$)|i (?:agree|disagree|think)|it (?:does|sounds)|that (?:sounds|does)|maybe|perhaps|not sure|i'm not sure)\b/.test(
        opinionClause,
      ) ||
      opinion.judgments?.positive.some((w) => words(body, w)) ||
      opinion.judgments?.negative.some((w) => words(body, w)));
  const meaning: ResponseMeaning = {
    kind: "unknown",
    interlocutor: actor.id,
    entities: [],
    subject: explicit[0]?.id,
  };
  const attach = (r: InteractionResult) => ({
    ...r,
    meaning: r.meaning ?? meaning,
  });
  if (
    (explicit.length > 1 && !requestDrink) ||
    (speech.competingActors &&
      (isOpinion || requestDrink || followup || clearClaim))
  )
    return attach(
      clarified(
        "There is more than one person or subject in that request. Please choose one; nothing has changed.",
      ),
    );
  if (isOpinion) {
    meaning.kind = "opinion";
    meaning.subject = opinion.id;
    const answer = opinionMeaning(body, opinion);
    meaning.polarity = answer === "ambiguous" ? undefined : answer;
    if (!host.present(actor.id))
      return attach(clarified(`${actor.name} isn't here to hear that answer.`));
    if (explicitTeasing(body)) {
      meaning.tone = "explicit-teasing";
      delete meaning.polarity;
      setInteraction(s, actor.id, "social", opinion.id);
      return attach({
        lines: [opinion.teasing ?? `${actor.name} smiles at the joke.`],
        minutes: 2,
        intent: "conversation:teasing",
      });
    }
    if (answer === "uncertain") {
      meaning.kind = "uncertain";
      return attach({
        lines: [
          opinion.hesitation ??
            `${actor.name}: Take your time. You don't have to decide.`,
        ],
        minutes: 0,
        deferred: true,
        intent: "conversation:hesitation",
      });
    }
    if (!answer || answer === "ambiguous")
      return attach(
        clarified(
          `What do you mean about ${opinion.id}?`,
          "conversation:opinion-clarify",
        ),
      );
    const memory = responseMemory(s),
      key = `${actor.id}:${opinion.id}`,
      previous = memory.opinions[key];
    const line =
      previous === answer
        ? opinion.repeatOpinion
        : previous
          ? opinion.changed?.[answer]
          : undefined;
    host.record(actor.id, "opinion", opinion.id, answer, []);
    memory.opinions[key] = answer;
    setInteraction(s, actor.id, "social", opinion.id);
    return attach({
      lines: [
        line ?? (answer === "positive" ? opinion.positive! : opinion.negative!),
      ],
      minutes: 2,
      intent: "conversation:opinion",
    });
  }

  if (context?.kind === "drink" && !context.question && bareAnswer)
    return attach(
      clarified(
        "Did you want another drink, or were you answering something from earlier?",
      ),
    );
  const activeDrink =
    context?.question?.subject === "drink" && context.interlocutor === actor.id;
  if (activeDrink && /^that sounds\b/.test(body) && !bareAnswer)
    return attach(
      clarified("Do you mean the drink, or what we were talking about before?"),
    );
  if (
    requestDrink ||
    (activeDrink && (bareAnswer || accepting || response === "uncertain"))
  ) {
    meaning.subject = "drink";
    meaning.kind = requestDrink
      ? "request"
      : response === "negative"
        ? "decline"
        : "accept";
    meaning.polarity = response;
    if (
      requestDrink &&
      !namedDrinks.length &&
      !explicitRefill &&
      !explicitNew &&
      !/\bdrink\b/.test(body)
    )
      return attach(
        clarified(
          `Trial limitation: that request is not available here. You can order a drink from the menu.`,
          "conversation:unsupported",
        ),
      );
    if (!actor.service)
      return attach(rejected(`${actor.name} does not offer drink service.`));
    if (!host.present(actor.id))
      return attach(
        clarified(`${actor.name} isn't here to hear that request or reply.`),
      );
    if (activeDrink && hesitation(body)) {
      meaning.kind = "uncertain";
      meaning.entities = context!.references;
      return attach({
        lines: [
          actor.service.hesitation ?? `${actor.name}: No hurry. Let me know.`,
        ],
        minutes: 0,
        deferred: true,
        intent: "conversation:hesitation",
      });
    }
    if (
      activeDrink &&
      context!.question!.kind === "service-choice" &&
      bareAnswer &&
      response !== "negative"
    )
      return attach(
        clarified(
          "A fresh drink, or a refill of the one you already have?",
          "service:new-or-refill",
        ),
      );
    if (
      qualified(body) ||
      /\b(and|then)\b/.test(body) ||
      namedDrinks.length > 1
    ) {
      meaning.kind = "uncertain";
      return attach(
        clarified(
          "Which drink or offer do you mean? Name one choice; nothing has been served.",
          "drink:clarify-order",
        ),
      );
    }
    const ingredientNegation = /\b(no|without)(?: any)? (gin|alcohol)\b/.test(
      body,
    );
    if (negated(body) && !ingredientNegation) {
      if (activeDrink && /^no thank|^no$/.test(body)) {
        setInteraction(s, actor.id, "drink", "drink");
        const memory = responseMemory(s);
        if (!memory.declined.includes(actor.id)) memory.declined.push(actor.id);
        meaning.kind = "decline";
        return attach({
          lines: [actor.service.decline],
          minutes: 2,
          intent: "conversation:decline-drink",
        });
      }
      meaning.kind = "decline";
      return attach(
        rejected(
          "No order was placed. Your objects and pending question are unchanged.",
        ),
      );
    }
    if (
      activeDrink &&
      response !== "negative" &&
      context!.question!.kind !== "service-choice" &&
      (!requestDrink || /^yes\b/.test(body))
    ) {
      meaning.kind = "accept";
      const offered = context!.question!;
      if (
        namedDrinks[0] &&
        offered.offered &&
        namedDrinks[0] !== offered.offered
      )
        return attach(
          clarified(
            `The offer was ${offered.offered}; you named ${namedDrinks[0]}. Please order the different drink explicitly.`,
          ),
        );
      const kind = namedDrinks[0] ?? offered.offered;
      if (!kind)
        return attach(
          clarified(
            "Which would you like: tea, coffee or water? No drink has been selected.",
            "conversation:choose-drink",
          ),
        );
      return attach(
        serviceAction(
          s,
          host,
          actor,
          kind,
          offered.vesselId,
          meaning,
          offered.serviceMode ??
            (offered.vesselId && vesselView(s.entities[offered.vesselId])
              ? "refill"
              : "new"),
        ),
      );
    }
    const mentioned = actor.service.vessels.filter((id) =>
      [s.entities[id].name, ...s.entities[id].aliases].some((a) =>
        words(body, normalize(a)),
      ),
    );
    if (mentioned.length > 1)
      return attach(
        clarified(`Which vessel: ${describeCandidates(s, mentioned)}?`),
      );
    const kind =
      namedDrinks[0] ??
      (mentioned[0] ? vesselView(s.entities[mentioned[0]])?.kind : undefined) ??
      context?.question?.offered ??
      s.preference;
    if (explicitRefill) {
      if (!kind)
        return attach(clarified("Which drink would you like refilled?"));
      return attach(
        serviceAction(s, host, actor, kind, mentioned[0], meaning, "refill"),
      );
    }
    if (explicitNew) {
      if (!kind) return attach(offerService(s, host, actor));
      return attach(
        serviceAction(s, host, actor, kind, undefined, meaning, "new"),
      );
    }
    if (another && kind) {
      const previous = refillCandidates(s, actor, kind, mentioned[0]);
      const reachable = previous.filter(
        (id) =>
          visibleAt(s.entities, id, s.room) &&
          s.entities[id].properties.remaining === 0,
      );
      if (previous.length === 1 && reachable.length === 1) {
        if (!namedDrinks.length)
          return attach(offerService(s, host, actor, kind, previous[0]));
        return attach(
          serviceAction(s, host, actor, kind, previous[0], meaning, "refill"),
        );
      }
      if (previous.length)
        return attach(serviceChoice(s, actor, kind, previous));
    }
    if (!namedDrinks.length) return attach(offerService(s, host, actor, kind));
    return attach(
      serviceAction(s, host, actor, namedDrinks[0], undefined, meaning, "new"),
    );
  }

  const evidence = explicit.find((t) => t.kind === "evidence");
  if (evidence && clearClaim) {
    meaning.kind = "claim";
    meaning.subject = evidence.id;
    meaning.entities = evidence.entityId ? [evidence.entityId] : [];
    if (!host.present(actor.id))
      return attach(
        rejected(`${actor.name} isn't present to hear that account.`),
      );
    if (negated(body))
      return attach(
        clarified(
          "Are you saying you found something, or correcting an earlier statement? Please say which you mean.",
        ),
      );
    host.record(actor.id, "claim", evidence.id, raw, meaning.entities);
    setInteraction(
      s,
      actor.id,
      "evidence",
      evidence.id,
      undefined,
      meaning.entities,
    );
    return attach({
      lines: [evidence.claim!],
      minutes: 2,
      intent: `conversation:${evidence.id}-claim`,
    });
  }
  const topic =
    explicit[0] ??
    (followup ? actor.topics.find((t) => t.id === context?.topic) : undefined);
  const requestedSubject = body.match(/^tell me more about (.+)$/)?.[1];
  if (
    requestedSubject &&
    !/^(?:it|that|this)$/.test(requestedSubject) &&
    !subjects.length
  )
    return attach(
      clarified(
        "Trial limitation: that subject isn't available in this conversation yet.",
        "conversation:unsupported-subject",
      ),
    );
  if (topic && !topic.external && (query || followup)) {
    meaning.kind =
      followup || (query && !/^ask\b/.test(body)) ? "followup" : "topic";
    meaning.subject = topic.id;
    if (followup && !context)
      return attach(
        clarified(
          "Who were you asking, and what would you like to hear more about?",
        ),
      );
    return topicReply(s, host, actor, topic, meaning, body);
  }
  if (
    speech.actor &&
    /^(?:ask|tell|can you|could you)\b/.test(body) &&
    !subjects.length
  )
    return attach(
      clarified(
        `Trial limitation: there is no response for that request yet. You can ask about something ${actor.name} has mentioned.`,
        "conversation:unsupported",
      ),
    );
  // Declared chapter topics continue through the existing chapter adapter.
  return undefined;
}
