/*aicore-client-errors*/(function(){var n=GetCurrentResourceName(),s={},c=0;var r=function(t){t=String(t).replace(/\^\d/g,"");var k=t.slice(0,300);if(s[k]||c>=20)return;s[k]=1;c++;try{TriggerServerEvent("ai-core:clientError",n,t.slice(0,4000))}catch(e){}};globalThis.__aicoreReportError=r;var l=console.log;console.log=function(){var a=arguments[0];if(typeof a==="string"&&a.indexOf("SCRIPT ERROR")!==-1)r(a);return l.apply(console,arguments)}})();
try{
(function() {

// ../../../packages/lib/src/fivem/callbackNames.ts
/**
	* Callback wire format, the same on both sides:
	*   request  `aicore:cb:<name>`              (callerResource, id, ...args)
	*   response `aicore:cbr:<callerResource>`   (id, ok, result)
	* The response goes only to the resource that asked, so two resources never see each other's replies.
	*/
	const requestEvent = (name) => `aicore:cb:${name}`;
	const responseEvent = (resource) => `aicore:cbr:${resource}`;
	/** Default time a caller waits for an answer before the promise rejects. */
	const DEFAULT_CALLBACK_TIMEOUT = 3e4;

// ../../../packages/lib/src/shared/read.ts
/** Small readers for panel content (`data/*.json`): every one returns the fallback when the value is missing or wrong. */
	/** A finite number clamped to `[min, max]`, else the fallback. */
	function num(value, fallback, min = -Infinity, max = Infinity) {
		return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
	}
	/** A boolean, else the fallback. */
	function bool(value, fallback) {
		return typeof value === "boolean" ? value : fallback;
	}
	/** The value as a plain object, or an empty one. */
	function record(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
	}

// ../../../packages/lib/src/shared/index.ts
	function isRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}
	/** Console output prefixed with the resource name, so server logs show where a line came from. */
	function createLogger(resource) {
		const prefix = `[${resource}]`;
		return {
			info: (message, ...details) => console.log(`${prefix} ${message}`, ...details),
			warn: (message, ...details) => console.warn(`${prefix} ^3${message}^7`, ...details),
			error: (message, ...details) => console.error(`${prefix} ^1${message}^7`, ...details)
		};
	}

// ../../../packages/lib/src/client/netEvent.ts
	const log$3 = createLogger(GetCurrentResourceName());
	/**
	* Whether the net event being handled came from the server (read it before the first `await`). On a client only
	* events from the server carry a source (65535 in the docs); a local emit by any resource carries none.
	*/
	const fromServer = () => Boolean(globalThis.source);
	function onServerEvent(name, first, second) {
		const [handler, parse] = typeof first === "function" ? [first, null] : [second, first.args];
		onNet(name, (...raw) => {
			if (!fromServer() || !handler) return;
			const args = parse ? parse(raw) : [];
			if (!args) return log$3.warn(`event ${name} from the server had invalid arguments`);
			Promise.resolve().then(() => handler(...args)).catch((error) => log$3.error(`event ${name} failed`, error));
		});
	}

// ../../../packages/lib/src/client/callback.ts
	const resource$1 = GetCurrentResourceName();
	const log$2 = createLogger(resource$1);
	const pending = /* @__PURE__ */ new Map();
	let nextId = 0;
	onNet(responseEvent(resource$1), (id, ok, result) => {
		if (!fromServer()) return;
		const entry = typeof id === "number" ? pending.get(id) : void 0;
		if (!entry) return;
		pending.delete(id);
		clearTimeout(entry.timer);
		if (ok === true) entry.resolve(result);
		else entry.reject(/* @__PURE__ */ new Error("server callback failed"));
	});
	/**
	* Asks the server (`onClientCallback(name, ...)` there) and resolves with its answer. The answer is unknown:
	* parse it. Rejects when the server reports an error or does not answer within `timeoutMs`.
	*/
	function triggerServerCallback(name, args = [], timeoutMs = DEFAULT_CALLBACK_TIMEOUT) {
		const id = ++nextId;
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				pending.delete(id);
				reject(/* @__PURE__ */ new Error(`server callback ${name} timed out`));
			}, timeoutMs);
			pending.set(id, {
				resolve,
				reject,
				timer
			});
			emitNet(requestEvent(name), resource$1, id, ...args);
		});
	}

// ../../../packages/shared/src/core.ts
/** Names owned by ai-core that other resources, the bridges and the build step use. */
	const CORE = {
		resource: "ai-core",
		/** Client -> server: (resource: string, text: string). Sent by the reporter every client bundle carries. */
		clientErrorEvent: "ai-core:clientError",
		/** (src, character: CharacterInfo) after a character is loaded and spawned. */
		playerLoadedEvent: "ai-core:playerLoaded",
		/** (src, charId, reason: UnloadReason) before a character's state is dropped. */
		playerUnloadedEvent: "ai-core:playerUnloaded",
		/** (src, account: string, balance: number, delta: number, reason: string) */
		moneyChangedEvent: "ai-core:moneyChanged",
		/** (src, jobs: JobMembership[]) */
		jobsChangedEvent: "ai-core:jobsChanged",
		/** (src, job: string | null) */
		dutyChangedEvent: "ai-core:dutyChanged",
		/** (src, gangs: GangMembership[]) */
		gangsChangedEvent: "ai-core:gangsChanged",
		/** (src, gang: string | null) */
		activeGangChangedEvent: "ai-core:activeGangChanged",
		/** (src, charIds: number[]) each time a player's character screen loads; an appearance resource answers with portraits. */
		characterScreenEvent: "ai-core:characterScreen",
		/** (resource: string | null) the inventory behind ai-core's inventory layer changed (the bridge drops its item cache). */
		inventoryChangedEvent: "ai-core:inventoryChanged",
		/** (src, name: string, status: Record<string, number> | null) a player used an item; status = the needs it gives, from inventories that define them. */
		itemUsedEvent: "ai-core:itemUsed",
		/** (src, killer: number | null, weaponHash: number) a player with a loaded character died; fired from FXServer's `onPedDeath` (needs `PED_DEATH_STATE_KEY`). */
		playerDiedEvent: "ai-core:playerDied",
		clientPlayerLoadedEvent: "ai-core:client:playerLoaded",
		clientPlayerUnloadedEvent: "ai-core:client:playerUnloaded",
		/** (charId: number, url: string) a portrait image of a character on the character screen (e.g. `https://nui-img/<txd>/<txd>`). */
		clientCharacterPortraitEvent: "ai-core:client:characterPortrait",
		/** (charId: number) ai-appearance holds this character's look: ai-core dresses its scene ped with `ApplyCharacterAppearance`. */
		clientCharacterLookEvent: "ai-core:client:characterLook",
		/** (resource: string, id: string) the interaction key was pressed while that resource's prompt was on top. */
		clientPromptPressedEvent: "ai-core:client:promptPressed",
		/** (key: keyof PlayerCache, value) a cached value of the local player changed (one watcher in ai-core for every resource). */
		clientCacheEvent: "ai-core:client:cache",
		charactersCallback: "ai-core:characters",
		createCharacterCallback: "ai-core:createCharacter",
		deleteCharacterCallback: "ai-core:deleteCharacter",
		selectCharacterCallback: "ai-core:selectCharacter",
		/** Server -> client: (notification: Notification) a notification card on the player's screen. */
		clientNotifyEvent: "ai-core:client:notify",
		/** Server -> client: (spawn: SpawnPoint) puts the loaded character into the world. */
		spawnEvent: "ai-core:client:spawn",
		/** Server -> client: () the character was let go (switch); show the character screen again. */
		openCharactersEvent: "ai-core:client:openCharacters"
	};

// ../../../packages/shared/src/admin.ts
/** Event names of the admin panel (owned by ai-core). */
	const ADMIN = {
		/** ACE every panel action checks: `add_ace group.admin ai.admin allow`. */
		ace: "ai.admin",
		/** Callback: (keybinds: KeybindInfo[] the admin's client knows) -> AdminPanelSnapshot[]. */
		openCallback: "ai-core:admin:open",
		applyCallback: "ai-core:admin:apply",
		closeEvent: "ai-core:admin:close",
		/** Server -> client: () open the panel (the `aiadmin` command, checked on the server). */
		showEvent: "ai-core:admin:show",
		/** Server -> admins with the panel open: (delta: AdminDelta). */
		deltaEvent: "ai-core:admin:delta",
		/** Server -> client of a world (`sync: "all"`) file: (file, key | null, value). Prefixed with the resource name. */
		worldEvent: (resource) => `${resource}:admin:world`,
		/** Callback: () -> { [file]: { key: value } } world records changed since the resource started. */
		worldChangesCallback: (resource) => `${resource}:admin:worldChanges`
	};

// ../../../packages/shared/src/menu.ts
	const MENU_EVENTS = {
		/** Client local: (resource, requestId, itemId | null) the player picked an item or closed the menu. */
		menuResult: "ai-core:client:menuResult",
		/** Client local: (resource, requestId, itemId) the pointer or focus is on an item (previews). */
		menuHover: "ai-core:client:menuHover",
		/** Client local: (resource, requestId, values | null) the player confirmed or closed the input dialog. */
		inputResult: "ai-core:client:inputResult"
	};

// ../../../packages/lib/src/client/adminWorld.ts
/**
	* The client copy of a resource's world panel files (`sync: "all"`): the file FiveM cached at start, then the
	* records changed since start (asked once), then live changes. Never polls.
	*/
	var AdminWorld = class {
		data = /* @__PURE__ */ new Map();
		handlers = /* @__PURE__ */ new Map();
		resource = GetCurrentResourceName();
		/** Resolves once the changes since start are applied (or could not be loaded): the data is current from then on. */
		ready;
		/** `files`: the world files this client mirrors (each must be in the resource's `files`). */
		constructor(files) {
			const log = createLogger(this.resource);
			for (const file of files) {
				const raw = LoadResourceFile(this.resource, `data/${file}.json`);
				try {
					const parsed = raw ? JSON.parse(raw) : {};
					this.data.set(file, isRecord(parsed) ? parsed : {});
				} catch (error) {
					log.error(`data/${file}.json is not valid JSON`, error);
					this.data.set(file, {});
				}
			}
			onServerEvent(ADMIN.worldEvent(this.resource), { args: ([file, key, value]) => typeof file === "string" ? [
				file,
				typeof key === "string" && key !== "" ? key : void 0,
				value
			] : null }, (file, key, value) => this.put(file, key, value));
			this.ready = triggerServerCallback(ADMIN.worldChangesCallback(this.resource)).then((changes) => {
				if (!isRecord(changes)) return;
				for (const [file, records] of Object.entries(changes)) {
					if (!isRecord(records)) continue;
					for (const [key, value] of Object.entries(records)) this.put(file, key === "" ? void 0 : key, value);
				}
			}, (error) => log.error("loading the panel changes since start failed", error));
		}
		/** The current content of a file: the settings object, or `{ key: record }`. Read only; parse what you use. */
		get(file) {
			return this.data.get(file) ?? {};
		}
		onChange(file, handler) {
			this.handlers.set(file, [...this.handlers.get(file) ?? [], handler]);
		}
		put(file, key, value) {
			const data = this.data.get(file);
			if (!data) return;
			if (key === void 0) {
				if (isRecord(value)) this.data.set(file, value);
			} else if (value === null) delete data[key];
			else data[key] = value;
			for (const handler of this.handlers.get(file) ?? []) handler(key, value);
		}
	};

// ../../../packages/lib/src/client/cache.ts
/** The unarmed "weapon" hash: cached as `false`. */
	const UNARMED = GetHashKey("WEAPON_UNARMED") | 0;
	/** The vehicle, seat and weapon of a ped right now (also ai-core's watcher). */
	function readPlayerState(ped) {
		const vehicle = GetVehiclePedIsIn(ped, false);
		let seat = false;
		if (vehicle) for (let i = -1; i < GetVehicleMaxNumberOfPassengers(vehicle); i++) {
			if (GetPedInVehicleSeat(vehicle, i) !== ped) continue;
			seat = i;
			break;
		}
		const weapon = GetSelectedPedWeapon(ped) | 0;
		return {
			vehicle: vehicle || false,
			seat,
			weapon: weapon === UNARMED ? false : weapon
		};
	}
	/**
	* The local player's often read values (ped, player id, server id, vehicle, seat, weapon), like ox_lib's `cache`:
	* read `cache.ped` instead of calling PlayerPedId() in loops. One watcher in ai-core updates every resource through
	* a local event, so no resource polls for these itself. Read only.
	*/
	const ped = PlayerPedId();
	const cache = {
		ped,
		playerId: PlayerId(),
		serverId: GetPlayerServerId(PlayerId()),
		...readPlayerState(ped)
	};
	const handlers$1 = /* @__PURE__ */ new Map();
	const valid = (key, value) => key === "ped" || key === "playerId" || key === "serverId" ? typeof value === "number" : typeof value === "number" || value === false;
	on(CORE.clientCacheEvent, (key, value) => {
		if (typeof key !== "string" || !(key in cache)) return;
		const name = key;
		if (!valid(name, value) || cache[name] === value) return;
		const old = cache[name];
		cache[name] = value;
		for (const handler of handlers$1.get(name) ?? []) handler(value, old);
	});
	/** Runs `handler(value, old)` whenever a cached value changes (entering a vehicle, a new ped after a model swap...). */
	function onCache(key, handler) {
		let set = handlers$1.get(key);
		if (!set) handlers$1.set(key, set = /* @__PURE__ */ new Set());
		set.add(handler);
	}

// ../../../packages/lib/src/client/zones.ts
/**
	* Zones on this client: inside / outside checks at each zone's own interval, never per frame. Built for any count
	* (measured with 1,000,000 zones): zones sit in a grid of 64 m cells and a check looks only at the player's cell and
	* the zones the player is in.
	*/
	const log$1 = createLogger(GetCurrentResourceName());

// ../../../packages/lib/src/fivem/exports.ts
/** Typed access to another resource's exports (types come from CitizenExports in @aicore-fivem/shared). */
	function resourceExport(resource) {
		return globalThis.exports[resource];
	}

// ../../../packages/lib/src/client/menu.ts
/** Menus and input dialogs this resource asked ai-core for, waiting for the player's answer. */
	var Requests = class {
		resource = GetCurrentResourceName();
		waiting = /* @__PURE__ */ new Map();
		hovers = /* @__PURE__ */ new Map();
		nextId = 0;
		constructor() {
			const answer = (owner, id, value) => {
				if (owner !== this.resource || typeof id !== "number") return;
				this.waiting.get(id)?.(value);
				this.waiting.delete(id);
				this.hovers.delete(id);
			};
			on(MENU_EVENTS.menuHover, (owner, id, item) => {
				if (owner === this.resource && typeof id === "number" && typeof item === "string") this.hovers.get(id)?.(item);
			});
			on(MENU_EVENTS.menuResult, answer);
			on(MENU_EVENTS.inputResult, answer);
		}
		ask(open, read, onHover) {
			const id = ++this.nextId;
			this.waiting.set(id, read);
			if (onHover) this.hovers.set(id, onHover);
			open(id);
		}
	};
	const requests = new Requests();

// ../../../packages/lib/src/client/vehicleProps.ts
	const MOD_TYPES = Array.from({ length: 50 }, (_, i) => i);

// ../../../packages/lib/src/fivem/playerData.ts
/**
	* ai-core's per-player channel: the server pushes `(key, value)` of `AiPlayerData` to the owner's client. One net
	* event carries every key, and every resource on that client receives it, so client code subscribes per key
	* instead of wiring its own `onNet` for each value.
	*/
	const PLAYER_DATA_EVENT = "ai-core:client:playerData";
	/** Same channel for map values (money): only the changed entries travel and the client merges them. */
	const PLAYER_DATA_PATCH_EVENT = "ai-core:client:playerDataPatch";

// ../../../packages/lib/src/client/playerData.ts
	const values = /* @__PURE__ */ new Map();
	const handlers = /* @__PURE__ */ new Map();
	let listening = false;
	function deliver(key, value) {
		values.set(key, value);
		for (const handler of handlers.get(key) ?? []) handler(value);
	}
	function listen() {
		if (listening) return;
		listening = true;
		onServerEvent(PLAYER_DATA_EVENT, { args: ([key, value]) => typeof key === "string" ? [key, value] : null }, (key, value) => deliver(key, value));
		onServerEvent(PLAYER_DATA_PATCH_EVENT, { args: ([key, patch]) => typeof key === "string" && isRecord(patch) ? [key, patch] : null }, (key, patch) => {
			const current = values.get(key);
			deliver(key, {
				...isRecord(current) ? current : {},
				...patch
			});
		});
	}
	/**
	* Calls `handler` every time ai-core pushes `key` for this player. Returns an unsubscribe function. Values pushed
	* before this resource started are not replayed: read the current state once from ai-core's `GetPlayerData` export.
	*/
	function onPlayerData(key, handler) {
		listen();
		const set = handlers.get(key) ?? /* @__PURE__ */ new Set();
		set.add(handler);
		handlers.set(key, set);
		return () => set.delete(handler);
	}
	/** The last value pushed since this resource started, or undefined. */
	function getPlayerData(key) {
		listen();
		return values.get(key);
	}
	/** Seeds the values (from ai-core's `GetPlayerData` export) when this resource starts after the player loaded. */
	function seedPlayerData(data) {
		listen();
		for (const [key, value] of Object.entries(data)) if (!values.has(key)) values.set(key, value);
	}

// ../../../packages/lib/src/client/keybind.ts
	const resource = GetCurrentResourceName();

// ../../../packages/lib/src/fivem/locale.ts
/** Convar holding the language (`setr ai:locale "en"` in misc.cfg); replicated so clients read it too. */
	const LOCALE_CONVAR = "ai:locale";
	function readLocaleFile(resource, lang) {
		const raw = LoadResourceFile(resource, `locales/${lang}.json`);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		if (!isRecord(parsed)) return {};
		const texts = {};
		for (const [key, value] of Object.entries(parsed)) if (typeof value === "string") texts[key] = value;
		return texts;
	}
	/**
	* The resource's merged lang table (`en.json` overlaid with the `ai:locale` language, `${KEY}` references
	* resolved). A NUI gets this once and fills `{0}` placeholders itself.
	*/
	function loadLocaleTexts(resource = GetCurrentResourceName()) {
		const lang = GetConvar(LOCALE_CONVAR, "en");
		const texts = {
			...readLocaleFile(resource, "en"),
			...lang === "en" ? {} : readLocaleFile(resource, lang)
		};
		for (const key of Object.keys(texts)) texts[key] = (texts[key] ?? "").replace(/\$\{([A-Z0-9_]+)\}/g, (match, ref) => texts[ref] ?? match);
		return texts;
	}

// resource/common/hud.ts
/** ai-hud's contracts: needs, panel settings, events and the NUI messages. No natives. */
	const NEEDS = [
		"hunger",
		"thirst",
		"stress"
	];
	const DEFAULT_NEEDS = {
		hunger: 100,
		thirst: 100,
		stress: 0
	};
	const EVENTS = {
		/** Server -> owner: (needs: Needs) snapshot at load; then (need, value) deltas through `need`. */
		needs: "ai-hud:client:needs",
		need: "ai-hud:client:need",
		/** Client -> server: (amount) stress from shooting or speeding; only ever adds. */
		stress: "ai-hud:stress",
		/** Callback: () -> JobView | null, the job the HUD shows (snapshot when the client starts). */
		job: "ai-hud:job",
		/** Server -> owner: (job: JobView | null) the shown job changed (load, job or duty change). */
		jobSet: "ai-hud:client:job"
	};
	function readSettings(raw) {
		const s = record(raw);
		const show = record(s.show);
		return {
			hungerRate: num(s.hungerRate, .25, 0, 10),
			thirstRate: num(s.thirstRate, .35, 0, 10),
			stressRelief: num(s.stressRelief, .5, 0, 10),
			emptyDamage: num(s.emptyDamage, 2, 0, 50),
			speedUnit: s.speedUnit === "mph" ? "mph" : "kmh",
			show: {
				needs: bool(show.needs, true),
				money: bool(show.money, true),
				speedometer: bool(show.speedometer, true),
				street: bool(show.street, true),
				voice: bool(show.voice, true),
				identity: bool(show.identity, true)
			}
		};
	}
	function readJob(raw) {
		if (typeof raw !== "object" || raw === null) return null;
		const j = record(raw);
		if (typeof j.label !== "string") return null;
		return {
			label: j.label,
			grade: typeof j.grade === "string" ? j.grade : "",
			onDuty: j.onDuty === true
		};
	}

// resource/common/resource.ts
	const ResourceName = GetCurrentResourceName();
	const ResourceContext = IsDuplicityVersion() ? "server" : "client";

// resource/client/watchers.ts
/** Vehicle classes without a seatbelt: motorcycles, cycles, boats, helicopters, planes, trains. */
	const NO_BELT = /* @__PURE__ */ new Set([
		8,
		13,
		14,
		15,
		16,
		21
	]);
	const send = (message) => SendNUIMessage(message);
	/**
	* Everything the HUD shows that the game knows: read on timers sized to how fast it changes, sent to the NUI only when
	* a shown value changed. The vehicle timer runs only while in a vehicle.
	*/
	var Watchers = class {
		settings;
		health = -1;
		armour = -1;
		street = "";
		talking = false;
		radio = false;
		mode = 2;
		sentMode = 2;
		sentRadio = false;
		vehicleTimer = null;
		lastVehicle = "";
		constructor(settings) {
			this.settings = settings;
		}
		start() {
			setInterval(() => this.vitals(), 250);
			setInterval(() => this.location(), 1e3);
			setInterval(() => this.voice(), 200);
			onCache("vehicle", (vehicle) => this.watchVehicle(vehicle));
			this.watchVehicle(cache.vehicle);
			onPlayerData("money", (money) => send({
				action: "money",
				data: money
			}));
			const money = getPlayerData("money");
			if (money) send({
				action: "money",
				data: money
			});
			const proximity = LocalPlayer.state.proximity;
			if (isRecord(proximity) && typeof proximity.index === "number") this.mode = proximity.index;
			on("pma-voice:setTalkingMode", (mode) => {
				if (typeof mode === "number") this.mode = mode;
			});
			on("pma-voice:radioActive", (active) => this.radio = active === true);
		}
		vitals() {
			const ped = cache.ped;
			const health = Math.max(0, Math.round((GetEntityHealth(ped) - 100) / (GetEntityMaxHealth(ped) - 100) * 100));
			const armour = GetPedArmour(ped);
			if (health === this.health && armour === this.armour) return;
			this.health = health;
			this.armour = armour;
			send({
				action: "vitals",
				data: {
					health,
					armour
				}
			});
		}
		location() {
			const [x = 0, y = 0, z = 0] = GetEntityCoords(cache.ped, false);
			const [streetHash] = GetStreetNameAtCoord(x, y, z);
			const street = GetStreetNameFromHashKey(streetHash ?? 0);
			const zone = GetLabelText(GetNameOfZone(x, y, z));
			const key = `${street}|${zone}`;
			if (key === this.street) return;
			this.street = key;
			send({
				action: "street",
				data: {
					street,
					zone
				}
			});
		}
		/** Sends only when talking, the range or the radio changed (the NUI starts with not talking, range 2, no radio). */
		voice() {
			const talking = NetworkIsPlayerTalking(cache.playerId);
			if (talking === this.talking && this.mode === this.sentMode && this.radio === this.sentRadio) return;
			this.talking = talking;
			this.sentMode = this.mode;
			this.sentRadio = this.radio;
			send({
				action: "voice",
				data: {
					talking,
					mode: this.mode,
					radio: this.radio
				}
			});
		}
		watchVehicle(vehicle) {
			if (this.vehicleTimer) clearInterval(this.vehicleTimer);
			this.vehicleTimer = null;
			this.lastVehicle = "";
			if (vehicle === false) return send({
				action: "vehicle",
				data: null
			});
			this.vehicleTimer = setInterval(() => this.vehicle(vehicle), 100);
		}
		vehicle(vehicle) {
			const mps = GetEntitySpeed(vehicle);
			const speed = Math.round(this.settings().speedUnit === "mph" ? mps * 2.236936 : mps * 3.6);
			const state = Entity(vehicle).state.fuel;
			const fuel = Math.round(typeof state === "number" ? state : GetVehicleFuelLevel(vehicle));
			const worn = LocalPlayer.state.seatbelt;
			const belt = typeof worn !== "boolean" || NO_BELT.has(GetVehicleClass(vehicle)) ? null : worn;
			const info = {
				speed,
				fuel,
				gear: GetVehicleCurrentGear(vehicle),
				rpm: Math.round(GetVehicleCurrentRpm(vehicle) * 100) / 100,
				belt
			};
			const key = `${info.speed}|${info.fuel}|${info.gear}|${info.rpm}|${belt}`;
			if (key === this.lastVehicle) return;
			this.lastVehicle = key;
			send({
				action: "vehicle",
				data: info
			});
			if (speed > (this.settings().speedUnit === "mph" ? 100 : 160) && Math.random() < .01) emitNet(EVENTS.stress, 1);
		}
	};

// resource/client/identity.ts
	const log = createLogger(ResourceName);
	/**
	* Top right of the HUD: server id and character name from ai-core's player data, the job with its labels from this
	* resource's server (snapshot at start, then deltas). Each reaches the NUI once and again only when it changes.
	*/
	var Identity = class {
		identity = null;
		job = null;
		start() {
			try {
				const data = resourceExport("ai-core").GetPlayerData();
				if (data) seedPlayerData(data);
			} catch (error) {
				log.warn("ai-core's player data is not ready yet", error);
			}
			onPlayerData("character", (character) => this.setCharacter(character));
			this.setCharacter(getPlayerData("character") ?? null);
			onServerEvent(EVENTS.jobSet, { args: ([raw]) => [readJob(raw)] }, (job) => this.setJob(job));
			triggerServerCallback(EVENTS.job).then((raw) => this.setJob(readJob(raw)), (error) => log.error("job snapshot failed", error));
		}
		/** The NUI (re)loaded: it gets the current values. */
		resend() {
			send({
				action: "identity",
				data: this.identity
			});
			send({
				action: "job",
				data: this.job
			});
		}
		setCharacter(character) {
			const next = character ? {
				serverId: cache.serverId,
				name: `${character.firstname} ${character.lastname}`
			} : null;
			if (next?.name === this.identity?.name && next?.serverId === this.identity?.serverId) return;
			this.identity = next;
			send({
				action: "identity",
				data: next
			});
		}
		setJob(job) {
			if (JSON.stringify(job) === JSON.stringify(this.job)) return;
			this.job = job;
			send({
				action: "job",
				data: job
			});
		}
	};

// resource/client/index.ts
	const isNeed = (v) => typeof v === "string" && NEEDS.includes(v);
	/**
	* The HUD's own state: panel settings, the character's needs (server snapshot + deltas), whether it shows. It shows
	* only with a character in the world and no pause menu or fade.
	*/
	var Hud = class {
		world = new AdminWorld(["settings"]);
		settings = readSettings(this.world.get("settings"));
		needs = { ...DEFAULT_NEEDS };
		loaded = false;
		visible = false;
		shootTimer = null;
		constructor() {
			this.world.onChange("settings", () => {
				this.settings = readSettings(this.world.get("settings"));
				this.setup();
			});
		}
		setup() {
			send({
				action: "setup",
				data: {
					texts: loadLocaleTexts(),
					settings: this.settings
				}
			});
		}
		setNeeds(raw) {
			for (const need of NEEDS) if (typeof raw[need] === "number") this.needs[need] = raw[need];
			this.loaded = true;
			send({
				action: "needs",
				data: this.needs
			});
		}
		setNeed(need, value) {
			this.needs[need] = value;
			send({
				action: "needs",
				data: { [need]: value }
			});
		}
		updateVisible() {
			const next = this.loaded && !IsPauseMenuActive() && !IsScreenFadedOut();
			if (next === this.visible) return;
			this.visible = next;
			send({
				action: "visible",
				data: next
			});
		}
		/** Empty hunger or thirst hurts (the client owns its ped's health). */
		starve() {
			if (!this.loaded || this.settings.emptyDamage <= 0 || this.needs.hunger > 0 && this.needs.thirst > 0) return;
			const ped = cache.ped;
			if (!IsEntityDead(ped)) SetEntityHealth(ped, Math.max(0, GetEntityHealth(ped) - this.settings.emptyDamage));
		}
		/** Shooting stresses; checked once a second only while armed. */
		watchWeapon(weapon) {
			if (this.shootTimer) clearInterval(this.shootTimer);
			this.shootTimer = weapon === false ? null : setInterval(() => IsPedShooting(cache.ped) && emitNet(EVENTS.stress, 1), 1e3);
		}
	};
	const hud = new Hud();
	const identity = new Identity();
	RegisterNuiCallback("ready", (_d, cb) => {
		hud.setup();
		send({
			action: "needs",
			data: hud.needs
		});
		identity.resend();
		const money = getPlayerData("money");
		if (money) send({
			action: "money",
			data: money
		});
		cb({ ok: true });
	});
	onServerEvent(EVENTS.needs, { args: ([raw]) => typeof raw === "object" && raw !== null ? [raw] : null }, (raw) => hud.setNeeds(raw));
	onServerEvent(EVENTS.need, { args: ([need, value]) => isNeed(need) && typeof value === "number" ? [need, value] : null }, (need, value) => hud.setNeed(need, value));
	on(CORE.clientPlayerUnloadedEvent, () => {
		hud.loaded = false;
		hud.updateVisible();
	});
	onCache("weapon", (weapon) => hud.watchWeapon(weapon));
	setInterval(() => hud.updateVisible(), 250);
	setInterval(() => hud.starve(), 1e4);
	identity.start();
	new Watchers(() => hud.settings).start();

})();
}catch(e){globalThis.__aicoreReportError&&globalThis.__aicoreReportError("load: "+(e&&e.stack||e));throw e}
