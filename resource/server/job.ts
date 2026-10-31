import {
  definitions,
  onCharacter,
  onClientCallback,
  online,
  PlayerMap,
  resourceExport,
} from "@aicore-fivem/lib/server";
import { CORE } from "@aicore-fivem/shared";
import { EVENTS, type JobView } from "common/hud";

const core = resourceExport("ai-core");

/**
 * The job the HUD shows top right (ai-core's current job: on duty, else last on duty, else the first; the one the
 * framework bridges show) with ai-core's labels; nothing without a membership. The client takes a snapshot when it starts; the owner gets a delta when the shown job changes.
 */
class JobLabels {
  private readonly sent = new PlayerMap<string>();

  private view(source: number): JobView | null {
    if (online.jobs(source).length === 0) return null;
    const pick = core.GetCurrentJob(source);
    if (!pick) return null;
    const duty = online.dutyJob(source);
    const definition = definitions.job(pick.job);
    return {
      label: definition?.label ?? pick.job,
      grade: definition?.grades[pick.grade]?.label ?? "",
      onDuty: duty === pick.job,
    };
  }

  snapshot(source: number): JobView | null {
    const view = this.view(source);
    this.sent.set(source, JSON.stringify(view));
    return view;
  }

  push(source: number): void {
    const view = this.view(source);
    const key = JSON.stringify(view);
    if (this.sent.get(source) === key) return;
    this.sent.set(source, key);
    emitNet(EVENTS.jobSet, source, view);
  }

  drop(source: number): void {
    this.sent.delete(source);
  }
}

const labels = new JobLabels();

onCharacter({
  loaded: (source) => labels.push(source),
  unloaded: (source) => labels.drop(source),
});
on(CORE.jobsChangedEvent, (source: number) => labels.push(source));
on(CORE.dutyChangedEvent, (source: number) => labels.push(source));
onClientCallback(EVENTS.job, (source) => labels.snapshot(source));
