import {
  PLAYER_BAGS,
  SEATBELT_EVENT,
  VEHICLE_BAGS,
} from "@aicore-fivem/shared";
import {
  cache,
  EntityState,
  every,
  getPlayerData,
  type Job,
  locationName,
  onCache,
  onPlayerData,
  optionalExport,
  PlayerState,
  stateNumber,
} from "@aicore-fivem/lib/client";
import { isRecord, rollChance } from "@aicore-fivem/lib/shared";
import {
  EVENTS,
  type NuiMessage,
  type Settings,
  type VehicleInfo,
} from "common/hud";

const fuelState = new EntityState(VEHICLE_BAGS.fuel, stateNumber);
/** pma-voice keeps the current range in the player state (`proximity.index`). */
const voiceRange = new PlayerState(PLAYER_BAGS.proximity, (v) =>
  isRecord(v) && typeof v.index === "number" ? v.index : undefined,
);
/**
 * ai-smallresources' seat belt now. Read when a vehicle is entered, not at load: the client may load ai-hud before
 * ai-smallresources has registered the export (a throw here would stop the whole HUD).
 */
function readSeatbelt(): boolean | null {
  try {
    return optionalExport("ai-smallresources")?.GetSeatbelt() ?? null;
  } catch {
    // Not registered yet: SEATBELT_EVENT brings the value once it is.
    return null;
  }
}
let seatbelt: boolean | null = null;
on(
  SEATBELT_EVENT,
  (worn: unknown) => (seatbelt = typeof worn === "boolean" ? worn : null),
);

/** Vehicle classes without a seatbelt: motorcycles, cycles, boats, helicopters, planes, trains. */
const NO_BELT = new Set([8, 13, 14, 15, 16, 21]);

export const send = (message: NuiMessage): void => SendNUIMessage(message);

let lastStress = -Infinity;
/** Reports stress to the server at most once a second (its rate for the event); a skipped point is dropped. */
export function addStress(amount: number): void {
  const now = GetGameTimer();
  if (amount <= 0 || now - lastStress < 1000) return;
  lastStress = now;
  emitNet(EVENTS.stress, amount);
}

/**
 * Everything the HUD shows that the game knows: read on timers sized to how fast it changes, sent to the NUI only when
 * a shown value changed. The vehicle timer runs only while in a vehicle.
 */
export class Watchers {
  private health = -1;
  private armour = -1;
  private street = "";
  private talking = false;
  private radio = false;
  private mode = 2;
  private sentMode = 2;
  private sentRadio = false;
  private vehicleTimer: Job | null = null;
  private lastVehicle = "";

  constructor(private readonly settings: () => Settings) {}

  start(): void {
    every(250, () => this.vitals(), { name: "vitals" });
    every(1000, () => this.location(), { name: "location" });
    every(200, () => this.voice(), { name: "voice" });
    onCache("vehicle", (vehicle) => this.watchVehicle(vehicle));
    this.watchVehicle(cache.vehicle);
    onPlayerData("money", (money) => send({ action: "money", data: money }));
    const money = getPlayerData("money");
    if (money) send({ action: "money", data: money });
    // pma-voice keeps the current range in the local player state; later changes come as events.
    const index = voiceRange.get(cache.serverId);
    if (index !== undefined) this.mode = index;
    on("pma-voice:setTalkingMode", (mode: unknown) => {
      if (typeof mode === "number") this.mode = mode;
    });
    on(
      "pma-voice:radioActive",
      (active: unknown) => (this.radio = active === true),
    );
  }

  private vitals(): void {
    const ped = cache.ped;
    const health = Math.max(
      0,
      Math.round(
        ((GetEntityHealth(ped) - 100) / (GetEntityMaxHealth(ped) - 100)) * 100,
      ),
    );
    const armour = GetPedArmour(ped);
    if (health === this.health && armour === this.armour) return;
    this.health = health;
    this.armour = armour;
    send({ action: "vitals", data: { health, armour } });
  }

  private location(): void {
    const { street, zone } = locationName();
    const key = `${street}|${zone}`;
    if (key === this.street) return;
    this.street = key;
    send({ action: "street", data: { street, zone } });
  }

  /** Sends only when talking, the range or the radio changed (the NUI starts with not talking, range 2, no radio). */
  private voice(): void {
    const talking = NetworkIsPlayerTalking(cache.playerId);
    if (
      talking === this.talking &&
      this.mode === this.sentMode &&
      this.radio === this.sentRadio
    )
      return;
    this.talking = talking;
    this.sentMode = this.mode;
    this.sentRadio = this.radio;
    send({
      action: "voice",
      data: { talking, mode: this.mode, radio: this.radio },
    });
  }

  private watchVehicle(vehicle: number | false): void {
    if (vehicle !== false) seatbelt = readSeatbelt();
    this.vehicleTimer?.stop();
    this.vehicleTimer = null;
    this.lastVehicle = "";
    if (vehicle === false) return send({ action: "vehicle", data: null });
    this.vehicleTimer = every(100, () => this.vehicle(vehicle), {
      name: "vehicle",
    });
  }

  private vehicle(vehicle: number): void {
    const mps = GetEntitySpeed(vehicle);
    const speed = Math.round(
      this.settings().speedUnit === "mph" ? mps * 2.236936 : mps * 3.6,
    );
    const fuel = Math.round(
      fuelState.get(vehicle) ?? GetVehicleFuelLevel(vehicle),
    );
    const belt =
      seatbelt === null || NO_BELT.has(GetVehicleClass(vehicle))
        ? null
        : seatbelt;
    const info: VehicleInfo = {
      speed,
      fuel,
      gear: GetVehicleCurrentGear(vehicle),
      rpm: Math.round(GetVehicleCurrentRpm(vehicle) * 100) / 100,
      belt,
    };
    const key = `${info.speed}|${info.fuel}|${info.gear}|${info.rpm}|${belt}`;
    if (key === this.lastVehicle) return;
    this.lastVehicle = key;
    send({ action: "vehicle", data: info });
    // Speeding stresses (the server only ever adds).
    const { stressSpeed, stressSpeedChance } = this.settings();
    if (
      stressSpeed > 0 &&
      mps * 3.6 > stressSpeed &&
      rollChance(stressSpeedChance)
    )
      addStress(1);
  }
}
