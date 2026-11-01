import { Watchers } from "./watchers";
import { WeaponWatch } from "./weapon";
import { hud } from "./hud/state";
import { identity } from "./identity";

// Identity seeds ai-core's player data first: the watchers read money from it.
identity.start();
new Watchers(() => hud.settings).start();
new WeaponWatch().start();
