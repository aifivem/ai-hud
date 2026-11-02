import type { CardSpec } from "@aifivem/shared";

/** Settings card: minimap mode and zoom, waypoint colour, key hints. */
export const MAP_KEYS_CARD: CardSpec = {
  icon: "map",
  title: "ADMIN_C_MAP_KEYS",
  desc: "ADMIN_C_MAP_KEYS_DESC",
  fields: [
    {
      widget: "select",
      path: "minimap",
      label: "ADMIN_F_MINIMAP",
      hint: "ADMIN_H_MINIMAP",
      options: [
        { value: "always", label: "ADMIN_O_MINIMAP_ALWAYS" },
        { value: "vehicle", label: "ADMIN_O_MINIMAP_VEHICLE" },
      ],
    },
    {
      widget: "number",
      path: "minimapZoom",
      label: "ADMIN_F_MINIMAP_ZOOM",
      hint: "ADMIN_H_MINIMAP_ZOOM",
      min: 0,
      max: 1400,
      step: 50,
    },
    {
      widget: "switch",
      path: "waypoint.custom",
      label: "ADMIN_F_WAYPOINT_CUSTOM",
      hint: "ADMIN_H_WAYPOINT_CUSTOM",
    },
    {
      widget: "color",
      path: "waypoint.color",
      label: "ADMIN_F_WAYPOINT_COLOR",
      showIf: { path: "waypoint.custom", values: [true] },
    },
    {
      widget: "switch",
      path: "keyHints",
      label: "ADMIN_F_KEY_HINTS",
      hint: "ADMIN_H_KEY_HINTS",
    },
  ],
};
