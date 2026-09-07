import { useState } from "react";
import { executeCommand } from "../engine/parser";
import { rooms } from "../content/spaces";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Lock,
  MessageSquare,
  Phone,
  Radio,
  Shirt,
  FileText,
  KeyRound,
  EyeOff,
  Download,
  Trash2,
} from "lucide-react";
import type { GameState, Boundary } from "../engine/types";
import { themes } from "../engine/types";
import { characters, items, factLabels } from "../content/world";
import { themeLabels, taxonomy } from "../content/taxonomy";
import {
  correctRumour,
  formatTime,
  replyMessage,
  messageReplies,
  updateBoundary,
} from "../engine/game";
import { forgetPull } from "../engine/pull";
import { learnTheme } from "../engine/themes";
import { scenes } from "../content/scenes";
export function PhonePanel({
  state,
  onChange,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [recipient, setRecipient] = useState("mara");
  const [message, setMessage] = useState("");
  const senders = [...new Set(state.messages.map((m) => m.from.toUpperCase()))];
  return (
    <>
      <div className="phone-status">
        <span>{formatTime(state.time)}</span>
        <span>LOCAL NETWORK · ▰</span>
      </div>
      <div className="phone-tabs">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All messages
        </button>
        <select
          aria-label="Filter messages by sender"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Everyone</option>
          {senders.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="message-list">
        {state.messages
          .filter((m) => filter === "all" || filter === m.from.toUpperCase())
          .map((m) => (
            <article
              className={`message ${m.from === state.alias ? "sent" : ""}`}
              key={m.id}
            >
              <div className="message-meta">
                <span>{m.from}</span>
                <time>{formatTime(m.at)}</time>
              </div>
              <p>
                {m.theme && state.boundaries[m.theme] !== "allowed"
                  ? (m.fallback ??
                    "Personal message omitted by your boundaries.")
                  : m.text}
              </p>
              {m.attachment === "velvetExterior" &&
                (!m.theme || state.boundaries[m.theme] === "allowed") && (
                  <img
                    className="message-image"
                    src="/velvet-exterior.png"
                    alt="Velvet's lit entrance on the wet street"
                  />
                )}
              {m.format === "voice" && (
                <small>Voice note · transcript shown above</small>
              )}
              {(!state.world ? messageReplies(state, m.id) : []).map(
                (option) => (
                  <button
                    key={option.id}
                    className="text-button"
                    onClick={() =>
                      onChange(replyMessage(state, m.id, option.id))
                    }
                  >
                    {option.text} <ChevronRight size={14} />
                    {m.replyKey && <small>2 min</small>}
                  </button>
                ),
              )}
              {m.replied && (
                <small>
                  <Check size={12} /> Sent · a reply may arrive after time
                  passes
                </small>
              )}
            </article>
          ))}
      </div>
      {state.world && (
        <form
          className="phone-composer"
          onSubmit={(e) => {
            e.preventDefault();
            if (!message.trim()) return;
            onChange(
              executeCommand(
                state,
                `text ${recipient} "${message.replaceAll('"', "")}"`,
              ).state,
            );
            setMessage("");
          }}
        >
          <label className="field-label">
            TO
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            >
              {Object.entries(characters).map(([id, n]) => (
                <option key={id} value={id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            MESSAGE
            <input
              value={message}
              maxLength={450}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message"
            />
          </label>
          <button className="secondary-button" disabled={!message.trim()}>
            Send message
          </button>
        </form>
      )}
      <p className="fine-print">
        <EyeOff size={13} /> In-world messages. Nothing is sent to real people.
      </p>
    </>
  );
}
export function JournalPanel({
  state,
  onChange,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
}) {
  return (
    <>
      <div className="journal-lead">
        <span className="eyebrow">THE QUESTION THAT BROUGHT YOU HERE</span>
        <h3>Who invited you?</h3>
        <p>
          {state.canon.player.includes("sender")
            ? `Your evidence identifies ${state.canon.truth.sender}. Knowing why is not the same as agreeing.`
            : "An unsigned message. An old signature. Somebody has made you part of their night."}
        </p>
      </div>
      <h4>
        WHAT YOU KNOW{" "}
        <span>{String(state.canon.player.length).padStart(2, "0")}</span>
      </h4>
      {state.canon.player.length === 0 ? (
        <p className="muted">
          Nothing verified yet. The invitation is in your belongings.
        </p>
      ) : (
        state.canon.player.map((f) => (
          <div className="fact" key={f}>
            <FileText size={17} />
            <div>
              <p>{factLabels[f] ?? f}</p>
              <small>{state.canon.provenance[f]}</small>
            </div>
          </div>
        ))
      )}
      <h4>WHAT PEOPLE ARE SAYING</h4>
      {state.rumours.length === 0 ? (
        <p className="muted">Your alias hasn’t travelled far. Yet.</p>
      ) : (
        state.rumours.map((r) => (
          <div className="rumour" key={r.id}>
            <span className="eyebrow">
              {r.faction} · {r.corrected ? "DISPUTED" : "UNVERIFIED"}
            </span>
            <p>{r.text}</p>
            {!r.corrected && (
              <button
                className="text-button"
                onClick={() => onChange(correctRumour(state, r.id))}
              >
                Dispute this account <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        ))
      )}
      <h4>THE NIGHT SO FAR</h4>
      <ol className="history">
        {state.world
          ? state.world.transcript
              .filter((t) => t.command)
              .map((t, i) => (
                <li key={i}>
                  <time>{formatTime(t.at)}</time>
                  <div>
                    {t.command}
                    <small>{rooms[t.room].name}</small>
                  </div>
                </li>
              ))
          : state.history.map((h, i) => (
              <li key={i}>
                <time>{formatTime(h.at)}</time>
                <div>
                  {(() => {
                    const c = scenes[h.scene].choices.find(
                      (c) => c.id === h.choice,
                    );
                    return c?.theme && state.boundaries[c.theme] === "skip"
                      ? "A personal choice, omitted by your boundaries."
                      : c?.label;
                  })()}
                  <small>{scenes[h.to].title.replaceAll("\n", " ")}</small>
                </div>
              </li>
            ))}
      </ol>
    </>
  );
}
export function InventoryPanel({
  state,
  onChange,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
}) {
  return (
    <>
      <p className="panel-intro">
        Some things open doors. Others explain why they closed.
      </p>
      <div className="inventory-grid">
        {state.inventory.map((id) => (
          <article className="item-card" key={id}>
            <span className="item-mark">{items[id]?.mark ?? "?"}</span>
            {id === "key27" ? (
              <KeyRound size={30} strokeWidth={1} />
            ) : (
              <FileText size={30} strokeWidth={1} />
            )}
            <h3>{state.world?.entities[id]?.name ?? items[id]?.name ?? id}</h3>
            <p>
              {state.world?.entities[id]?.description ?? items[id]?.description}
            </p>
          </article>
        ))}
      </div>
      <h4>
        <Shirt size={15} /> WARDROBE / SOCIAL ARMOUR
      </h4>
      <p className="muted">
        Change your presentation. Earlier impressions remain in people’s
        memories.
      </p>
      <div className="wardrobe">
        {(["coat", "formal", "workwear"] as const)
          .filter((w) => !state.world || state.inventory.includes(w))
          .map((w) => (
            <button
              key={w}
              className={state.wardrobe === w ? "selected" : ""}
              onClick={() => {
                if (state.world) {
                  onChange(
                    executeCommand(
                      state,
                      `wear ${w === "formal" ? "black jacket" : w === "coat" ? "coat" : "workwear"}`,
                    ).state,
                  );
                  return;
                }
                const n = structuredClone(state);
                n.wardrobe = w;
                n.flags.outfit = w;
                n.flags.formalAccess = w === "formal";
                onChange(n);
              }}
            >
              <span>
                {w === "coat"
                  ? "Raincoat"
                  : w === "formal"
                    ? "Black jacket"
                    : "Rolled sleeves"}
              </span>
              <small>
                {w === "coat"
                  ? "An outsider in no hurry."
                  : w === "formal"
                    ? "The assumption of belonging."
                    : "Someone who can help."}
              </small>
              {state.wardrobe === w && <Check size={16} />}
            </button>
          ))}
      </div>
    </>
  );
}
export function PeoplePanel({ state }: { state: GameState }) {
  return (
    <>
      <p className="panel-intro">They have lives outside this conversation.</p>
      {Object.entries(characters).map(([id, n]) => {
        const npc = state.npcs[id as keyof typeof characters];
        const met =
          !!state.flags[`met_${id}`] ||
          state.history.some(
            (h) =>
              scenes[h.scene].passages.some((p) => p.speaker === id) ||
              scenes[h.to].passages.some((p) => p.speaker === id),
          );
        return (
          <article className="person" key={id}>
            <div className={`portrait portrait-${id}`}>
              <span>{n.initials}</span>
            </div>
            <div>
              <span className="eyebrow">{n.role}</span>
              <h3>
                {n.name} <small>{n.age}</small>
              </h3>
              <p>{n.description}</p>
              <span className="relationship">
                {!met
                  ? "Not yet introduced"
                  : npc.relationship.trust > 4
                    ? "An earned measure of trust"
                    : npc.relationship.suspicion > 3
                      ? "Questions left unanswered"
                      : npc.relationship.trust < 0
                        ? "Something has changed"
                        : "Still getting a read on you"}
              </span>
              {met && Object.keys(npc.memories).length > 0 && (
                <small className="muted">You have a history now.</small>
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}
export function MapPanel({ state }: { state: GameState }) {
  return (
    <>
      <p className="panel-intro">
        Type GO followed by an exit to travel. Reading the map doesn’t move the
        clock.
      </p>
      {state.world && (
        <p className="panel-intro">
          Here: {rooms[state.world.room].name}. Exits:{" "}
          {rooms[state.world.room].exits.map((e) => e.name).join(" · ")}.
        </p>
      )}
      <div className="district-map">
        <div className="map-road road-one" />
        <div className="map-road road-two" />
        <div className="map-road road-three" />
        <span className="map-river">THE OLD CUT</span>
        <div className="map-place place-home">
          <span>01</span>YOUR APARTMENT
        </div>
        <div className="map-place place-club">
          <span>02</span>VELVET
          <i className="red-dot" />
        </div>
        <div className="map-place place-bay">
          <span>03</span>LOADING BAY
        </div>
        <div className="map-place place-motel">
          <span>27</span>
          {state.inventory.includes("key27") ? "MOTEL 27" : "UNLISTED"}
        </div>
        <span className="map-north">N ↑</span>
      </div>
      <h4>THE CITY’S CLOCK</h4>
      {state.events
        .filter((e) => ["exchange", "witness-departs"].includes(e.id))
        .map((e) => (
          <div className="event-row" key={e.id}>
            <time>{formatTime(e.at)}</time>
            <div>
              <strong>
                {e.id === "exchange"
                  ? "The ledger exchange"
                  : "The last departure"}
              </strong>
              <small>
                {e.id === "exchange"
                  ? "Velvet / Upstairs"
                  : "Service road / Loading bay"}
              </small>
            </div>
            <span className={`event-status ${e.status}`}>
              {e.status === "fired"
                ? "HAPPENED"
                : e.status === "cancelled"
                  ? "CANCELLED"
                  : "UPCOMING"}
            </span>
          </div>
        ))}
      <p className="fine-print">
        Travel and conversation take time. These events continue whether you are
        present or elsewhere.
      </p>
      <div className="future-districts">
        THE STATIC <Lock size={12} /> &nbsp; SAINT <Lock size={12} /> &nbsp; THE
        GLASSHOUSE <Lock size={12} />
      </div>
    </>
  );
}
export function BoundariesPanel({
  state,
  onChange,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
}) {
  return (
    <>
      <p className="panel-intro">
        Your limits are part of the design. Skipped themes use equivalent story
        paths and never cost progress. These controls apply immediately.
      </p>
      <div className="boundary-legend">
        <span>ALLOWED</span>
        <span>IMPLIED ONLY</span>
        <span>SKIP</span>
      </div>
      {themes.map((theme) => (
        <div className="boundary-row" key={theme}>
          <div>
            <strong>{themeLabels[theme].name}</strong>
            <p>{themeLabels[theme].description}</p>
          </div>
          <div className="segmented" aria-label={themeLabels[theme].name}>
            {(["allowed", "implied", "skip"] as Boundary[]).map((b) => (
              <button
                key={b}
                aria-pressed={state.boundaries[theme] === b}
                className={state.boundaries[theme] === b ? "selected" : ""}
                onClick={() => onChange(updateBoundary(state, theme, b))}
              >
                {b === "allowed" ? "Allow" : b === "implied" ? "Imply" : "Skip"}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        className="secondary-button full-width"
        onClick={() => {
          let n = state;
          for (const t of themes) n = updateBoundary(n, t, "skip");
          onChange(n);
        }}
      >
        Skip all optional mature themes
      </button>
      <p className="fine-print">
        All characters are adults. This chapter contains non-graphic material
        only. Some categories are classification foundations for future authored
        scenes.
      </p>
    </>
  );
}
export function PullPanel({
  state,
  onChange,
}: {
  state: GameState;
  onChange: (s: GameState) => void;
}) {
  return (
    <>
      <p className="panel-intro">
        THE PULL notices what your character chooses to explore, avoid, or leave
        unresolved. It brings attraction, chemistry and mature themes into
        authored details and callbacks, with room for surprise. Your boundaries
        and each character’s choices shape what can happen.
      </p>
      <label className="toggle-row">
        <span>
          <strong>Private narrative adaptation</strong>
          <small>Local to this run. Never shared.</small>
        </span>
        <input
          type="checkbox"
          checked={state.pull.enabled}
          onChange={(e) => {
            const n = structuredClone(state);
            n.pull.enabled = e.target.checked;
            if (!e.target.checked) n.pacing.observation = null;
            onChange(n);
          }}
        />
      </label>
      <h4>REFLECT ON A THEME</h4>
      <p className="muted">
        These are interpretations, not commitments. Boundaries always take
        priority.
      </p>
      {taxonomy
        .filter((t) => state.boundaries[t.theme] !== "skip")
        .map((t) => (
          <div className="theme-reflection" key={t.id}>
            <strong>{t.name}</strong>
            <small>
              {t.context} ·{" "}
              {t.privacy === "private" ? "private context" : "any context"}
            </small>
            <div>
              {(["explore", "uncertain", "avoid"] as const).map((response) => (
                <button
                  disabled={!state.pull.enabled}
                  key={response}
                  onClick={() => {
                    const n = structuredClone(state);
                    learnTheme(n, t.id, response, "player reflection");
                    onChange(n);
                  }}
                >
                  {response === "explore"
                    ? "Explore"
                    : response === "avoid"
                      ? "Avoid"
                      : "Not sure"}
                </button>
              ))}
            </div>
            <small className="reflection-count">
              {state.engagement[t.id].familiarity === 0
                ? "No interpretation yet"
                : `${state.engagement[t.id].familiarity} reflections · ${state.engagement[t.id].uncertainty > 0 ? "room for uncertainty" : "a developing pattern"}`}
            </small>
          </div>
        ))}
      <button
        className="secondary-button full-width"
        onClick={() => onChange(forgetPull(state))}
      >
        <Trash2 size={15} /> Clear learned interests
      </button>
      <p className="fine-print">
        Clears learned interests and aesthetic attractors. Explicit theme
        boundaries stay in place.
      </p>
    </>
  );
}
export function DownloadButton({ state }: { state: GameState }) {
  return (
    <button
      className="secondary-button"
      onClick={() => {
        const blob = new Blob([JSON.stringify(state, null, 2)], {
            type: "application/json",
          }),
          url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `freak-city-${state.seed}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      <Download size={16} /> Export run
    </button>
  );
}
export const panelIcons = {
  phone: Phone,
  journal: FileText,
  people: MessageSquare,
  map: Radio,
};
