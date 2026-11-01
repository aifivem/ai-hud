import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "../store/hud";
import { IconCircle, Pill } from "./parts";
import { Needs } from "./Needs";
import { Voice } from "./Voice";

function Street() {
  const { street, zone } = useAppSelector((s) => s.hud.street);
  if (!street && !zone) return null;
  return (
    <div className="flex gap-[0.5vh]">
      <IconCircle
        icon={faLocationDot}
        className="bg-tgi-green text-tgi-green-text"
      />
      <Pill>
        <span className="text-[1.2vh] font-extrabold">{street}</span>
        <span className="text-[1.2vh] text-white/70 uppercase">{zone}</span>
      </Pill>
    </div>
  );
}

/** Bottom left, beside the radar (at the left edge while it is hidden): street, voice and the status row like lumihud. */
export function Status() {
  const show = useAppSelector((s) => s.hud.settings.show);
  const radar = useAppSelector((s) => s.hud.radar);
  return (
    <div
      className="fixed bottom-[3vh] left-[3vh] flex flex-col items-start gap-[1vh] transition-transform duration-300 ease-out"
      style={{ transform: radar ? "translateX(26vh)" : "translateX(0)" }}
    >
      {show.street && <Street />}
      {show.voice && <Voice />}
      {show.needs && <Needs />}
    </div>
  );
}
