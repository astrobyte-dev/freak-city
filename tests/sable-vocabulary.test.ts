import { describe, expect, it } from "vitest";
import { executeTrial } from "../src/trial/engine";
import { cocktailMenu, rooms } from "../src/trial/content";
import { newTrial, validateTrial, type TrialState } from "../src/trial/state";
import { currentDrink } from "../src/trial/vessels";

// The mechanical vocabulary layer: abbreviations, standard verbs, scenery
// and shortcut travel that a parser game supplies for free. Every assertion
// is player-visible behaviour; none depends on which module answers.
const reload = (s: TrialState) => validateTrial(JSON.parse(JSON.stringify(s)));
const run = (s: TrialState, ...commands: string[]) =>
  commands.reduce((s, command) => reload(executeTrial(s, command)), s);
const last = (s: TrialState) => s.transcript.at(-1)!;
const lines = (s: TrialState) => last(s).lines;
const text = (s: TrialState) => lines(s).join(" ");
const outcome = (s: TrialState) => last(s).diagnostics![0].outcome;
const generic =
  /couldn't place that action|couldn't identify a supported object/;

type Room = keyof typeof rooms;
const everyRoom = Object.keys(rooms) as Room[];
const arrive: Record<Room, () => TrialState> = {
  bar: () => newTrial(),
  shop: () => run(newTrial(), "go to the secondhand shop"),
  booth: () => run(newTrial(), "go to the quiet booth"),
  home: () => run(newTrial(), "go home"),
};
// The rooms each LOOK text names as nearby, by the names travel replies use.
const nearby: Record<Room, string[]> = {
  bar: [rooms.shop, rooms.booth, rooms.home],
  shop: [rooms.bar, rooms.home],
  booth: [rooms.bar],
  home: [rooms.bar, rooms.shop],
};
// A free action leaves everything but the turn counter and transcript alone.
const snapshot = (s: TrialState) => ({ ...s, turn: 0, transcript: [] });
function unchanged(before: TrialState, after: TrialState) {
  expect(snapshot(after)).toEqual(snapshot(before));
}
// An in-fiction reply is a completed action: it must not fail, or a
// multi-command submission would stop at it.
function oneFreeLine(before: TrialState, command: string) {
  const after = run(before, command);
  expect(lines(after), command).toHaveLength(1);
  expect(text(after), command).not.toMatch(generic);
  expect(last(after).failed, `${command}: ${text(after)}`).toBe(false);
  unchanged(before, after);
  return after;
}

describe("A. Abbreviations and standard verbs, in every room", () => {
  const touch: Record<Room, string> = {
    bar: "touch the counter",
    shop: "touch the shelves",
    booth: "touch the table",
    home: "touch the kettle",
  };
  describe.each(everyRoom)("%s", (room) => {
    it("X examines like EXAMINE", () => {
      const before = arrive[room]();
      const short = run(before, "x satchel");
      expect(lines(short)).toEqual(lines(run(before, "examine satchel")));
      expect(text(short)).toMatch(/ordinary satchel/);
    });
    it("L looks like LOOK", () => {
      const before = arrive[room]();
      expect(lines(run(before, "l"))).toEqual(lines(run(before, "look")));
    });
    it("I lists belongings like INVENTORY", () => {
      const before = arrive[room]();
      const short = run(before, "i");
      expect(lines(short)).toEqual(lines(run(before, "inventory")));
      expect(text(short)).toMatch(/satchel/);
    });
    it("Z waits the default duration like WAIT", () => {
      const before = arrive[room]();
      const short = run(before, "z"),
        wait = run(before, "wait");
      expect(lines(short)).toEqual(lines(wait));
      expect(short.time).toBe(wait.time);
      expect(short.time).toBeGreaterThan(before.time);
    });
    it.each(["n", "s", "e", "w", "north"])(
      "%s names the rooms the game uses instead of rejecting generically",
      (direction) => {
        const before = arrive[room]();
        const after = run(before, direction);
        expect(text(after)).not.toMatch(generic);
        for (const name of nearby[room])
          expect(text(after)).toMatch(new RegExp(name, "i"));
        expect(after.room).toBe(room);
        expect(after.time).toBe(before.time);
      },
    );
    it.each(["sit", "sit down", "stand up", "listen", "smell", touch[room]])(
      "%s gets one in-fiction line and changes nothing",
      (command) => {
        oneFreeLine(arrive[room](), command);
      },
    );
  });
  it.each(["sit at the counter", "listen to the music"])(
    "%s at the bar gets one in-fiction line and changes nothing",
    (command) => {
      oneFreeLine(newTrial(), command);
    },
  );
  // Leaving the bar without naming a destination names both outside
  // destinations and stays put; bare SHOP or HOME then travels (section C).
  it.each(["exit", "out", "leave", "go outside"])(
    "%s from the bar names both outside destinations and stays put",
    (command) => {
      const after = oneFreeLine(newTrial(), command);
      expect(text(after)).toMatch(/shop/);
      expect(text(after)).toMatch(/home/);
    },
  );
});

// Nouns the visible prose names: the room descriptions in describeTrial, the
// opening lines, and the supplier follow-up that puts the box of lids under
// the counter. The counter and menu are real objects and are checked apart.
const scenery: Record<Room, string[]> = {
  bar: [
    "pencil",
    "glasses",
    "shelves",
    "speakers",
    "curtain",
    "lids",
    "box",
    "jars",
    "light",
    "bass line",
    "complaint",
  ],
  shop: ["clearance lot", "lot", "photographer's stock", "shelves"],
  booth: ["table", "lamp", "wall"],
  home: ["kettle"],
};
const examineForms = (noun: string) => [
  `x ${noun}`,
  `examine ${noun}`,
  `look at the ${noun}`,
];
describe("B. Scenery: every noun the visible prose names is examinable", () => {
  describe.each(everyRoom)("%s", (room) => {
    it.each(scenery[room])(
      "%s: one line, the same under X, EXAMINE and LOOK AT, nothing recorded",
      (noun) => {
        const before = arrive[room]();
        const forms = examineForms(noun).map((c) => oneFreeLine(before, c));
        expect(new Set(forms.map(text)).size).toBe(1);
      },
    );
  });
  it.each(["counter", "menu"])(
    "%s at the bar is the real object under X, EXAMINE and LOOK AT",
    (noun) => {
      const before = newTrial();
      const forms = examineForms(noun).map((c) => run(before, c));
      for (const after of forms) {
        expect(lines(after)).toHaveLength(1);
        expect(text(after)).not.toMatch(generic);
        expect(after.room).toBe("bar");
        expect(after.time).toBe(before.time);
      }
      expect(new Set(forms.map(text)).size).toBe(1);
    },
  );
  it("scenery belongs to its room", () => {
    const kettle = text(run(arrive.home(), "x kettle"));
    const after = run(newTrial(), "x kettle");
    expect(last(after).failed).toBe(true);
    expect(text(after)).not.toBe(kettle);
  });
  // The two person lines are authored in Step 2 and flagged for review:
  // physical and neutral, nothing beyond what existing prose already says.
  it.each(["x sable", "examine sable", "look at sable"])(
    "%s with Sable at the bar is one neutral line",
    (command) => {
      const after = oneFreeLine(newTrial(), command);
      expect(text(after)).toMatch(/Sable/);
    },
  );
  it("x sable in the booth with Sable present is one neutral line", () => {
    const before = run(newTrial(), "talk privately");
    expect(before.room).toBe("booth");
    const after = oneFreeLine(before, "x sable");
    expect(text(after)).toMatch(/Sable/);
  });
  it.each(["x vesper", "examine vesper", "look at vesper"])(
    "%s with Vesper at the shop is one neutral line",
    (command) => {
      const after = oneFreeLine(arrive.shop(), command);
      expect(text(after)).toMatch(/Vesper/);
    },
  );
  it.each<[string, Room]>([
    ["sable", "home"],
    ["vesper", "bar"],
  ])("examining %s where they are not says so", (person, room) => {
    const before = arrive[room]();
    const after = run(before, `x ${person}`);
    expect(text(after)).toMatch(/isn't here|not here/);
    expect(text(after)).not.toMatch(generic);
    unchanged(before, after);
  });
});

describe("C. Bare-noun and shortcut travel", () => {
  it.each<[string, Room]>([
    ["shop", "shop"],
    ["booth", "booth"],
    ["home", "home"],
    ["next door", "shop"],
    ["go next door", "shop"],
    ["through the curtain", "booth"],
    ["go through the curtain", "booth"],
  ])("%s from the bar travels to %s", (command, destination) => {
    const after = run(newTrial(), command);
    expect(outcome(after)).toBe("handled");
    expect(after.room).toBe(destination);
    expect(text(after)).toContain(rooms[destination]);
  });
  it.each(["bar", "velvet corner", "the bar"])(
    "%s from the shop travels to the bar",
    (command) => {
      const after = run(arrive.shop(), command);
      expect(outcome(after)).toBe("handled");
      expect(after.room).toBe("bar");
    },
  );
  it("back returns to the previous room, and back again reverses it", () => {
    const shop = arrive.shop();
    const bar = run(shop, "back");
    expect(bar.room).toBe("bar");
    expect(outcome(bar)).toBe("handled");
    const again = run(bar, "back");
    expect(again.room).toBe("shop");
    const home = run(again, "go home");
    expect(run(home, "go back").room).toBe("shop");
  });
  it.each<[Room, string]>([
    ["bar", "bar"],
    ["shop", "shop"],
    ["booth", "booth"],
    ["home", "home"],
  ])(
    "naming %s while there leaves you there without a rejection",
    (room, name) => {
      const before = arrive[room]();
      const after = run(before, name);
      expect(after.room).toBe(room);
      expect(last(after).failed).toBe(false);
    },
  );
});

describe("D. Gin: the menu's promise is kept", () => {
  // Tested from the opening, where "it" is the special Sable has just named.
  it.each([
    "gin",
    "ask for gin",
    "a gin please",
    "the special with gin",
    "make it alcoholic",
  ])("%s serves the alcoholic special", (command) => {
    const after = run(newTrial(), command);
    expect(last(after).failed, text(after)).toBe(false);
    expect(currentDrink(after)?.kind).toBe("gin special");
    expect(text(after)).toMatch(/gin/);
  });
  it("the special stays alcohol-free by default", () => {
    const after = run(newTrial(), "order the special");
    expect(currentDrink(after)?.kind).toBe("alcohol-free special");
    expect(text(after)).toMatch(/alcohol-free/);
  });
});

// The direct disclosure path from the other Sable suites: Sable's decision
// question is pending afterwards.
function disclosed() {
  return run(
    newTrial(),
    "ask Sable about memories",
    "go shop",
    "read photograph",
    "take photograph",
    "read listing",
    "take listing",
    "go bar",
    "show photograph to Sable",
    "show listing to Sable",
  );
}
describe("E. Negatives: real objects, existing travel and conversation", () => {
  it("bare listen keeps its silence meaning while Sable's decision is pending", () => {
    const pending = disclosed();
    expect(pending.context?.kind).toBe("decision");
    const listened = run(pending, "listen"),
      silent = run(pending, "say nothing");
    expect(lines(listened)).toEqual(lines(silent));
    expect(outcome(listened)).toBe(outcome(silent));
    expect(listened.treatment).toEqual(silent.treatment);
    expect(listened.treatment.at(-1)?.value).toBe("silence");
  });
  it("look at the photograph in the shop examines the real object", () => {
    const after = run(arrive.shop(), "look at the photograph");
    expect(text(after)).toMatch(/clearance print/);
    expect(
      after.observations.some(
        (o) =>
          o.actor === "player" &&
          o.mode === "inspected" &&
          o.evidence.includes("trial-photo"),
      ),
    ).toBe(true);
  });
  it("x photograph in the shop is the same as examine photograph", () => {
    const before = arrive.shop();
    expect(lines(run(before, "x photograph"))).toEqual(
      lines(run(before, "examine photograph")),
    );
  });
  it("x menu still shows the menu", () => {
    expect(lines(run(newTrial(), "x menu"))).toEqual([cocktailMenu]);
  });
  it("talking about a scenery noun is still conversation", () => {
    const lids = run(newTrial(), "tell me about the lids");
    expect(text(lids)).toMatch(/jars|supplier/);
    expect(text(lids)).not.toBe(text(run(newTrial(), "x lids")));
    const speakers = run(newTrial(), "ask sable about the speakers");
    expect(text(speakers)).toMatch(/music|playlist/);
  });
  it.each<[Room, string, Room]>([
    ["bar", "go shop", "shop"],
    ["bar", "go to the secondhand shop", "shop"],
    ["bar", "walk to the shop", "shop"],
    ["bar", "I'll have a look in the shop next door.", "shop"],
    ["bar", "go home", "home"],
    ["bar", "head home", "home"],
    ["bar", "go to the quiet booth", "booth"],
    ["bar", "enter booth", "booth"],
    ["shop", "go bar", "bar"],
    ["shop", "go to the bar", "bar"],
    ["shop", "go back to the bar", "bar"],
    ["shop", "go home", "home"],
    ["booth", "go bar", "bar"],
    ["home", "go bar", "bar"],
    ["home", "go shop", "shop"],
  ])("from the %s, %s still travels to %s", (room, command, destination) => {
    const after = run(arrive[room](), command);
    expect(outcome(after)).toBe("handled");
    expect(after.room).toBe(destination);
  });
  it.each<Room>(["shop", "booth"])(
    "leave from the %s still returns to the bar",
    (room) => {
      const after = run(arrive[room](), "leave");
      expect(outcome(after)).toBe("handled");
      expect(after.room).toBe("bar");
    },
  );
});
