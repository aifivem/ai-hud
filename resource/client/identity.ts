import {
  cache,
  getPlayerData,
  onPlayerData,
  onServerEvent,
  resourceExport,
  seedPlayerData,
  triggerServerCallback,
} from "@aicore-fivem/lib/client";
import { createLogger } from "@aicore-fivem/lib/shared";
import type { CharacterInfo } from "@aicore-fivem/shared";
import { EVENTS, readJob, type JobView } from "common/hud";
import { ResourceName } from "common/resource";
import { send } from "./watchers";

const log = createLogger(ResourceName);
const core = resourceExport("ai-core");

/**
 * Top right of the HUD: server id and character name from ai-core's player data, the job with its labels from this
 * resource's server (snapshot at start, then deltas). Each reaches the NUI once and again only when it changes.
 */
export class Identity {
  private identity: { serverId: number; name: string } | null = null;
  private job: JobView | null = null;

  start(): void {
    // After a restart of this resource ai-core does not push again: start from its current snapshot. When ai-core
    // restarts too (its client may not have registered the export yet) its own push on load fills the HUD instead.
    try {
      const data = core.GetPlayerData();
      if (data) seedPlayerData(data);
    } catch (error) {
      log.warn("ai-core's player data is not ready yet", error);
    }
    onPlayerData("character", (character) => this.setCharacter(character));
    this.setCharacter(getPlayerData("character") ?? null);
    onServerEvent(EVENTS.jobSet, { args: ([raw]) => [readJob(raw)] }, (job) =>
      this.setJob(job),
    );
    triggerServerCallback(EVENTS.job).then(
      (raw) => this.setJob(readJob(raw)),
      (error: unknown) => log.error("job snapshot failed", error),
    );
  }

  /** The NUI (re)loaded: it gets the current values. */
  resend(): void {
    send({ action: "identity", data: this.identity });
    send({ action: "job", data: this.job });
  }

  private setCharacter(character: CharacterInfo | null): void {
    const next = character
      ? {
          serverId: cache.serverId,
          name: `${character.firstname} ${character.lastname}`,
        }
      : null;
    if (
      next?.name === this.identity?.name &&
      next?.serverId === this.identity?.serverId
    )
      return;
    this.identity = next;
    send({ action: "identity", data: next });
  }

  private setJob(job: JobView | null): void {
    if (JSON.stringify(job) === JSON.stringify(this.job)) return;
    this.job = job;
    send({ action: "job", data: job });
  }
}
