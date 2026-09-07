import { MapPin, ScanLine, ArrowUpRight } from "lucide-react";
import { formatTime } from "../engine/game";
import type { GameState } from "../engine/types";
const names: Record<string, string> = {
  taxi: "VELVET QUARTER",
  street: "THE SERVICE ROAD",
  velvet: "INSIDE VELVET",
  upstairs: "ABOVE THE NOISE",
  apartment: "YOUR APARTMENT",
  motel: "MOTEL 27",
};
export function Atmosphere({
  state,
  location,
  onMap,
}: {
  state: GameState;
  location: string;
  onMap: () => void;
}) {
  const camera = state.boundaries.surveillance === "allowed";
  return (
    <aside className="atmosphere">
      <div
        className={`scene-image location-${location}`}
        role="img"
        aria-label={
          location === "apartment"
            ? "A quiet apartment window at night"
            : location === "motel"
              ? "A red motel doorway in the dark"
              : "Velvet’s side entrance on a rain-dark street"
        }
      >
        <div className="image-vignette" />
        <div className="camera-top">
          <span>
            <i className="red-dot" />{" "}
            {camera ? "LIVE FROM THE QUARTER" : "A NIGHT IN THE QUARTER"}
          </span>
          {camera && <ScanLine size={17} />}
        </div>
        {camera && (
          <>
            <div className="camera-cross cross-one" />
            <div className="camera-cross cross-two" />
          </>
        )}
        <div className="image-caption">
          <span className="eyebrow">YOU ARE HERE</span>
          <h2>{names[location]}</h2>
          <span className="coordinates">
            42° 53′ S &nbsp; / &nbsp; 147° 19′ E
          </span>
        </div>
        <div className="camera-bottom">
          <span>
            {camera ? "CAM 04 · " : ""}
            {formatTime(state.time)}
            {camera ? ":08" : ""}
          </span>
          <span>{camera ? "REC ●" : "FIRST NIGHT"}</span>
        </div>
      </div>
      <div className="aside-under">
        <button className="location-link" onClick={onMap}>
          <span>
            <MapPin size={16} />
            {location === "apartment"
              ? "Home, for now."
              : "One district. Too many versions."}
          </span>
          <ArrowUpRight size={17} />
        </button>
        <div className="receipt">
          <div className="receipt-top">
            VELVET / ADMIT ONE <span>№ 0027</span>
          </div>
          <div className="receipt-rule" />
          <p>
            COME ALONE.
            <br />
            DON’T GIVE THEM
            <br />
            YOUR REAL NAME.
          </p>
          <div className="receipt-bottom">
            <span>
              {state.started ? state.alias.toUpperCase() : "NO NAME ON FILE"}
            </span>
            <span>23:41</span>
          </div>
          <div className="barcode" />
        </div>
        <div className="aside-foot">
          <span className="red-slash">//</span>
          <p>
            The city keeps receipts.
            <br />
            <span>So should you.</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
