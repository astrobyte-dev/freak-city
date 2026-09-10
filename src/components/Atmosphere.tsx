import { MapPin, ArrowUpRight } from "lucide-react";
import { LocationVisual } from "./LocationVisual";
import type { VisualDescriptor, VisualMode } from "../visuals/types";
import type { GameState } from "../engine/types";
export function Atmosphere({
  state,
  location,
  onMap,
  descriptor,
  visualMode,
}: {
  state: GameState;
  location: string;
  onMap: () => void;
  descriptor: VisualDescriptor;
  visualMode: VisualMode;
}) {
  return (
    <aside className="atmosphere">
      <LocationVisual descriptor={descriptor} mode={visualMode} />
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
