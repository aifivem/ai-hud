import { memo } from "react";
import {
  faBrain,
  faDrumstickBite,
  faDroplet,
  faHeart,
  faShieldHalved,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../lib/lang";
import { useAppSelector } from "../store/hud";
import { clamp, DANGER, IconCircle, Pill, Value } from "./parts";

/** lumihud status colours (IndicatorBox defaults). */
const COLOR = {
  health: "#e52323",
  armour: "#a554f6",
  hunger: "#ffa754",
  thirst: "#5ef0e6",
  stress: "#b46cff",
};

/** Status with a horizontal bar (health, armour): icon circle + pill with a thin bar and the value. */
const BigStatus = memo(function BigStatus({
  icon,
  value,
  color,
  label,
}: {
  icon: IconDefinition;
  value: number;
  color: string;
  label: string;
}) {
  const tint = value <= 20 ? DANGER : color;
  return (
    <div className="flex gap-[0.5vh]" aria-label={label}>
      <IconCircle icon={icon} color={tint} />
      <Pill>
        <span className="h-[0.4vh] w-[7vh] overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full w-full origin-left rounded-full transition-transform duration-300 ease-out"
            style={{
              background: tint,
              transform: `scaleX(${clamp(value) / 100})`,
            }}
          />
        </span>
        <Value value={value} />
      </Pill>
    </div>
  );
});

/** Status with a small upright bar (needs): icon circle + pill with a short vertical bar and the value. */
const SmallStatus = memo(function SmallStatus({
  icon,
  value,
  color,
  label,
}: {
  icon: IconDefinition;
  value: number;
  color: string;
  label: string;
}) {
  const tint = value <= 20 ? DANGER : color;
  return (
    <div className="flex gap-[0.5vh]" aria-label={label}>
      <IconCircle icon={icon} color={tint} />
      <Pill className="gap-[0.5vh]">
        <span className="flex h-[1.2vh] w-[0.4vh] overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full w-full origin-bottom rounded-full transition-transform duration-300 ease-out"
            style={{
              background: tint,
              transform: `scaleY(${clamp(value) / 100})`,
            }}
          />
        </span>
        <Value value={value} />
      </Pill>
    </div>
  );
});

export function Needs() {
  const t = useLang();
  const { needs, vitals } = useAppSelector((s) => s.hud);
  return (
    <div className="flex flex-wrap items-center gap-x-[1vh] gap-y-[0.8vh]">
      <BigStatus
        icon={faHeart}
        value={vitals.health}
        color={COLOR.health}
        label={t("UI_HEALTH")}
      />
      {vitals.armour > 0 && (
        <BigStatus
          icon={faShieldHalved}
          value={vitals.armour}
          color={COLOR.armour}
          label={t("UI_ARMOUR")}
        />
      )}
      <SmallStatus
        icon={faDrumstickBite}
        value={needs.hunger}
        color={COLOR.hunger}
        label={t("UI_HUNGER")}
      />
      <SmallStatus
        icon={faDroplet}
        value={needs.thirst}
        color={COLOR.thirst}
        label={t("UI_THIRST")}
      />
      {needs.stress > 5 && (
        <SmallStatus
          icon={faBrain}
          value={needs.stress}
          color={COLOR.stress}
          label={t("UI_STRESS")}
        />
      )}
    </div>
  );
}
