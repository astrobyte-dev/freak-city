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
  onCommand: (command: string) => void;
}) {
  const [input, setInput] = useState("");
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
    if (log) log.scrollTop = log.scrollHeight;
  }, [w.transcript.length]);
  function submit(command = input) {
    if (!command.trim()) return;
    onCommand(command);
    setInput("");
    setHistoryIndex(-1);
    setCompletion(null);
    draft.current = "";
  }
  return (
    <div className="command-terminal">
      <div
        className="terminal-log"
        ref={logRef}
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
                  className={p.speaker ? "dialogue-line" : "narrative-line"}
                >
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
            setInput(e.target.value);
            setCompletion(null);
            setHistoryIndex(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              if (!w.commandHistory.length) return;
              e.preventDefault();
              if (historyIndex === -1) draft.current = input;
              const next =
                e.key === "ArrowUp"
                  ? Math.min(historyIndex + 1, w.commandHistory.length - 1)
                  : Math.max(-1, historyIndex - 1);
              setHistoryIndex(next);
              setInput(
                next === -1
                  ? draft.current
                  : w.commandHistory[w.commandHistory.length - 1 - next],
              );
              setCompletion(null);
            }
            if (e.key === "Tab" && !e.ctrlKey && !e.metaKey) {
              const list = completion?.items ?? completions(state, input);
              if (!list.length) return; // Empty Tab remains normal keyboard navigation.
              e.preventDefault();
              const index = completion
                ? (completion.index + (e.shiftKey ? -1 : 1) + list.length) %
                  list.length
                : 0;
              setCompletion({ items: list, index });
              setInput(list[index]);
            }
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
