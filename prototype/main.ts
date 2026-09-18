/// <reference types="vite/client" />
import Phaser from "phaser";
import { Room } from "./room";
import {
  actionDestination,
  availableActions,
  createFixture,
  dispatch,
  inventory,
  invitationRead,
  labels,
  objective,
  summary,
  targets,
  type Action,
  type TargetId,
} from "./simulation";
import "./style.css";

if (!import.meta.env.DEV) throw new Error("Development fixture only");
document.querySelector<HTMLDivElement>("#app")!.innerHTML = [
  '<header><div><span class="eyebrow">A LOCAL ROOM EXPERIMENT · 18+</span><h1>FREAK <em>//</em> CITY</h1></div><p>One room. An unanswered invitation.<br><span>Temporary shapes · nothing is saved</span></p></header>',
  '<main><section class="objective" aria-label="Current objective"><span class="eyebrow">NEXT</span><p id="objective"></p></section>',
  '<section class="room-panel" aria-label="The vestibule"><div class="room-heading"><h2>The vestibule</h2><span id="clock"></span></div>',
  '<div id="room" role="group" aria-label="Clickable room. Click clear floor to walk, or a person or object to select it."></div>',
  '<p class="hint">Click a person or object, then choose an action. New selections cancel approaches. Escape stops walking.</p></section>',
  '<aside aria-label="Interactions"><section><span class="eyebrow">WITHIN THE ROOM</span><div id="targets" class="target-list"></div></section>',
  '<section><h2 id="selection" tabindex="-1">Choose a target</h2><div id="actions"></div></section>',
  '<section><h2>Inventory</h2><div id="inventory"></div><p id="belonging-note">Other belongings are shown for context; their interactions are outside this room experiment.</p><p id="custody"></p></section>',
  '<section><h2>Agreement</h2><p id="agreement"></p></section><button id="wait">Wait one minute</button></aside>',
  '<section class="response" aria-label="Latest response"><div><span class="eyebrow">WHAT HAPPENED</span><p id="feedback" role="status" aria-live="polite">The envelope is on the dry ledge. Inez is nearby.</p></div>',
  '<div id="private-response" hidden><span class="eyebrow">PRIVATE REFLECTION · NOT SPOKEN</span><p id="thought"></p></div></section></main>',
  '<footer><span>One-room prototype: exits cannot be used here. Reload restarts. Walking does not advance story time.</span><details class="journal"><summary>Activity log</summary><div id="journal"></div></details></footer>',
  '<dialog id="conversation" aria-labelledby="conversation-title"><span class="eyebrow">CONVERSATION</span><h2 id="conversation-title">Inez</h2><div id="speech"></div><div id="replies"></div><button id="close-conversation">Close conversation</button></dialog>',
].join("\n");

let state = createFixture();
let selected: TargetId | undefined;
let aliasDraft = "";
let returnFocus: HTMLElement | undefined;
const $ = (id: string) => document.getElementById(id)!;
const dialog = $("conversation") as HTMLDialogElement;
const feedback = (text: string) => {
  $("feedback").textContent = text;
};
function log(title: string, lines: string[]) {
  const article = document.createElement("article");
  const heading = document.createElement("h3");
  heading.textContent = title;
  article.append(heading);
  for (const line of lines) {
    const p = document.createElement("p");
    p.textContent = line;
    article.append(p);
  }
  $("journal").prepend(article);
}
function button(label: string, fn: () => void, parent: HTMLElement) {
  const b = document.createElement("button");
  b.textContent = label;
  b.onclick = fn;
  parent.append(b);
  return b;
}
function targetLabel(id: TargetId) {
  return (
    targets(state).find((t) => t.id === id)?.label ??
    (id === "invitation" ? "The invitation" : "Carried envelope")
  );
}
function select(id: TargetId) {
  scene.cancel();
  selected = id;
  feedback("Selected " + targetLabel(id) + ". Choose an action.");
  render();
}
const scene = new Room({
  state: () => state,
  select,
  feedback,
  position(p, moving) {
    $("room").dataset.x = p.x.toFixed(2);
    $("room").dataset.y = p.y.toFixed(2);
    $("room").dataset.moving = String(moving);
  },
  moved() {
    selected = undefined;
    render();
  },
});
function closeConversation(announce = true) {
  dialog.close();
  if (announce) feedback("Conversation closed.");
  (returnFocus?.isConnected ? returnFocus : $("selection")).focus();
}
$("close-conversation").onclick = () => closeConversation();
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeConversation();
});
function renderReplies() {
  $("replies").replaceChildren();
  for (const id of availableActions(state, "inez").filter(
    (a) => a !== "talk",
  )) {
    if (id === "alias") {
      const form = document.createElement("form");
      const label = document.createElement("label");
      label.textContent = "The alias you want used here";
      label.htmlFor = "alias";
      const input = document.createElement("input");
      input.id = "alias";
      input.name = "alias";
      input.maxLength = 24;
      input.required = true;
      input.autocomplete = "off";
      input.value = aliasDraft;
      input.setAttribute("aria-describedby", "alias-help");
      input.oninput = () => {
        aliasDraft = input.value;
        input.setCustomValidity("");
      };
      const help = document.createElement("p");
      help.id = "alias-help";
      help.textContent =
        "1–24 characters. Give only an alias; keep the invitation's explanation to yourself for now.";
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.textContent = labels.alias;
      form.append(label, input, help, submit);
      form.onsubmit = (event) => {
        event.preventDefault();
        if (
          !input.value
            .trim()
            .replace(/[<>\x00-\x1f]/g, "")
            .trim()
        ) {
          input.setCustomValidity("Choose an alias of 1–24 characters.");
          input.reportValidity();
          return;
        }
        perform({ id: "alias", target: "inez", alias: input.value });
      };
      $("replies").append(form);
    } else
      button(labels[id], () => perform({ id, target: "inez" }), $("replies"));
  }
}
function execute(action: Action) {
  const knewInvitation = invitationRead(state);
  const result = dispatch(state, action);
  state = result.state;
  const conversation = [
    "talk",
    "alias",
    "show-invitation",
    "ask-sender",
    "ask-care",
    "accept-care",
    "decline-care",
  ].includes(action.id);
  // Exact authored speech; legacy exterior/service staging is not projected here.
  const lines =
    conversation && result.spokenLines.length
      ? result.spokenLines
      : result.lines;
  log(labels[action.id], lines);
  feedback(lines.join(" "));
  $("private-response").hidden = true;
  if (
    result.ok &&
    action.id === "read" &&
    !knewInvitation &&
    invitationRead(state)
  ) {
    const reflection = dispatch(state, { id: "think" });
    state = reflection.state;
    $("thought").textContent = reflection.lines.join(" ");
    $("private-response").hidden = !reflection.lines.length;
    log("Private reflection — not spoken", reflection.lines);
  }
  render();
  scene.refresh();
  if (conversation && result.ok) {
    $("speech").replaceChildren();
    if (action.id === "alias") {
      const alias = document.createElement("p");
      alias.className = "alias-record";
      alias.textContent = "Your alias: " + state.alias;
      $("speech").append(alias);
    }
    for (const line of lines) {
      const p = document.createElement("p");
      p.textContent = line;
      $("speech").append(p);
    }
    renderReplies();
    if (!dialog.open) {
      returnFocus = document.activeElement as HTMLElement;
      dialog.showModal();
    }
    ($("alias") ?? $("close-conversation")).focus();
  }
}
function perform(action: Action) {
  scene.cancel();
  if (!availableActions(state, action.target).includes(action.id)) {
    feedback("That action is no longer available. Choose a current action.");
    render();
    return;
  }
  const destination = actionDestination(state, action);
  if (destination) scene.approach(destination, () => execute(action));
  else execute(action);
}
function render() {
  const info = summary(state);
  $("clock").textContent = info.clock;
  $("clock").dataset.seconds = String(state.time * 60 + state.world!.subMinute);
  $("objective").textContent = objective(state);
  $("custody").textContent =
    "Envelope: " +
    (info.custody === "player"
      ? "in your inventory"
      : info.custody === "ledge"
        ? "on the dry ledge"
        : info.custody);
  $("custody").dataset.location = info.custody;
  $("agreement").textContent = info.agreement;
  $("targets").replaceChildren();
  for (const t of targets(state))
    button(t.label, () => select(t.id), $("targets")).setAttribute(
      "aria-pressed",
      String(selected === t.id),
    );
  $("selection").textContent = selected
    ? targetLabel(selected)
    : "Choose a target";
  $("actions").replaceChildren();
  if (selected)
    for (const id of availableActions(state, selected)) {
      if (id === "alias") continue;
      button(labels[id], () => perform({ id, target: selected }), $("actions"));
    }
  $("inventory").replaceChildren();
  for (const item of inventory(state)) {
    const name =
      item.name +
      (item.worn
        ? " (worn)"
        : item.location === "envelope"
          ? " (inside envelope)"
          : "");
    if (item.id === "envelope" || item.id === "invitation") {
      const id = item.id;
      button(name, () => select(id), $("inventory"));
    } else {
      const span = document.createElement("span");
      span.className = "belonging";
      span.textContent = name;
      $("inventory").append(span);
    }
  }
  if (inventory(state).some((e) => e.id === "envelope"))
    button(
      "Use envelope on ledge",
      () => {
        scene.cancel();
        selected = "ledge";
        perform({ id: "place", target: "ledge" });
      },
      $("inventory"),
    );
}
$("wait").onclick = () => perform({ id: "wait" });
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (dialog.open) {
    e.preventDefault();
    closeConversation();
  } else if (scene.cancel()) feedback("Walking cancelled.");
});
render();
log("The vestibule", [
  "The black envelope rests on the dry ledge. Inez is nearby.",
]);
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "room",
  width: 960,
  height: 640,
  backgroundColor: "#17151d",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene,
  audio: { noAudio: true },
  banner: false,
});
window.addEventListener("pagehide", () => game.destroy(true), { once: true });
