import { memo } from "react";
import {
  faArrowDown,
  faArrowsUpDownLeftRight,
  faBackward,
  faBoxOpen,
  faCircleNodes,
  faEye,
  faForward,
  faHand,
  faHandPointUp,
  faKeyboard,
  faLock,
  faPersonFalling,
  faPowerOff,
  faTableCells,
  faUpDown,
  faUserShield,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "../store/hud";
import { IconCircle, Pill } from "./parts";

/** Icon names scripts give their hints; an unknown name draws the keyboard. */
const ICONS: Record<string, IconDefinition> = {
  "arrow-down": faArrowDown,
  "arrows-up-down-left-right": faArrowsUpDownLeftRight,
  backward: faBackward,
  "box-open": faBoxOpen,
  "circle-nodes": faCircleNodes,
  eye: faEye,
  forward: faForward,
  hand: faHand,
  "hand-point-up": faHandPointUp,
  lock: faLock,
  "person-falling": faPersonFalling,
  "power-off": faPowerOff,
  "table-cells": faTableCells,
  "up-down": faUpDown,
  "user-shield": faUserShield,
};

/**
 * The keys of what the player can do now, on the left edge (ai-core's list: keybinds for the situation, hints scripts
 * show for a while), drawn as lumihud's help buttons: an icon circle and a pill with the bound key and what it does.
 */
export const KeyHints = memo(function KeyHints() {
  const hints = useAppSelector((s) => s.hud.keyHints);
  if (hints.length === 0) return null;
  return (
    <ul className="absolute top-1/2 left-[2vh] flex [transform:translateY(-50%)] flex-col gap-[0.5vh]">
      {hints.map((hint) => (
        <li key={hint.id} className="flex gap-[0.5vh]">
          <IconCircle
            icon={(hint.icon && ICONS[hint.icon]) || faKeyboard}
            className="bg-tgi-dark text-white"
          />
          <Pill className="gap-[0.5vh]">
            <span className="text-[1.2vh] font-extrabold text-white">
              {hint.key}
            </span>
            <span className="text-[1.2vh] text-white/70 uppercase">
              {hint.label}
            </span>
          </Pill>
        </li>
      ))}
    </ul>
  );
});
