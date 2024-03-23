import { CronExpression, TServiceParams } from "@digital-alchemy/core";

export function LivingRoom({
  automation,
  context,
  scheduler,
  home_automation,
  hass,
}: TServiceParams) {
  // # Scheduled actions
  automation.solar.onEvent({
    context,
    eventName: "sunriseEnd",
    exec: async () => {
      if (room.scene === "evening_high") {
        room.scene = "high";
      }
    },
  });

  automation.solar.onEvent({
    context,
    eventName: "sunsetStart",
    exec: async () => {
      if (room.scene === "high") {
        room.scene = "evening_high";
      }
    },
  });

  scheduler.cron({
    exec: async () => {
      if (room.scene === "auto") {
        room.scene = "evening";
      }
    },
    schedule: CronExpression.EVERY_DAY_AT_11PM,
  });

  // # Room definition
  const room = automation.room({
    context,
    name: "Living Room",
    scenes: {
      auto: {
        definition: {
          "light.living_room_fan": { brightness: 100, state: "on" },
          "light.tower_left": { brightness: 200, state: "on" },
          "light.tower_right": { brightness: 200, state: "on" },
          "switch.living_room_accessories": { state: "on" },
        },
        friendly_name: "Auto",
      },
      dimmed: {
        definition: {
          "light.living_room_fan": { brightness: 100, state: "on" },
          "light.tower_left": { brightness: 200, state: "on" },
          "light.tower_right": { brightness: 200, state: "on" },
          "switch.living_room_accessories": { state: "on" },
        },
        friendly_name: "Dimmed",
      },
      evening: {
        definition: {
          "light.living_room_fan": { brightness: 80, state: "on" },
          "light.tower_left": { brightness: 100, state: "on" },
          "light.tower_right": { brightness: 100, state: "on" },
          "switch.living_room_accessories": { state: "off" },
        },
        friendly_name: "Evening",
      },
      evening_high: {
        definition: {
          "light.living_room_fan": { brightness: 200, state: "on" },
          "light.tower_left": { brightness: 200, state: "on" },
          "light.tower_right": { brightness: 200, state: "on" },
          "switch.living_room_accessories": { state: "on" },
        },
        friendly_name: "Evening High",
      },
      high: {
        definition: {
          "light.living_room_fan": { brightness: 255, state: "on" },
          "light.tower_left": { brightness: 255, state: "on" },
          "light.tower_right": { brightness: 255, state: "on" },
          "switch.living_room_accessories": { state: "on" },
        },
        friendly_name: "High",
      },
      off: {
        definition: {
          "light.living_room_fan": { state: "off" },
          "light.tower_left": { state: "off" },
          "light.tower_right": { state: "off" },
          "switch.living_room_accessories": { state: "off" },
        },
        friendly_name: "Off",
      },
    },
  });

  // # Entities
  const isHome = hass.entity.byId("binary_sensor.zoe_is_home");
  const { guestMode, meetingMode } = home_automation.sensors;

  // # Managed switches
  automation.managed_switch({
    context,
    entity_id: "switch.media_backdrop",
    onUpdate: [meetingMode, isHome],
    shouldBeOn() {
      if (isHome.state === "off") {
        return false;
      }
      if (automation.solar.isBetween("sunriseEnd", "sunriseEnd")) {
        return false;
      }
      const [PM8, NOW] = automation.utils.shortTime(["PM08", "NOW"]);
      return NOW.isAfter(PM8) && !room.scene.includes("high");
    },
  });

  automation.managed_switch({
    context,
    entity_id: "switch.moon_mirror",
    onUpdate: [guestMode],
    shouldBeOn() {
      const [PM5, AM5, NOW] = automation.utils.shortTime(["PM5", "AM5", "NOW"]);
      if (!NOW.isBetween(AM5, PM5)) {
        return true;
      }
      return guestMode.state === "on";
    },
  });

  // # Pico bindings
  home_automation.pico.living({
    context,
    exec: async () => (room.scene = "auto"),
    match: ["stop", "stop"],
  });

  home_automation.pico.living({
    context,
    exec: async () => {
      home_automation.office.scene = "off";
      home_automation.bedroom.scene = "off";
    },
    match: ["stop", "stop", "stop"],
  });

  home_automation.pico.living({
    context,
    exec: () =>
      (room.scene = automation.solar.isBetween("sunriseEnd", "sunsetStart")
        ? "high"
        : "evening_high"),
    match: ["on"],
  });

  home_automation.pico.living({
    context,
    exec: async () => (room.scene = "off"),
    match: ["off"],
  });

  return room;
}
