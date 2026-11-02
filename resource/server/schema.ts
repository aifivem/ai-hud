import type { PanelSchema } from "@aifivem/shared";
import { MAP_KEYS_CARD } from "./mapCard";

/** ai-hud's panel: what stresses a character and how fast it fades, what the HUD shows. */
export const hudSchema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "heart-pulse",
  files: {
    settings: {
      kind: "settings",
      sync: "all",
      sections: {
        stressRelief: { type: "number", min: 0, max: 10 },
        stressSpeed: { type: "number", min: 0, max: 500, integer: true },
        stressSpeedChance: { type: "number", min: 0, max: 100 },
        stressShot: { type: "number", min: 0, max: 5, integer: true },
        speedUnit: { type: "enum", values: ["kmh", "mph"] },
        keyHints: { type: "bool" },
        minimap: { type: "enum", values: ["always", "vehicle"] },
        minimapZoom: { type: "number", min: 0, max: 1400, integer: true },
        waypoint: {
          type: "object",
          fields: {
            custom: { type: "bool" },
            color: {
              type: "text",
              min: 7,
              max: 7,
              pattern: "^#[0-9a-fA-F]{6}$",
            },
          },
        },
        show: {
          type: "object",
          fields: {
            needs: { type: "bool" },
            money: { type: "bool" },
            speedometer: { type: "bool" },
            street: { type: "bool" },
            voice: { type: "bool" },
            identity: { type: "bool" },
          },
        },
      },
      defaults: {
        keyHints: true,
        minimap: "always",
        minimapZoom: 1100,
        waypoint: { custom: true, color: "#ff4141" },
      },
    },
  },
  tabs: [
    {
      id: "settings",
      file: "settings",
      icon: "heart-pulse",
      label: "ADMIN_TAB_SETTINGS",
      desc: "ADMIN_TAB_SETTINGS_DESC",
      cards: [
        {
          icon: "heart-pulse",
          title: "ADMIN_C_STRESS",
          desc: "ADMIN_C_STRESS_DESC",
          fields: [
            {
              widget: "number",
              path: "stressRelief",
              label: "ADMIN_F_STRESS_RELIEF",
              hint: "ADMIN_H_STRESS_RELIEF",
              min: 0,
              max: 10,
              step: 0.05,
              unit: "ADMIN_U_PER_MIN",
            },
            {
              widget: "number",
              path: "stressSpeed",
              label: "ADMIN_F_STRESS_SPEED",
              hint: "ADMIN_H_STRESS_SPEED",
              min: 0,
              max: 500,
              step: 10,
              unit: "km/h",
            },
            {
              widget: "number",
              path: "stressSpeedChance",
              label: "ADMIN_F_STRESS_SPEED_CHANCE",
              hint: "ADMIN_H_STRESS_SPEED_CHANCE",
              min: 0,
              max: 100,
              step: 0.5,
              unit: "%",
            },
            {
              widget: "number",
              path: "stressShot",
              label: "ADMIN_F_STRESS_SHOT",
              hint: "ADMIN_H_STRESS_SHOT",
              min: 0,
              max: 5,
            },
          ],
        },
        {
          icon: "eye",
          title: "ADMIN_C_SHOW",
          desc: "ADMIN_C_SHOW_DESC",
          fields: [
            {
              widget: "switch",
              path: "show.needs",
              label: "ADMIN_F_SHOW_NEEDS",
            },
            {
              widget: "switch",
              path: "show.money",
              label: "ADMIN_F_SHOW_MONEY",
            },
            {
              widget: "switch",
              path: "show.speedometer",
              label: "ADMIN_F_SHOW_SPEEDOMETER",
            },
            {
              widget: "switch",
              path: "show.street",
              label: "ADMIN_F_SHOW_STREET",
            },
            {
              widget: "switch",
              path: "show.voice",
              label: "ADMIN_F_SHOW_VOICE",
              hint: "ADMIN_H_SHOW_VOICE",
            },
            {
              widget: "switch",
              path: "show.identity",
              label: "ADMIN_F_SHOW_IDENTITY",
              hint: "ADMIN_H_SHOW_IDENTITY",
            },
            {
              widget: "select",
              path: "speedUnit",
              label: "ADMIN_F_SPEED_UNIT",
              options: [
                { value: "kmh", label: "ADMIN_O_KMH" },
                { value: "mph", label: "ADMIN_O_MPH" },
              ],
            },
          ],
        },
        MAP_KEYS_CARD,
      ],
    },
  ],
};
