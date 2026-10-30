import { memo } from "react";
import { faBrain, faDrumstickBite, faDroplet, faHeart, faLocationDot, faMicrophone, faShieldHalved, faTowerBroadcast, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { useLang } from "../lib/lang";
import { useAppSelector } from "../store/hud";
import { clamp, DANGER, IconCircle, Pill, TEXT_SHADOW, Value } from "./parts";
import { Speedometer } from "./Speedometer";

/** lumihud status colours (IndicatorBox defaults). */
const COLOR = { health: "#e52323", armour: "#a554f6", hunger: "#ffa754", thirst: "#5ef0e6", stress: "#b46cff" };

/** Status with a horizontal bar (health, armour): icon circle + pill with a thin bar and the value. */
const BigStatus = memo(function BigStatus({ icon, value, color, label }: { icon: IconDefinition; value: number; color: string; label: string }) {
  const tint = value <= 20 ? DANGER : color;
  return (
    <div className="flex gap-[0.5vh]" aria-label={label}>
      <IconCircle icon={icon} color={tint} />
      <Pill>
        <span className="h-[0.4vh] w-[7vh] overflow-hidden rounded-full bg-white/15">
          <span className="block h-full w-full origin-left rounded-full transition-transform duration-300 ease-out" style={{ background: tint, transform: `scaleX(${clamp(value) / 100})` }} />
        </span>
        <Value value={value} />
      </Pill>
    </div>
  );
});

/** Status with a small upright bar (needs): icon circle + pill with a short vertical bar and the value. */
const SmallStatus = memo(function SmallStatus({ icon, value, color, label }: { icon: IconDefinition; value: number; color: string; label: string }) {
  const tint = value <= 20 ? DANGER : color;
  return (
    <div className="flex gap-[0.5vh]" aria-label={label}>
      <IconCircle icon={icon} color={tint} />
      <Pill className="gap-[0.5vh]">
        <span className="flex h-[1.2vh] w-[0.4vh] overflow-hidden rounded-full bg-white/15">
          <span className="block h-full w-full origin-bottom rounded-full transition-transform duration-300 ease-out" style={{ background: tint, transform: `scaleY(${clamp(value) / 100})` }} />
        </span>
        <Value value={value} />
      </Pill>
    </div>
  );
});

function Street() {
  const { street, zone } = useAppSelector((s) => s.hud.street);
  if (!street && !zone) return null;
  return (
    <div className="flex gap-[0.5vh]">
      <IconCircle icon={faLocationDot} className="bg-tgi-green text-tgi-green-text" />
      <Pill>
        <span className="text-[1.2vh] font-extrabold">{street}</span>
        <span className="text-[1.2vh] uppercase text-white/70">{zone}</span>
      </Pill>
    </div>
  );
}

/** Microphone circle (green while talking, radio icon on the radio) and the voice range as three short bars. */
function Voice() {
  const t = useLang();
  const voice = useAppSelector((s) => s.hud.voice);
  return (
    <div className="flex items-center gap-[0.5vh]" aria-label={t("UI_VOICE")}>
      <IconCircle icon={voice.radio ? faTowerBroadcast : faMicrophone} color={voice.talking ? "var(--green)" : "rgba(255, 255, 255, 0.2)"} />
      <span className={`flex items-center gap-[0.5vh] text-[1.2vh] ${TEXT_SHADOW}`}>
        <span className="font-extrabold uppercase">{t("UI_VOICE")}</span>
        <span className="flex items-end gap-[0.2vh]">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`w-[0.4vh] rounded-full ${n <= voice.mode ? (voice.talking ? "bg-tgi-green" : "bg-white") : "bg-white/20"}`} style={{ height: `${0.5 + n * 0.3}vh` }} />
          ))}
        </span>
      </span>
    </div>
  );
}

function Needs() {
  const t = useLang();
  const { needs, vitals } = useAppSelector((s) => s.hud);
  return (
    <div className="flex flex-wrap items-center gap-x-[1vh] gap-y-[0.8vh]">
      <BigStatus icon={faHeart} value={vitals.health} color={COLOR.health} label={t("UI_HEALTH")} />
      {vitals.armour > 0 && <BigStatus icon={faShieldHalved} value={vitals.armour} color={COLOR.armour} label={t("UI_ARMOUR")} />}
      <SmallStatus icon={faDrumstickBite} value={needs.hunger} color={COLOR.hunger} label={t("UI_HUNGER")} />
      <SmallStatus icon={faDroplet} value={needs.thirst} color={COLOR.thirst} label={t("UI_THIRST")} />
      {needs.stress > 5 && <SmallStatus icon={faBrain} value={needs.stress} color={COLOR.stress} label={t("UI_STRESS")} />}
    </div>
  );
}

/** Bottom left, beside the radar: street, voice and the status row stacked like lumihud. */
function Status() {
  const show = useAppSelector((s) => s.hud.settings.show);
  return (
    <div className="fixed bottom-[3vh] left-[29vh] flex flex-col items-start gap-[1vh]">
      {show.street && <Street />}
      {show.voice && <Voice />}
      {show.needs && <Needs />}
    </div>
  );
}

function Money() {
  const t = useLang();
  const money = useAppSelector((s) => s.hud.money);
  const format = (n: number | undefined) => `$${(n ?? 0).toLocaleString("en-US")}`;
  return (
    <div className={`fixed right-[3vh] top-[3vh] flex flex-col items-end gap-[0.5vh] ${TEXT_SHADOW}`}>
      <span className="text-[2.4vh] font-semibold leading-none tabular-nums text-tgi-green" aria-label={t("UI_CASH")}>
        {format(money.cash)}
      </span>
      <span className="text-[1.4vh] font-semibold leading-none tabular-nums text-white/60" aria-label={t("UI_BANK")}>
        {format(money.bank)}
      </span>
    </div>
  );
}

/** The HUD over gameplay: nothing else stays on screen (docs/design.md). */
export function Hud() {
  const { visible, settings } = useAppSelector((s) => s.hud);
  return (
    <div className={`transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      {(settings.show.needs || settings.show.street || settings.show.voice) && <Status />}
      {settings.show.money && <Money />}
      {settings.show.speedometer && <Speedometer />}
    </div>
  );
}
