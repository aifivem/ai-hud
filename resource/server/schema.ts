import type { PanelSchema } from "@aicore-fivem/shared";

/** ai-hud's panel: how fast needs drop, what an empty need costs, what the HUD shows. */
export const hudSchema: PanelSchema = {
  title: "ADMIN_TITLE",
  icon: "heart-pulse",
  files: {
    settings: {
      kind: "settings",
      sync: "all",
      sections: {
        hungerRate: { type: "number", min: 0, max: 10 },
        thirstRate: { type: "number", min: 0, max: 10 },
        stressRelief: { type: "number", min: 0, max: 10 },
        emptyDamage: { type: "number", min: 0, max: 50 },
        speedUnit: { type: "enum", values: ["kmh", "mph"] },
        show: {
          type: "object",
          fields: { needs: { type: "bool" }, money: { type: "bool" }, speedometer: { type: "bool" }, street: { type: "bool" }, voice: { type: "bool" } },
        },
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
          icon: "utensils",
          title: "ADMIN_C_NEEDS",
          desc: "ADMIN_C_NEEDS_DESC",
          fields: [
            { widget: "number", path: "hungerRate", label: "ADMIN_F_HUNGER_RATE", hint: "ADMIN_H_RATE", min: 0, max: 10, step: 0.05, unit: "ADMIN_U_PER_MIN" },
            { widget: "number", path: "thirstRate", label: "ADMIN_F_THIRST_RATE", hint: "ADMIN_H_RATE", min: 0, max: 10, step: 0.05, unit: "ADMIN_U_PER_MIN" },
            { widget: "number", path: "stressRelief", label: "ADMIN_F_STRESS_RELIEF", hint: "ADMIN_H_STRESS_RELIEF", min: 0, max: 10, step: 0.05, unit: "ADMIN_U_PER_MIN" },
            { widget: "number", path: "emptyDamage", label: "ADMIN_F_EMPTY_DAMAGE", hint: "ADMIN_H_EMPTY_DAMAGE", min: 0, max: 50, unit: "ADMIN_U_HP" },
          ],
        },
        {
          icon: "eye",
          title: "ADMIN_C_SHOW",
          desc: "ADMIN_C_SHOW_DESC",
          fields: [
            { widget: "switch", path: "show.needs", label: "ADMIN_F_SHOW_NEEDS" },
            { widget: "switch", path: "show.money", label: "ADMIN_F_SHOW_MONEY" },
            { widget: "switch", path: "show.speedometer", label: "ADMIN_F_SHOW_SPEEDOMETER" },
            { widget: "switch", path: "show.street", label: "ADMIN_F_SHOW_STREET" },
            { widget: "switch", path: "show.voice", label: "ADMIN_F_SHOW_VOICE", hint: "ADMIN_H_SHOW_VOICE" },
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
      ],
    },
  ],
};
