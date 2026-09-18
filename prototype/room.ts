import Phaser from "phaser";
import { distance, findPath, spawn, type Point } from "./navigation";
import { targets, type Target, type TargetId } from "./simulation";
import type { GameState } from "../src/engine/types";
import { hitTarget } from "./targeting";

export interface RoomBridge {
  state: () => GameState;
  select: (id: TargetId) => void;
  feedback: (text: string) => void;
  position: (point: Point, moving: boolean) => void;
  moved: () => void;
}
export class Room extends Phaser.Scene {
  private feet = { ...spawn };
  private path: Point[] = [];
  private arrived?: () => void;
  private player!: Phaser.GameObjects.Container;
  private route!: Phaser.GameObjects.Graphics;
  private markers: Phaser.GameObjects.GameObject[] = [];
  private roomTargets: Target[] = [];
  private ready = false;
  constructor(private bridge: RoomBridge) {
    super("vestibule-experiment");
  }
  create() {
    const g = this.add.graphics();
    g.fillStyle(0x17151d).fillRect(0, 0, 960, 640);
    g.fillStyle(0x492f3b).fillRect(62, 78, 836, 528);
    g.fillStyle(0x27252d).fillRect(80, 145, 800, 455);
    g.lineStyle(1, 0x39353e);
    for (let y = 160; y <= 600; y += 40) g.lineBetween(80, y, 880, y);
    for (let x = 80; x <= 880; x += 80) g.lineBetween(x, 145, x, 600);
    g.fillStyle(0x0d1118).fillRect(400, 70, 160, 75);
    g.fillStyle(0x0d1118).fillRect(48, 350, 32, 110);
    g.fillStyle(0x0d1118).fillRect(880, 350, 32, 110);
    g.fillStyle(0x0d1118).fillRect(405, 600, 150, 35);
    const text = (
      x: number,
      y: number,
      t: string,
      color = "#c1b2b9",
      size = 13,
    ) =>
      this.add
        .text(x, y, t, { fontFamily: "monospace", fontSize: size, color })
        .setOrigin(0.5);
    text(480, 36, "VELVET / VESTIBULE", "#e0d6cb", 18);
    text(480, 102, "BAR ↑");
    text(118, 430, "← TOILETS");
    text(825, 480, "CLOAKROOM →");
    text(480, 619, "↓ STREET");
    text(480, 128, "one-room boundary", "#9c929e", 11);
    // Placeholder footprint geometry; no draft artwork or new world entities.
    this.route = this.add.graphics().setDepth(2);
    const shadow = this.add.ellipse(0, 1, 34, 12, 0x06090d, 0.7);
    const coat = this.add
      .rectangle(0, -23, 23, 36, 0x71c3c3)
      .setStrokeStyle(2, 0x10282c);
    const head = this.add.circle(0, -49, 10, 0xd8b9a2);
    const leg1 = this.add.rectangle(-6, -3, 7, 14, 0xa0b9c1);
    const leg2 = this.add.rectangle(6, -3, 7, 14, 0xa0b9c1);
    const name = text(0, -72, "YOU", "#b9eeeb", 12);
    this.player = this.add
      .container(this.feet.x, this.feet.y, [
        shadow,
        leg1,
        leg2,
        coat,
        head,
        name,
      ])
      .setDepth(10);
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const p = { x: pointer.x, y: pointer.y };
      const target = hitTarget(this.roomTargets, p);
      if (target) {
        this.cancel();
        this.bridge.select(target.id);
        return;
      }
      this.bridge.moved();
      this.walk(p);
    });
    this.ready = true;
    this.refresh();
    this.bridge.position(this.feet, false);
  }
  refresh() {
    if (!this.ready) return;
    this.markers.forEach((m) => m.destroy());
    this.markers = [];
    this.roomTargets = targets(this.bridge.state());
    const has = (id: TargetId) => this.roomTargets.some((t) => t.id === id);
    const g = this.add.graphics().setDepth(3);
    this.markers.push(g);
    if (has("bench")) {
      g.fillStyle(0x604957).fillRoundedRect(340, 285, 280, 90, 7);
      g.lineStyle(3, 0x9d778b).strokeRoundedRect(340, 285, 280, 90, 7);
      g.fillStyle(0xcfbda8).fillRect(346, 366, 18, 7);
    }
    if (has("ledge")) g.fillStyle(0x71605f).fillRect(700, 210, 120, 80);
    if (has("heater")) {
      g.fillStyle(0x403942).fillRoundedRect(180, 220, 65, 90, 6);
      g.lineStyle(3, 0xeb9664);
      for (let x = 193; x < 239; x += 11) g.lineBetween(x, 239, x, 289);
    }
    if (has("notice")) g.fillStyle(0xc9b8a7).fillRect(90, 150, 45, 58);
    if (has("inez")) {
      g.fillStyle(0x0c0b12, 0.7).fillEllipse(790, 391, 38, 13);
      g.fillStyle(0x937082).fillRoundedRect(775, 342, 30, 43, 7);
      g.fillStyle(0xc5a890).fillCircle(790, 330, 11);
      g.lineStyle(6, 0x555461)
        .lineBetween(780, 380, 780, 392)
        .lineBetween(800, 380, 800, 392);
    }
    if (has("envelope")) {
      const p = this.roomTargets.find((t) => t.id === "envelope")!.position;
      g.fillStyle(0x0a0c10).fillRect(p.x - 21, p.y - 12, 42, 24);
      g.lineStyle(2, 0xeacb94).strokeRect(p.x - 21, p.y - 12, 42, 24);
      g.lineBetween(p.x - 21, p.y - 12, p.x, p.y + 2).lineBetween(
        p.x,
        p.y + 2,
        p.x + 21,
        p.y - 12,
      );
    }
    for (const t of this.roomTargets) {
      const ring = this.add
        .circle(
          t.position.x,
          t.position.y,
          t.id === "bench" ? 49 : 29,
          0x000000,
          0,
        )
        .setStrokeStyle(1, 0xe5c598, 0.7)
        .setDepth(4);
      const label = this.add
        .text(
          t.position.x,
          t.position.y + (t.id === "inez" ? 28 : 34),
          t.label,
          {
            fontFamily: "monospace",
            fontSize: 13,
            color: "#f1d9b5",
            backgroundColor: "#17151de8",
            padding: { x: 5, y: 4 },
          },
        )
        .setOrigin(0.5)
        .setDepth(5);
      this.markers.push(ring, label);
    }
  }
  cancel() {
    const wasMoving = this.path.length > 0 || !!this.arrived;
    this.path = [];
    this.arrived = undefined;
    this.route?.clear();
    this.bridge.position(this.feet, false);
    return wasMoving;
  }
  walk(end: Point, onArrival?: () => void) {
    this.cancel();
    const path = findPath(this.feet, end);
    if (!path) {
      this.bridge.feedback(
        "You can't reach that spot. Choose clear floor or a highlighted target.",
      );
      return false;
    }
    this.path = path;
    this.arrived = onArrival;
    this.route
      .lineStyle(2, 0x80b7b5, 0.65)
      .beginPath()
      .moveTo(this.feet.x, this.feet.y);
    path.forEach((p) => this.route.lineTo(p.x, p.y));
    this.route.strokePath();
    this.bridge.position(this.feet, true);
    if (!onArrival) this.bridge.feedback("Walking…");
    return true;
  }
  approach(id: TargetId, done: () => void) {
    const target = targets(this.bridge.state()).find((t) => t.id === id);
    if (!target) {
      this.bridge.feedback("That target is no longer here.");
      return;
    }
    if (distance(this.feet, target.approach) <= 3) {
      this.cancel();
      done();
      return;
    }
    this.bridge.feedback(`Walking to ${target.label}…`);
    this.walk(target.approach, () => {
      const current = targets(this.bridge.state()).find((t) => t.id === id);
      if (!current || distance(this.feet, current.approach) > 3) {
        this.bridge.feedback(
          "The target changed before you arrived. Choose it again.",
        );
        return;
      }
      done();
    });
  }
  update(_time: number, delta: number) {
    if (!this.path.length) return;
    const next = this.path[0];
    const d = distance(this.feet, next);
    const step = Math.min(delta, 50) * 0.24;
    if (d <= step) {
      this.feet = { ...next };
      this.path.shift();
    } else {
      this.feet.x += ((next.x - this.feet.x) * step) / d;
      this.feet.y += ((next.y - this.feet.y) * step) / d;
    }
    this.player.setPosition(this.feet.x, this.feet.y);
    this.bridge.position(this.feet, this.path.length > 0);
    if (!this.path.length) {
      const done = this.arrived;
      this.arrived = undefined;
      this.route.clear();
      if (done) done();
      else this.bridge.feedback("Arrived. Choose an object or person.");
    }
  }
}
