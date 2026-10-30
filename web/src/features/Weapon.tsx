import { memo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGun } from "@fortawesome/free-solid-svg-icons";
import { useAppSelector } from "../store/hud";

/** lumihud weapon box: the name, the rounds in the clip over the rest, and the weapon's picture on the right. */
export const Weapon = memo(function Weapon() {
  const weapon = useAppSelector((s) => s.hud.weapon);
  const [broken, setBroken] = useState<string | null>(null);
  if (!weapon) return null;
  const picture = weapon.image && broken !== weapon.image;
  return (
    <div className="flex animate-fade items-center gap-[1vh] [filter:drop-shadow(0.15vh_0.1vh_0_rgba(0,0,0,0.75))]">
      <div className="flex flex-col items-end gap-[0.5vh]">
        {weapon.label && (
          <span className="text-[1.9vh] leading-none font-bold">
            {weapon.label}
          </span>
        )}
        {weapon.clip !== null && (
          <span className="flex items-baseline gap-[0.5vh] text-[1.4vh] text-white/70 tabular-nums">
            <span className="text-[1.7vh] font-semibold text-white">
              {weapon.clip}
            </span>
            / {weapon.total}
          </span>
        )}
      </div>
      <span className="flex size-[5.2vh] items-center justify-center rounded-[0.6vh] bg-tgi-dark p-[0.8vh]">
        {picture ? (
          <img
            src={weapon.image}
            alt=""
            onError={() => setBroken(weapon.image ?? null)}
            className="size-full object-contain"
          />
        ) : (
          <FontAwesomeIcon icon={faGun} className="text-[2vh] text-white/70" />
        )}
      </span>
    </div>
  );
});
