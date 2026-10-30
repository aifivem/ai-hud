import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import type { JobView, Needs, Settings, VehicleInfo, Vitals } from "../../../resource/common/hud";

interface HudState {
  settings: Settings;
  visible: boolean;
  needs: Needs;
  vitals: Vitals;
  money: Record<string, number>;
  vehicle: VehicleInfo | null;
  street: { street: string; zone: string };
  voice: { talking: boolean; mode: number; radio: boolean };
  identity: { serverId: number; name: string } | null;
  job: JobView | null;
}

const initialState: HudState = {
  // Replaced by the setup message; only shapes the first render.
  settings: { hungerRate: 0, thirstRate: 0, stressRelief: 0, emptyDamage: 0, speedUnit: "kmh", show: { needs: true, money: true, speedometer: true, street: true, voice: true, identity: true } },
  visible: false,
  needs: { hunger: 100, thirst: 100, stress: 0 },
  vitals: { health: 100, armour: 0 },
  money: {},
  vehicle: null,
  street: { street: "", zone: "" },
  voice: { talking: false, mode: 2, radio: false },
  identity: null,
  job: null,
};

/** What the HUD draws; every message from the client carries only what changed. */
const hud = createSlice({
  name: "hud",
  initialState,
  reducers: {
    settingsSet: (state, a: PayloadAction<Settings>) => void (state.settings = a.payload),
    visibleSet: (state, a: PayloadAction<boolean>) => void (state.visible = a.payload),
    needsSet: (state, a: PayloadAction<Partial<Needs>>) => void Object.assign(state.needs, a.payload),
    vitalsSet: (state, a: PayloadAction<Vitals>) => void (state.vitals = a.payload),
    moneySet: (state, a: PayloadAction<Record<string, number>>) => void Object.assign(state.money, a.payload),
    vehicleSet: (state, a: PayloadAction<VehicleInfo | null>) => void (state.vehicle = a.payload),
    streetSet: (state, a: PayloadAction<{ street: string; zone: string }>) => void (state.street = a.payload),
    voiceSet: (state, a: PayloadAction<{ talking: boolean; mode: number; radio: boolean }>) => void (state.voice = a.payload),
    identitySet: (state, a: PayloadAction<{ serverId: number; name: string } | null>) => void (state.identity = a.payload),
    jobSet: (state, a: PayloadAction<JobView | null>) => void (state.job = a.payload),
  },
});

export const { settingsSet, visibleSet, needsSet, vitalsSet, moneySet, vehicleSet, streetSet, voiceSet, identitySet, jobSet } = hud.actions;
export const store = configureStore({ reducer: { hud: hud.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export const useAppSelector = useSelector.withTypes<RootState>();
