import { useDraft } from "./useDraft";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CornerDownLeft } from "lucide-react";
import type { GameState } from "../engine/types";
import { completions, transcriptText } from "../engine/parser";
import { characters } from "../content/world";
import { formatTime } from "../engine/game";
import { rooms } from "../content/spaces";

export function CommandTerminal({
  state,
  onCommand,
}: {
  state: GameState;
  onCommand: (command: string) => boolean;
}) {
  const [input, setInput] = useDraft(`freak-city:command:${state.seed}`);
  const composing = useRef(false);
  const following = useRef(true);
  const lastSubmission = useRef({ text: "", at: 0 });
  const [unread, setUnread] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [completion, setCompletion] = useState<{
    items: string[];
    index: number;
  } | null>(null);
  const draft = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const w = state.world!;
  useEffect(() => {
    const log = logRef.current;
    if (log && following.current) log.scrollTop = log.scrollHeight;
    else if (log) setUnread(true);
  }, [w.transcript.length]);
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const observer = new ResizeObserver(() => {
      if (following.current) log.scrollTop = log.scrollHeight;
    });
    observer.observe(log);
    return () => observer.disconnect();
  }, []);
  function submit(command = input) {
    if (!command.trim() || composing.current) return;
    if (
      lastSubmission.current.text === command &&
      Date.now() - lastSubmission.current.at < 350
    )
      return;
    lastSubmission.current = { text: command, at: Date.now() };
    following.current = true;
    setUnread(false);
    if (!onCommand(command)) return;
    setInput("");
    setHistoryIndex(-1);
    setCompletion(null);
    draft.current = "";
  }
  function recall(delta: number) {
    if (!w.commandHistory.length) return;
    if (historyIndex === -1) draft.current = input;
    const next = Math.max(
      -1,
      Math.min(historyIndex + delta, w.commandHistory.length - 1),
    );
    setHistoryIndex(next);
    setInput(
      next === -1
        ? draft.current
        : w.commandHistory[w.commandHistory.length - 1 - next],
    );
    setCompletion(null);
  }
  function complete(backward = false) {
    const list = completion?.items ?? completions(state, input);
    if (!list.length) return false;
    const index = completion
      ? (completion.index + (backward ? -1 : 1) + list.length) % list.length
      : 0;
    setCompletion({ items: list, index });
    setInput(list[index]);
    return true;
  }
  return (
    <div className="command-terminal">
      <div
        className="terminal-log"
        ref={logRef}
        onScroll={() => {
          const el = logRef.current!;
          following.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 70;
          if (following.current) setUnread(false);
        }}
        role="log"
        aria-label="Story transcript"
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
      >
        {w.transcript.map((entry, i) => (
          <article
            className={`transcript-entry ${entry.failed ? "command-failed" : ""}`}
            key={i}
          >
            {entry.command && (
              <div className="transcript-command">
                <span aria-hidden="true">›</span>
                <span>{entry.command}</span>
                <time>{formatTime(entry.at)}</time>
              </div>
            )}
            {i > 0 && entry.room !== w.transcript[i - 1].room && (
              <div className="transcript-location">
                {rooms[entry.room]?.name}
              </div>
            )}
            {entry.passages.map((p, j) => {
              const text = transcriptText(state, p);
              return text ? (
                <div
                  key={j}
                  className={
                    p.kind === "phone"
                      ? "transcript-phone"
                      : p.kind === "system"
                        ? "transcript-system"
                        : p.speaker
                          ? "dialogue-line"
                          : "narrative-line"
                  }
                >
                  {p.kind === "phone" && (
                    <span className="speaker">Message · {p.from}</span>
                  )}
                  {p.speaker && (
                    <span className="speaker">
                      {characters[p.speaker].name.split(" ")[0]}
                    </span>
                  )}
                  <p>{text}</p>
                </div>
              ) : null;
            })}
          </article>
        ))}
      </div>
      {unread && (
        <button
          type="button"
          className="transcript-latest"
          onClick={() => {
            following.current = true;
            setUnread(false);
            const el = logRef.current!;
            el.scrollTop = el.scrollHeight;
          }}
        >
          Return to latest response ↓
        </button>
      )}
      <form
        className="command-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label
          htmlFor="command-input"
          className="command-prompt"
          aria-label="Command"
        >
          ›
        </label>
        <input
          id="command-input"
          ref={inputRef}
          aria-label="Command"
          aria-describedby="command-instructions"
          value={input}
          maxLength={500}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="send"
          placeholder="What do you do?"
          onChange={(e) => {
            lastSubmission.current = { text: "", at: 0 };
            setInput(e.target.value);
            setCompletion(null);
            setHistoryIndex(-1);
          }}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onKeyDown={(e) => {
            if (
              e.nativeEvent.isComposing ||
              composing.current ||
              (e.repeat && e.key === "Enter")
            ) {
              if (e.key === "Enter") e.preventDefault();
              return;
            }
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              recall(e.key === "ArrowUp" ? 1 : -1);
            }
            if (
              e.key === "Tab" &&
              !e.ctrlKey &&
              !e.metaKey &&
              complete(e.shiftKey)
            )
              e.preventDefault();
            if (e.key === "Escape") setCompletion(null);
          }}
        />
        <button
          type="submit"
          aria-label="Submit command"
          disabled={!input.trim()}
        >
          <ArrowRight size={21} />
        </button>
      </form>
      <div className="command-tools" aria-label="Command editing tools">
        <button
          type="button"
          disabled={
            !w.commandHistory.length ||
            historyIndex >= w.commandHistory.length - 1
          }
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => recall(1)}
        >
          Previous command
        </button>
        <button
          type="button"
          disabled={historyIndex < 0}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => recall(-1)}
        >
          Next command
        </button>
        <button
          type="button"
          disabled={!input.trim()}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => complete()}
        >
          Complete
        </button>
      </div>
      <div className="command-instructions" id="command-instructions">
        <span>
          {completion
            ? `Completion ${completion.index + 1} of ${completion.items.length} · Tab cycles · Esc dismisses`
            : "↑ ↓ history · Tab complete · HELP when you need it"}
        </span>
        <CornerDownLeft size={13} />
      </div>
      {w.quickActions && (
        <div
          className="parser-quick-actions"
          aria-label="Accessibility quick actions"
        >
          {["look", "inventory", "phone", "map", "help"].map((command) => (
            <button key={command} onClick={() => submit(command)}>
              {command}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
