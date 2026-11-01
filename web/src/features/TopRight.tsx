import { groupDigits } from "@aicore-fivem/lib/shared";
import { useLang } from "../lib/lang";
import { useAppSelector } from "../store/hud";
import { TEXT_SHADOW } from "./parts";
import { Weapon } from "./Weapon";

/** lumihud name box: job chip (green on duty) and grade chip, then "[id] Firstname Lastname". */
function Identity() {
  const t = useLang();
  const { identity, job } = useAppSelector((s) => s.hud);
  if (!identity && !job) return null;
  const chip =
    "flex h-[1.9vh] items-center rounded-full px-[1vh] text-[1.1vh] leading-none font-bold uppercase";
  return (
    <div className="flex items-center gap-[0.5vh]">
      {job && (
        <>
          <span
            className={`${chip} ${job.onDuty ? "bg-tgi-green text-tgi-green-text" : "bg-tgi-dark text-white/70"}`}
          >
            {job.label}
          </span>
          {job.grade && (
            <span className={`${chip} bg-tgi-dark text-white`}>
              {job.grade}
            </span>
          )}
          {!job.onDuty && (
            <span className={`${chip} bg-tgi-dark text-white/70`}>
              {t("UI_OFF_DUTY")}
            </span>
          )}
        </>
      )}
      {identity && (
        <span
          className={`ml-[0.5vh] text-[1.8vh] leading-none font-semibold ${TEXT_SHADOW}`}
        >
          <span className="text-white/70 tabular-nums">
            [{identity.serverId}]
          </span>{" "}
          {identity.name}
        </span>
      )}
    </div>
  );
}

function Money() {
  const t = useLang();
  const money = useAppSelector((s) => s.hud.money);
  const format = (n: number | undefined) => `$${groupDigits(n ?? 0)}`;
  return (
    <div className={`flex flex-col items-end gap-[0.5vh] ${TEXT_SHADOW}`}>
      <span
        className="text-[2.4vh] leading-none font-semibold text-tgi-green tabular-nums"
        aria-label={t("UI_CASH")}
      >
        {format(money.cash)}
      </span>
      <span
        className="text-[1.4vh] leading-none font-semibold text-white/60 tabular-nums"
        aria-label={t("UI_BANK")}
      >
        {format(money.bank)}
      </span>
    </div>
  );
}

/** Top right like lumihud: name and job above the money, the held weapon under it. */
export function TopRight() {
  const show = useAppSelector((s) => s.hud.settings.show);
  return (
    <div className="fixed top-[3vh] right-[3vh] flex flex-col items-end gap-[1vh]">
      {show.identity && <Identity />}
      {show.money && <Money />}
      <Weapon />
    </div>
  );
}
