import { memo } from "react";
import { useAppSelector } from "../store/hud";
import { TEXT_SHADOW } from "./parts";

/**
 * The keys of what the player can do now, on the left edge (ai-core's list: keybinds for the situation, hints scripts
 * show for a while). A key cap and what it does; the key is the one the player has bound.
 */
export const KeyHints = memo(function KeyHints() {
  const hints = useAppSelector((s) => s.hud.keyHints);
  if (hints.length === 0) return null;
  return (
    <ul className="absolute top-1/2 left-[2vh] flex [transform:translateY(-50%)] flex-col gap-[0.7vh]">
      {hints.map((hint) => (
        <li key={hint.id} className="flex items-center gap-[0.9vh]">
          <span className="flex h-[2.6vh] min-w-[2.6vh] items-center justify-center rounded-[0.5vh] bg-white/90 px-[0.6vh] text-[1.1vh] leading-none font-bold text-black uppercase [box-shadow:0_0.2vh_0.6vh_rgba(0,0,0,0.4)]">
            {hint.key}
          </span>
          <span
            className={`text-[1.3vh] font-medium text-white/85 ${TEXT_SHADOW}`}
          >
            {hint.label}
          </span>
        </li>
      ))}
    </ul>
  );
});
