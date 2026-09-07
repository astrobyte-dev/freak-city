import {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Clock3,
  Fingerprint,
  House,
  LockKeyhole,
  Map,
  Settings,
  ShieldCheck,
  Smartphone,
  Users,
  Volume2,
  VolumeX,
  X,
  Menu,
  RotateCcw,
  Upload,
  Save,
  Radio,
  Briefcase,
} from "lucide-react";
import { rooms } from "./content/spaces";
import { ensureWorld, executeCommand } from "./engine/parser";
import { CommandTerminal } from "./components/CommandTerminal";
import { formatTime, newGame, updateBoundary } from "./engine/game";
import type { GameState } from "./engine/types";
import {
  bookmark,
  eraseLocal,
  importSave,
  loadGame,
  restoreBookmark,
  saveGame,
} from "./engine/save";
import { Ambience } from "./engine/audio";
import { Dialog } from "./components/Dialog";
import { Atmosphere } from "./components/Atmosphere";
import {
  BoundariesPanel,
  DownloadButton,
  InventoryPanel,
  JournalPanel,
  MapPanel,
  PeoplePanel,
  PhonePanel,
  PullPanel,
} from "./components/Panels";
const DebugPanel = import.meta.env.DEV
  ? lazy(() =>
      import("./components/DebugPanel").then((m) => ({
        default: m.DebugPanel,
      })),
    )
  : null;
type Panel =
  | "phone"
  | "journal"
  | "inventory"
  | "people"
  | "map"
  | "settings"
  | "boundaries"
  | "pull"
  | "new"
  | "debug"
  | "help"
  | "erase"
  | null;
const titles: Record<Exclude<Panel, null>, string> = {
  phone: "After hours.",
  journal: "The receipts.",
  inventory: "What you carry.",
  people: "Familiar strangers.",
  map: "The Quarter.",
  settings: "On your terms.",
  boundaries: "Your boundaries.",
  pull: "What draws you in.",
  new: "Another version of the night.",
  debug: "Behind the curtain.",
  help: "A few things to know.",
  erase: "Leave no trace.",
};
const initialLoad = () => loadGame();
export default function App() {
  const [loaded] = useState(initialLoad);
  const [state, setState] = useState<GameState>(() =>
    ensureWorld(loaded.state ?? newGame()),
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState<string | null>(loaded.error);
  const [sound, setSound] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [textSize, setTextSize] = useState(1);
  const [saveStatus, setSaveStatus] = useState("LOCAL AUTOSAVE");
  const [alias, setAlias] = useState("");
  const [seed, setSeed] = useState("");
  const [newMode, setNewMode] = useState<GameState["mode"]>("normal");
  const [adult, setAdult] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<string | null>(null);
  const [aliasError, setAliasError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const storyTop = useRef<HTMLDivElement>(null);
  const ambience = useRef(new Ambience());
  const skipSave = useRef(false);
  const preservedBadSave = useRef(!!loaded.error);

  const unread = state.messages.filter((m) => !m.read).length;
  const currentRoom = rooms[state.world!.room];
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (preservedBadSave.current) return;
    const error = saveGame(state);
    setSaveStatus(error ? "SAVE UNAVAILABLE" : "SAVED ON THIS DEVICE");
    if (error) setNotice(error);
  }, [state]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    ambience.current.setLocation(currentRoom.location);
  }, [currentRoom.location]);
  useEffect(
    () => () => {
      void ambience.current.dispose();
    },
    [],
  );
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        panel ||
        pendingChoice
      )
        return;
      if (e.key === "p") openPanel("phone");
      if (e.key === "j") openPanel("journal");
      if (e.key === "Escape") setMobileNav(false);
      if (import.meta.env.DEV && e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setPanel("debug");
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });
  function openPanel(p: Panel) {
    setPanel(p);
    setMobileNav(false);
    if (p === "phone")
      setState((s) => ({
        ...s,
        messages: s.messages.map((m) => ({ ...m, read: true })),
      }));
  }
  function act(command: string, s = state) {
    if (!s.started) {
      setPendingChoice(command);
      return;
    }
    try {
      const result = executeCommand(s, command);
      setState(result.state);
      if (result.panel) openPanel(result.panel);
    } catch (error) {
      setNotice((error as Error).message);
    }
  }
  function begin() {
    const cleaned = alias
      .trim()
      .replace(/[<>\x00-\x1f]/g, "")
      .slice(0, 24);
    if (!cleaned) {
      setAliasError("Choose an alias of 1–24 characters.");
      return;
    }
    if (!adult) {
      setAliasError("Confirm that you are 18 or older to begin.");
      return;
    }
    if (!pendingChoice) return;
    preservedBadSave.current = false;
    const next = { ...state, alias: cleaned, started: true };
    try {
      act(pendingChoice, next);
      setPendingChoice(null);
      setAliasError("");
      setTimeout(() => document.getElementById("command-input")?.focus(), 0);
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function toggleSound() {
    try {
      if (sound) {
        await ambience.current.stop();
        setSound(false);
      } else {
        await ambience.current.start();
        ambience.current.setLocation(currentRoom.location);
        setSound(true);
      }
    } catch {
      setNotice(
        "Audio is unavailable in this browser. The story is fully playable without it.",
      );
    }
  }
  function freshRun() {
    preservedBadSave.current = false;
    const n = newGame(
      seed ||
        `${Math.floor(Math.random() * 900 + 100)}-ASH-${Math.floor(Math.random() * 90 + 10)}`,
      newMode,
    );
    n.boundaries = structuredClone(state.boundaries);
    n.pull.enabled = state.pull.enabled;
    setState(ensureWorld(n));
    setPanel(null);
    setAlias("");
    setAdult(false);
    setNotice(
      "A new night. The city starts with a different version of the truth.",
    );
    window.scrollTo(0, 0);
  }
  function saveBookmark() {
    try {
      bookmark(state);
      setNotice("Bookmark saved on this device.");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function loadBookmark() {
    try {
      setState(ensureWorld(restoreBookmark(state)));
      setPanel(null);
      setNotice("Returned to your bookmark.");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function renderPanel(): ReactNode {
    switch (panel) {
      case "phone":
        return <PhonePanel state={state} onChange={setState} />;
      case "journal":
        return <JournalPanel state={state} onChange={setState} />;
      case "inventory":
        return <InventoryPanel state={state} onChange={setState} />;
      case "people":
        return <PeoplePanel state={state} />;
      case "map":
        return <MapPanel state={state} />;
      case "boundaries":
        return <BoundariesPanel state={state} onChange={setState} />;
      case "pull":
        return <PullPanel state={state} onChange={setState} />;
      case "debug":
        return DebugPanel ? (
          <Suspense fallback={<p>Opening inspector…</p>}>
            <DebugPanel state={state} onChange={setState} />
          </Suspense>
        ) : null;
      case "new":
        return (
          <>
            <p className="panel-intro">
              A new seed changes the invitation’s sender, motive and proof. The
              people you didn’t meet have their own plans.
            </p>
            <label className="field-label">
              WORLD SEED
              <input
                value={seed}
                maxLength={48}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Leave blank for a new seed"
              />
            </label>
            <label className="field-label">
              SAVE MODE
              <select
                value={newMode}
                onChange={(e) =>
                  setNewMode(e.target.value as GameState["mode"])
                }
              >
                <option value="normal">Normal · autosave and bookmark</option>
                <option value="livewire">
                  Live Wire · one autosave, no rewind
                </option>
              </select>
            </label>
            <p className="fine-print">
              Starting replaces this run’s autosave. Export it first if you want
              a copy. Boundaries carry over; learned interests do not.
            </p>
            <div className="button-row">
              <DownloadButton state={state} />
              <button className="primary-button" onClick={freshRun}>
                Start a new night <ArrowRight size={17} />
              </button>
            </div>
          </>
        );
      case "erase":
        return (
          <>
            <p className="panel-intro">
              Remove this game’s autosave, bookmark, choices and learned
              interests from this browser. Exported files remain wherever you
              saved them.
            </p>
            <button
              className="primary-button"
              onClick={() => {
                try {
                  eraseLocal();
                  skipSave.current = true;
                  preservedBadSave.current = false;
                  setState(ensureWorld(newGame()));
                  setAlias("");
                  setAdult(false);
                  setPanel(null);
                  setSaveStatus("LOCAL DATA CLEARED");
                  setNotice(
                    "All FREAK//CITY data has been removed from this browser.",
                  );
                } catch {
                  setNotice(
                    "The browser blocked access to local storage. Clear site data in your browser settings.",
                  );
                }
              }}
            >
              Delete local game data
            </button>
          </>
        );
      case "help":
        return (
          <>
            <div className="help-list">
              <p>
                <Clock3 />
                Time moves when you act, never while you read. Travelling,
                investigating, talking and waiting spend minutes.
              </p>
              <p>
                <BookOpen />
                Your journal separates verified knowledge from unverified
                rumours.
              </p>
              <p>
                <Smartphone />
                Type actions at the prompt. Up and Down recall commands; Tab
                completes words. HELP and HINT are available when you need them.
              </p>
              <p>
                <ShieldCheck />
                Set boundaries at any point. Skipping themes never blocks the
                mystery.
              </p>
              <p>
                <Fingerprint />
                HEAT is interpersonal intensity. Composure changes how you can
                respond, never whether you can leave.
              </p>
              <p>
                <Save />
                This game saves locally. Normal mode supports a bookmark. Live
                Wire commits each action to one autosave.
              </p>
            </div>
            <p className="fine-print">
              First-night prototype · all major characters are 29–56 · no live
              AI or external communication.
            </p>
          </>
        );
      case "settings":
        return (
          <>
            <div className="settings-actions">
              <button onClick={() => setPanel("boundaries")}>
                <ShieldCheck />
                <span>
                  Your boundaries<small>Allowed, implied only, skip</small>
                </span>
                <ChevronRight />
              </button>
              <button onClick={() => setPanel("pull")}>
                <Fingerprint />
                <span>
                  THE PULL
                  <small>Private thematic engagement & reflection</small>
                </span>
                <ChevronRight />
              </button>
            </div>
            <label className="toggle-row">
              <span>
                <strong>Atmospheric audio</strong>
                <small>Rain and distant bass. Starts only by choice.</small>
              </span>
              <input
                type="checkbox"
                checked={sound}
                onChange={() => void toggleSound()}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong>Accessibility quick actions</strong>
                <small>
                  Optional shortcuts for looking and opening your records
                </small>
              </span>
              <input
                type="checkbox"
                checked={state.world!.quickActions}
                onChange={(e) =>
                  setState({
                    ...state,
                    world: { ...state.world!, quickActions: e.target.checked },
                  })
                }
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong>Reading size</strong>
                <small>Adjust story text</small>
              </span>
              <select
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
              >
                <option value={0.92}>Small</option>
                <option value={1}>Default</option>
                <option value={1.15}>Large</option>
                <option value={1.3}>Extra large</option>
              </select>
            </label>
            <h4>
              YOUR RUN /{" "}
              {state.mode === "livewire" ? "LIVE WIRE" : "NORMAL MODE"}
            </h4>
            <div className="button-row">
              <button
                className="secondary-button"
                disabled={state.mode === "livewire"}
                onClick={saveBookmark}
              >
                <Bookmark size={15} /> Bookmark
              </button>
              <button
                className="secondary-button"
                disabled={state.mode === "livewire"}
                onClick={loadBookmark}
              >
                <RotateCcw size={15} /> Restore
              </button>
              <DownloadButton state={state} />
              <label
                className={`secondary-button upload-label ${state.mode === "livewire" ? "disabled" : ""}`}
              >
                <Upload size={15} /> Import
                <input
                  type="file"
                  accept="application/json,.json"
                  disabled={state.mode === "livewire"}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 2_000_000)
                        throw new Error("Save file is too large.");
                      const n = importSave(await file.text(), state);
                      preservedBadSave.current = false;
                      setState(ensureWorld(n));
                      setPanel(null);
                      setNotice("Run imported and validated.");
                    } catch (err) {
                      setNotice((err as Error).message);
                    }
                  }}
                />
              </label>
            </div>
            <p className="fine-print">
              Exports include choices and private thematic preferences. Live
              Wire exports are archival; restoring them is disabled.
            </p>
            <div className="settings-actions">
              <button onClick={() => setPanel("new")}>
                <Radio />
                <span>
                  Start another night
                  <small>Choose a world seed and save mode</small>
                </span>
                <ChevronRight />
              </button>
              <button onClick={() => setPanel("erase")}>
                <EyeOffIcon />
                <span>
                  Delete local data
                  <small>Remove this game’s saves and learned interests</small>
                </span>
                <ChevronRight />
              </button>
            </div>
            <p className="privacy-note">
              <LockKeyhole size={14} /> No account. No analytics. No data leaves
              this device.
            </p>
          </>
        );
      default:
        return null;
    }
  }
  return (
    <div
      className="app"
      style={{ "--reading-scale": textSize } as React.CSSProperties}
    >
      <a className="skip-link" href="#story">
        Skip to story
      </a>
      <header className="topbar">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            openPanel("help");
          }}
        >
          FREAK<span>//</span>CITY
        </a>
        <div className="episode-label">
          <span className="red-dot" /> FIRST NIGHT{" "}
          <span className="separator">/</span> THE CARBON COPY
        </div>
        <nav className="topnav" aria-label="Game tools">
          <button onClick={() => openPanel("journal")}>
            <BookOpen size={16} /> Journal
          </button>
          <button onClick={() => openPanel("inventory")}>
            <Briefcase size={16} /> Belongings
          </button>
          <button onClick={() => openPanel("map")}>
            <Map size={16} /> The city
          </button>
        </nav>
        <button
          className="icon-button settings-top"
          aria-label="Settings"
          onClick={() => openPanel("settings")}
        >
          <Settings size={18} />
        </button>
        <button
          className="icon-button mobile-menu"
          aria-label="Toggle navigation"
          aria-expanded={mobileNav}
          onClick={() => setMobileNav(!mobileNav)}
        >
          {mobileNav ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      <div className="game-layout">
        <nav className={`rail ${mobileNav ? "open" : ""}`} aria-label="Sidebar">
          <div className="rail-top">
            <button
              className="rail-button active"
              aria-label="Current story"
              onClick={() => {
                setPanel(null);
                setMobileNav(false);
              }}
            >
              <House size={20} />
              <span>STORY</span>
            </button>
            <button
              className="rail-button"
              aria-label={`Phone, ${unread} unread messages`}
              onClick={() => openPanel("phone")}
            >
              <span className="rail-icon">
                <Smartphone size={21} />
                {unread > 0 && <i className="notification-dot" />}
              </span>
              <span>PHONE</span>
            </button>
            <button
              className="rail-button"
              aria-label="People"
              onClick={() => openPanel("people")}
            >
              <Users size={21} />
              <span>PEOPLE</span>
            </button>
            <button
              className="rail-button"
              aria-label="Boundaries"
              onClick={() => openPanel("boundaries")}
            >
              <ShieldCheck size={21} />
              <span>LIMITS</span>
            </button>
          </div>
          <div className="rail-bottom">
            <button
              className="icon-button"
              aria-label={sound ? "Mute ambience" : "Enable ambience"}
              onClick={() => void toggleSound()}
            >
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              className="icon-button"
              aria-label="How to play"
              onClick={() => openPanel("help")}
            >
              <CircleHelp size={18} />
            </button>
          </div>
        </nav>
        <main className="main">
          <div className="chapter-bar">
            <span>
              CHAPTER <b>01</b>
              <i /> THE CARBON COPY
            </span>
            <div>
              <span className="night-label">
                {state.time < 1440 ? "FRIDAY" : "SATURDAY"}
              </span>
              <Clock3 size={13} />
              <time>{formatTime(state.time)}</time>
              <span className="weather">LIGHT RAIN · 12°</span>
            </div>
          </div>
          <div className="scene-layout parser-layout">
            <Atmosphere
              state={state}
              location={currentRoom.location}
              onMap={() => openPanel("map")}
            />
            <section
              className="story"
              id="story"
              ref={storyTop}
              aria-labelledby="scene-title"
            >
              <div className="story-topline">
                <span className="eyebrow">
                  {state.flags.parserNightEnded
                    ? "FIRST NIGHT COMPLETE / THE CITY REMAINS"
                    : "A PLACE IN THE NIGHT"}
                </span>
                <button
                  className="icon-button"
                  aria-label="Bookmark current moment"
                  disabled={state.mode === "livewire"}
                  onClick={saveBookmark}
                >
                  <Bookmark size={16} />
                </button>
              </div>
              <h1 id="scene-title" ref={heading} tabIndex={-1}>
                {currentRoom.name}
              </h1>
              <CommandTerminal state={state} onCommand={act} />
              <div className="story-bottom">
                <span className="tiny-cross">+</span>
                <span>THE CITY KEEPS ITS OWN APPOINTMENTS.</span>
                <span className="tiny-cross">+</span>
              </div>
            </section>
          </div>
        </main>
      </div>
      <footer className="statusbar">
        <div className="identity">
          <Fingerprint size={16} />
          <span>
            {state.started ? state.alias.toUpperCase() : "IDENTITY UNKNOWN"}
          </span>
        </div>
        <div className="status-meters">
          <button onClick={() => openPanel("help")}>
            <span>COMPOSURE</span>
            <i className="meter">
              <i style={{ width: `${state.player.composure}%` }} />
            </i>
            <b>
              {state.player.composure >= 65
                ? "Steady"
                : state.player.composure >= 40
                  ? "Holding"
                  : "Unsettled"}
            </b>
          </button>
          <button onClick={() => openPanel("help")}>
            <span>HEAT</span>
            <i className="meter heat">
              <i style={{ width: `${state.player.heat}%` }} />
            </i>
            <b>
              {state.player.heat < 30
                ? "Low hum"
                : state.player.heat < 60
                  ? "Charged"
                  : "Intense"}
            </b>
          </button>
        </div>
        <div className="save-status">
          <span className="save-dot" />
          {saveStatus}
          <span className="seed-label">{state.seed}</span>
        </div>
      </footer>
      {!panel && unread > 0 && state.started && (
        <button className="phone-peek" onClick={() => openPanel("phone")}>
          <Smartphone size={18} />
          <span>
            {unread} unread {unread === 1 ? "message" : "messages"}
            <small>{state.messages.filter((m) => !m.read).at(-1)?.from}</small>
          </span>
          <ArrowUpRight size={17} />
        </button>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {panel && (
        <Dialog
          title={titles[panel]}
          onClose={() => setPanel(null)}
          wide={["boundaries", "debug", "journal"].includes(panel)}
        >
          {renderPanel()}
        </Dialog>
      )}
      {pendingChoice && (
        <Dialog
          title="What should they call you?"
          onClose={() => setPendingChoice(null)}
        >
          <p className="panel-intro">
            A borrowed name. The first thing in this city that belongs entirely
            to you.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              begin();
            }}
          >
            <label className="field-label">
              YOUR ALIAS
              <input
                autoFocus
                autoComplete="off"
                maxLength={24}
                value={alias}
                onChange={(e) => {
                  setAlias(e.target.value);
                  setAliasError("");
                }}
                placeholder="Choose a name"
              />
            </label>
            <label className="adult-check">
              <input
                type="checkbox"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
              />
              <span>
                I’m 18 or older. This story contains mature themes, moral
                pressure and non-graphic intimacy.
              </span>
            </label>
            <label className="field-label">
              THIS NIGHT’S SAVE MODE
              <select
                value={state.mode}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    mode: e.target.value as GameState["mode"],
                  }))
                }
              >
                <option value="normal">Normal · autosave + bookmark</option>
                <option value="livewire">
                  Live Wire · one autosave, no rewind
                </option>
              </select>
            </label>
            <label className="adult-check">
              <input
                type="checkbox"
                checked={state.boundaries.romance === "skip"}
                onChange={(e) =>
                  setState((s) =>
                    updateBoundary(
                      s,
                      "romance",
                      e.target.checked ? "skip" : "allowed",
                    ),
                  )
                }
              />
              <span>
                Keep this run focused on mystery. Skip optional romance.
              </span>
            </label>
            {aliasError && (
              <p role="alert" className="form-error">
                {aliasError}
              </p>
            )}
            <button className="primary-button full-width" type="submit">
              Enter as {alias.trim() || "someone else"} <ArrowRight size={17} />
            </button>
          </form>
          <p className="fine-print">
            All boundaries can be changed at any time using the shield in the
            sidebar.
          </p>
        </Dialog>
      )}
    </div>
  );
}
function EyeOffIcon() {
  return <LockKeyhole />;
}
