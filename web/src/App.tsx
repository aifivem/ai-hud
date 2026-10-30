import { useEffect } from "react"
import { fetchNui, useNuiEvent } from "fivem-nui-react"
import type { NuiMessage } from "../../resource/common/hud"
import {
  MOCK_IDENTITY,
  MOCK_JOB,
  MOCK_MONEY,
  MOCK_NEEDS,
  MOCK_SETUP,
  MOCK_STREET,
  MOCK_VEHICLE,
  MOCK_VITALS,
  MOCK_VOICE,
} from "./dev/mock"
import { Hud } from "./features/Hud"
import { setTexts } from "./lib/lang"
import {
  identitySet,
  jobSet,
  moneySet,
  needsSet,
  settingsSet,
  store,
  streetSet,
  vehicleSet,
  visibleSet,
  vitalsSet,
  voiceSet,
} from "./store/hud"

type Data<A extends NuiMessage["action"]> = Extract<
  NuiMessage,
  { action: A }
>["data"]

// The client is this resource's own code: its messages are trusted in shape (types from common/hud).
const onSetup = (d: Data<"setup">) => {
  setTexts(d.texts)
  store.dispatch(settingsSet(d.settings))
}
const onVisible = (d: Data<"visible">) => store.dispatch(visibleSet(d))
const onNeeds = (d: Data<"needs">) => store.dispatch(needsSet(d))
const onVitals = (d: Data<"vitals">) => store.dispatch(vitalsSet(d))
const onMoney = (d: Data<"money">) => store.dispatch(moneySet(d))
const onVehicle = (d: Data<"vehicle">) => store.dispatch(vehicleSet(d))
const onStreet = (d: Data<"street">) => store.dispatch(streetSet(d))
const onVoice = (d: Data<"voice">) => store.dispatch(voiceSet(d))
const onIdentity = (d: Data<"identity">) => store.dispatch(identitySet(d))
const onJob = (d: Data<"job">) => store.dispatch(jobSet(d))

// Stable mock references: a new object per render would fire the browser mock again.
const SETUP = { mockData: MOCK_SETUP, mockDelay: 50 }
const VISIBLE = { mockData: true, mockDelay: 50 }
const NEEDS = { mockData: MOCK_NEEDS, mockDelay: 50 }
const VITALS = { mockData: MOCK_VITALS, mockDelay: 50 }
const MONEY = { mockData: MOCK_MONEY, mockDelay: 50 }
const VEHICLE = { mockData: MOCK_VEHICLE, mockDelay: 50 }
const STREET = { mockData: MOCK_STREET, mockDelay: 50 }
const VOICE = { mockData: MOCK_VOICE, mockDelay: 50 }
const IDENTITY = { mockData: MOCK_IDENTITY, mockDelay: 50 }
const JOB = { mockData: MOCK_JOB, mockDelay: 50 }

export function App() {
  useNuiEvent("setup", onSetup, SETUP)
  useNuiEvent("visible", onVisible, VISIBLE)
  useNuiEvent("needs", onNeeds, NEEDS)
  useNuiEvent("vitals", onVitals, VITALS)
  useNuiEvent("money", onMoney, MONEY)
  useNuiEvent("vehicle", onVehicle, VEHICLE)
  useNuiEvent("street", onStreet, STREET)
  useNuiEvent("voice", onVoice, VOICE)
  useNuiEvent("identity", onIdentity, IDENTITY)
  useNuiEvent("job", onJob, JOB)
  useEffect(
    () => void fetchNui("ready", undefined, { mockData: { ok: true } }),
    []
  )
  return <Hud />
}
