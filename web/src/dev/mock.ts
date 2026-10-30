import en from "../../../locales/en.json"
import settings from "../../../data/settings.json"
import type { Settings } from "../../../resource/common/hud"

/** Browser preview only (`bun run webdev`): `?vehicle=1` shows the speedometer, `?radio=1` talks on the radio, `?offduty=1` is off duty. */
const params = new URLSearchParams(window.location.search)
const vehicle = params.get("vehicle") !== null
export const MOCK_SETUP = {
  texts: en,
  settings: { ...settings, speedUnit: "kmh" } satisfies Settings,
}
export const MOCK_NEEDS = { hunger: 64, thirst: 18, stress: 42 }
export const MOCK_VITALS = { health: 86, armour: 50 }
export const MOCK_MONEY = { cash: 2450, bank: 48200 }
export const MOCK_VEHICLE = vehicle
  ? { speed: 87, fuel: 62, gear: 3, rpm: 0.64, belt: false }
  : undefined
export const MOCK_STREET = { street: "Innocence Blvd", zone: "Strawberry" }
export const MOCK_VOICE = {
  talking: true,
  mode: 2,
  radio: params.get("radio") !== null,
}
export const MOCK_IDENTITY = { serverId: 12, name: "Ricky Vance" }
export const MOCK_JOB = {
  label: "Mechanic",
  grade: "Lead Mechanic",
  onDuty: params.get("offduty") === null,
}
