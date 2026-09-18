import { useEffect, useRef, useState } from "react";
import { executeTrial, trialClock } from "./engine";
import { rooms } from "./content";
import { newTrial, type TrialState } from "./state";
import {
  eraseTrial,
  importTrial,
  readTrial,
  TRIAL_BOOKMARK,
  TRIAL_DRAFT,
  TRIAL_SAVE,
  TRIAL_PLAYTEST,
  writeTrial,
} from "./save";
import "./trial.css";
import {
  buildPlaytestExport,
  capturePlaytest,
  emptyArchive,
  loadPlaytest,
  savePlaytest,
  type BoundaryReason,
} from "./playtest";

function draft() {
  try {
    return sessionStorage.getItem(TRIAL_DRAFT) ?? "";
  } catch {
    return "";
  }
}
export default function TrialApp() {
  const [loaded] = useState(() => readTrial(localStorage));
  const [state, setState] = useState<TrialState | null>(loaded.state);
  const [notice, setNotice] = useState(loaded.error ?? loaded.notice ?? "");
  const [alias, setAlias] = useState("Ash"),
    [adult, setAdult] = useState(false);
  const [input, setInput] = useState(draft);
  const [settings, setSettings] = useState(false);
  const [archive, setArchive] = useState(() =>
    loadPlaytest(localStorage, loaded.state),
  );
  const [exportSnapshot, setExportSnapshot] = useState<{
    state: TrialState;
    archive: typeof archive;
  } | null>(null);
  const [exportNote, setExportNote] = useState("");
  const composing = useRef(false),
    log = useRef<HTMLDivElement>(null),
    field = useRef<HTMLInputElement>(null);
  const following = useRef(true);
  useEffect(() => {
    if (state) {
      try {
        writeTrial(localStorage, state);
      } catch {
        setNotice("This trial could not be saved. Export before closing.");
      }
    }
  }, [state]);
  useEffect(() => {
    if (state) setArchive((previous) => capturePlaytest(previous, state));
  }, [state]);
  useEffect(() => {
    try {
      if (archive.segments.length) savePlaytest(localStorage, archive);
      else localStorage.removeItem(TRIAL_PLAYTEST);
    } catch {
      setNotice(
        "Playtest history could not be stored. Export this session before closing.",
      );
    }
  }, [archive]);
  useEffect(() => {
    try {
      if (input) sessionStorage.setItem(TRIAL_DRAFT, input);
      else sessionStorage.removeItem(TRIAL_DRAFT);
    } catch {
      /* in-memory draft remains */
    }
  }, [input]);
  useEffect(() => {
    if (log.current && following.current)
      log.current.scrollTop = log.current.scrollHeight;
  }, [state?.transcript.length]);
  useEffect(() => {
    const element = log.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      if (following.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [!!state]);
  function submit(command: string) {
    if (!state || composing.current || !command.trim()) return;
    setInput("");
    following.current = true;
    try {
      setState(executeTrial(state, command));
      setNotice("");
    } catch (e) {
      setNotice(
        `The action could not be completed. Your previous state is preserved. ${e instanceof Error ? e.message : ""}`,
      );
    }
    field.current?.focus();
  }
  function replaceRun(next: TrialState, boundary: BoundaryReason) {
    setArchive((previous) =>
      capturePlaytest(
        state ? capturePlaytest(previous, state) : previous,
        next,
        boundary,
      ),
    );
    setState(next);
    setInput("");
    following.current = true;
  }
  function download(
    raw: string,
    filename = "freak-city-sable-trial.json",
    type = "application/json",
  ) {
    const href = URL.createObjectURL(new Blob([raw], { type }));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(href);
  }
  return (
    <main className="sable-trial">
      <header>
        <p className="trial-eyebrow">
          FREAK // CITY · LOCAL CHAPTER TRIAL · 18+
        </p>
        <h1>A date that doesn't fit.</h1>
        <p>
          Sable's story ·{" "}
          <a href={import.meta.env.BASE_URL}>Original campaign</a>
        </p>
      </header>
      {notice && (
        <p role="alert" className="trial-notice">
          {notice}
        </p>
      )}
      {!state ? (
        <form
          className="trial-start"
          onSubmit={(e) => {
            e.preventDefault();
            if (adult && alias.trim()) {
              replaceRun(newTrial(alias), "start");
              setNotice("");
              setInput("");
            }
          }}
        >
          <p>
            Three weeks in the city. Sable is your first genuine friend. A
            photograph raises a question neither of you can dismiss.
          </p>
          <label>
            Your alias
            <input
              maxLength={24}
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              required
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={adult}
              onChange={(e) => setAdult(e.target.checked)}
              required
            />{" "}
            I’m 18 or older.
          </label>
          <button type="submit">
            {loaded.error
              ? "Start a new trial, replacing the unreadable trial save"
              : "Begin the Sable trial"}
          </button>
          {loaded.error && (
            <button
              type="button"
              onClick={() => download(localStorage.getItem(TRIAL_SAVE) ?? "")}
            >
              Export unreadable trial save
            </button>
          )}
          <p>
            Adult social themes are implied by default. You can change that in
            Trial settings. Existing campaign saves stay separate.
          </p>
        </form>
      ) : (
        <>
          <div className="trial-status">
            <span>
              {trialClock(state.time)} · {rooms[state.room]}
            </span>
            <button
              onClick={() => {
                setExportSnapshot({
                  state: structuredClone(state),
                  archive: capturePlaytest(archive, state),
                });
                setExportNote("");
              }}
            >
              Export playtest
            </button>
            <button
              onClick={() => setSettings(!settings)}
              aria-expanded={settings}
            >
              Trial settings
            </button>
          </div>
          {state.completed && state.updateAt !== undefined && (
            <p role="status" className="trial-complete">
              Current playable segment complete. You can still talk or ask to
              see Sable's document.{" "}
              {state.completed.course === "formal"
                ? "The specialist visit"
                : "The photographer follow-up"}{" "}
              is not playable in this trial.
            </p>
          )}
          {exportSnapshot && (
            <section className="trial-export" aria-label="Export playtest">
              <h2>Export this playtest</h2>
              <p>
                Snapshot: {trialClock(exportSnapshot.state.time)}. Download each
                file locally. Nothing is uploaded, reset or advanced.
              </p>
              <label htmlFor="playtest-note">
                What I was trying to do / What went wrong (optional)
              </label>
              <textarea
                id="playtest-note"
                value={exportNote}
                maxLength={4000}
                onChange={(e) => setExportNote(e.target.value)}
              />
              <p>
                The Markdown transcript is readable playtest history. The
                separate diagnostic JSON contains{" "}
                <strong>story spoilers and internal state</strong>; it is not a
                restorable save. Export trial save in settings remains available
                for that.
              </p>
              <div className="trial-tools">
                <button
                  onClick={() =>
                    download(
                      buildPlaytestExport(
                        exportSnapshot.state,
                        exportSnapshot.archive,
                        exportNote,
                      ).markdown,
                      "sable-playtest-transcript.md",
                      "text/markdown;charset=utf-8",
                    )
                  }
                >
                  Download transcript (.md)
                </button>
                <button
                  onClick={() =>
                    download(
                      buildPlaytestExport(
                        exportSnapshot.state,
                        exportSnapshot.archive,
                        exportNote,
                        {
                          appVersion: __PLAYTEST_VERSION__,
                          baseCommit: __BUILD_COMMIT__,
                        },
                      ).diagnostic,
                      "sable-playtest-diagnostics-SPOILERS.json",
                    )
                  }
                >
                  Download diagnostics (.json — spoilers)
                </button>
                <button onClick={() => setExportSnapshot(null)}>
                  Close export
                </button>
              </div>
            </section>
          )}
          {settings && (
            <section className="trial-settings" aria-label="Trial settings">
              <label>
                Adult social themes
                <select
                  value={state.roleplay}
                  onChange={(e) =>
                    setState({
                      ...state,
                      roleplay: e.target.value as TrialState["roleplay"],
                      transcript: state.transcript.map((t) => ({
                        ...t,
                        lines: t.lines.map((line) =>
                          /negotiated roleplay|Switching who takes charge|negotiated adult social/.test(
                            line,
                          ) && e.target.value !== "allowed"
                            ? "Sable shares a personal boundary and turns back to the evening's plans."
                            : line,
                        ),
                      })),
                    })
                  }
                >
                  <option value="allowed">Allowed (non-graphic)</option>
                  <option value="implied">Implied only</option>
                  <option value="skip">Skip</option>
                </select>
              </label>
              <button
                onClick={() => {
                  try {
                    writeTrial(localStorage, state, TRIAL_BOOKMARK);
                    setNotice("Trial bookmark saved.");
                  } catch {
                    setNotice("Could not save the trial bookmark.");
                  }
                }}
              >
                Bookmark trial
              </button>
              <button
                onClick={() => {
                  const result = readTrial(localStorage, TRIAL_BOOKMARK);
                  if (result.state) {
                    replaceRun(result.state, "bookmark");
                    setInput("");
                    setNotice("Trial bookmark restored.");
                  } else setNotice(result.error ?? "No trial bookmark yet.");
                }}
              >
                Restore trial bookmark
              </button>
              <button onClick={() => download(JSON.stringify(state, null, 2))}>
                Export trial save
              </button>
              <button
                onClick={() => {
                  replaceRun(newTrial(state.alias, state.seed), "restart");
                  setNotice(
                    "New trial started. Previous playtest history is retained under a restart boundary.",
                  );
                }}
              >
                Restart trial
              </button>
              <button
                onClick={() => {
                  eraseTrial(localStorage, sessionStorage);
                  setState(null);
                  setArchive(emptyArchive());
                  setExportSnapshot(null);
                  setInput("");
                  setNotice("Only this trial's data was deleted.");
                }}
              >
                Delete trial data
              </button>
            </section>
          )}
          <div
            ref={log}
            className="trial-log"
            role="log"
            aria-label="Story transcript"
            aria-live="polite"
            tabIndex={0}
            onScroll={() => {
              const el = log.current!;
              following.current =
                el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            }}
          >
            {state.transcript.map((entry, i) => (
              <article key={i} className={entry.failed ? "trial-failed" : ""}>
                {entry.command && (
                  <p className="trial-command">
                    &gt; {entry.command} <small>{trialClock(entry.at)}</small>
                  </p>
                )}
                {entry.lines.map((line, j) => (
                  <p
                    key={j}
                    className={
                      line.startsWith("Private:") ? "trial-thought" : ""
                    }
                  >
                    {line}
                  </p>
                ))}
              </article>
            ))}
          </div>
          <form
            className="trial-input"
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
          >
            <label htmlFor="trial-command">What do you do?</label>
            <div>
              <input
                id="trial-command"
                ref={field}
                aria-label="Command"
                value={input}
                maxLength={500}
                autoComplete="off"
                onChange={(e) => setInput(e.target.value)}
                onCompositionStart={() => {
                  composing.current = true;
                }}
                onCompositionEnd={() => {
                  composing.current = false;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setInput("");
                }}
              />
              <button type="submit">Enter</button>
            </div>
          </form>
          <nav className="trial-tools" aria-label="Untimed information">
            <button onClick={() => submit("look")}>Look</button>
            <button onClick={() => submit("journal")}>Journal</button>
            <button onClick={() => submit("inventory")}>Belongings</button>
            <button onClick={() => submit("help")}>Help</button>
            {state.room === "home" && (
              <button onClick={() => submit("rest until tomorrow")}>
                Optional: rest to tomorrow, 18:00
              </button>
            )}
          </nav>
          <p className="trial-clock-note">
            Reading and time away from this application never advance the story.
          </p>
        </>
      )}
      <label className="trial-import">
        Import a Sable trial save
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              if (file.size > 2_000_000) throw new Error("File is too large.");
              replaceRun(importTrial(await file.text()), "import");
              setInput("");
              setNotice(
                "Trial imported. Original campaign saves were not touched.",
              );
            } catch {
              setNotice(
                "Invalid or incompatible trial save. Existing data was left intact.",
              );
            }
            e.target.value = "";
          }}
        />
      </label>
    </main>
  );
}
