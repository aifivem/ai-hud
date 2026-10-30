import { cache, onCache, onPlayerData, getPlayerData } from "@aicore-fivem/lib/client";
import { EVENTS, type NuiMessage, type Settings, type VehicleInfo } from "common/hud";

/** Vehicle classes without a seatbelt: motorcycles, cycles, boats, helicopters, planes, trains. */
const NO_BELT = new Set([8, 13, 14, 15, 16, 21]);

export const send = (message: NuiMessage): void => SendNUIMessage(message);

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
  private vehicleTimer: ReturnType<typeof setInterval> | null = null;
  private lastVehicle = "";

  constructor(private readonly settings: () => Settings) {}

  start(): void {
    setInterval(() => this.vitals(), 250);
    setInterval(() => this.location(), 1000);
    setInterval(() => this.voice(), 200);
    onCache("vehicle", (vehicle) => this.watchVehicle(vehicle));
    this.watchVehicle(cache.vehicle);
    onPlayerData("money", (money) => send({ action: "money", data: money }));
    const money = getPlayerData("money");
    if (money) send({ action: "money", data: money });
    on("pma-voice:setTalkingMode", (mode: unknown) => {
      if (typeof mode === "number") this.mode = mode;
    });
    on("pma-voice:radioActive", (active: unknown) => (this.radio = active === true));
  }

  private vitals(): void {
    const ped = cache.ped;
    const health = Math.max(0, Math.round(((GetEntityHealth(ped) - 100) / (GetEntityMaxHealth(ped) - 100)) * 100));
    const armour = GetPedArmour(ped);
    if (health === this.health && armour === this.armour) return;
    this.health = health;
    this.armour = armour;
    send({ action: "vitals", data: { health, armour } });
  }

  private location(): void {
    const [x = 0, y = 0, z = 0] = GetEntityCoords(cache.ped, false);
    const [streetHash] = GetStreetNameAtCoord(x, y, z);
    const street = GetStreetNameFromHashKey(streetHash ?? 0);
    const zone = GetLabelText(GetNameOfZone(x, y, z));
    const key = `${street}|${zone}`;
    if (key === this.street) return;
    this.street = key;
    send({ action: "street", data: { street, zone } });
  }

  private voice(): void {
    const talking = NetworkIsPlayerTalking(cache.playerId);
    if (talking === this.talking && !this.radio) return;
    this.talking = talking;
    send({ action: "voice", data: { talking, mode: this.mode, radio: this.radio } });
  }

  private watchVehicle(vehicle: number | false): void {
    if (this.vehicleTimer) clearInterval(this.vehicleTimer);
    this.vehicleTimer = null;
    this.lastVehicle = "";
    if (vehicle === false) return send({ action: "vehicle", data: null });
    this.vehicleTimer = setInterval(() => this.vehicle(vehicle), 100);
  }

  private vehicle(vehicle: number): void {
    const mps = GetEntitySpeed(vehicle);
    const speed = Math.round(this.settings().speedUnit === "mph" ? mps * 2.236936 : mps * 3.6);
    const state: unknown = Entity(vehicle).state.fuel;
    const fuel = Math.round(typeof state === "number" ? state : GetVehicleFuelLevel(vehicle));
    const worn: unknown = LocalPlayer.state.seatbelt;
    const belt = typeof worn !== "boolean" || NO_BELT.has(GetVehicleClass(vehicle)) ? null : worn;
    const info: VehicleInfo = { speed, fuel, gear: GetVehicleCurrentGear(vehicle), rpm: Math.round(GetVehicleCurrentRpm(vehicle) * 100) / 100, belt };
    const key = `${info.speed}|${info.fuel}|${info.gear}|${info.rpm}|${belt}`;
    if (key === this.lastVehicle) return;
    this.lastVehicle = key;
    send({ action: "vehicle", data: info });
    // Speeding stresses (the server only ever adds, at most twice a second).
    if (speed > (this.settings().speedUnit === "mph" ? 100 : 160) && Math.random() < 0.01) emitNet(EVENTS.stress, 1);
  }
}
