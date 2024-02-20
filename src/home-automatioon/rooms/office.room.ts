import { CronExpression, TServiceParams, ZCC } from "@digital-alchemy/core";
import dayjs from "dayjs";

export function Office({
  synapse,
  context,
  home_automation,
  automation,
  hass,
  logger,
  scheduler,
  vividra, // internal device interactions
}: TServiceParams) {
  const DIM_SCENES = new Set<typeof room.scene>([
    "off",
    "night",
    "dim",
    "evening",
  ]);
  // # General functions
  function AutoScene(): typeof room.scene {
    const [PM10, AM6, PM1030] = ZCC.shortTime(["PM10", "AM06", "PM10:30"]);
    const now = dayjs();
    if (now.isBetween(AM6, PM10)) {
      return "auto";
    }
    return (now.isBefore(PM1030) && now.isAfter(AM6)) || room.scene === "night"
      ? "dim"
      : "night";
  }

  async function Focus() {
    logger.info(`Focus office`);
    home_automation.bedroom.scene = "off";
    home_automation.living.scene = "off";
    await home_automation.global.focus();
    room.scene = AutoScene();
  }

  // # Scheduler
  scheduler.cron({
    exec: async () => {
      const updateScenes = ["dim", "night", "auto"];
      if (!updateScenes.includes(room.scene)) {
        return;
      }
      room.scene = AutoScene();
    },
    // 10:30PM
    schedule: ["0 22 30 * *", "0 22 31 * *", CronExpression.EVERY_DAY_AT_6AM],
  });

  // # Room definition
  const room = automation.room({
    context,
    name: "Office",
    scenes: {
      auto: {
        definition: {
          "light.monitor_bloom": { brightness: 255, state: "on" },
          "light.office_fan": { brightness: 150, state: "on" },
          "light.office_plant_accent": { brightness: 200, state: "on" },
          "switch.desk_strip_dog_light": { state: "on" },
          "switch.mega_matrix": { state: "on" },
        },
        friendly_name: "Auto",
      },
      dim: {
        definition: {
          "light.monitor_bloom": { brightness: 150, state: "on" },
          "light.office_fan": { brightness: 100, state: "on" },
          "light.office_plant_accent": { brightness: 150, state: "on" },
          "switch.desk_strip_dog_light": { state: "off" },
          "switch.mega_matrix": { state: "on" },
        },
        friendly_name: "Dim",
      },
      evening: {
        definition: {
          "light.monitor_bloom": { brightness: 150, state: "on" },
          "light.office_fan": { brightness: 50, state: "on" },
          "light.office_plant_accent": { brightness: 150, state: "on" },
          "switch.desk_strip_dog_light": { state: "off" },
          "switch.mega_matrix": { state: "on" },
        },
        friendly_name: "Evening",
      },
      high: {
        definition: {
          "light.monitor_bloom": { brightness: 255, state: "on" },
          "light.office_fan": { brightness: 255, state: "on" },
          "light.office_plant_accent": { brightness: 255, state: "on" },
          "switch.desk_strip_dog_light": { state: "on" },
          "switch.mega_matrix": { state: "on" },
        },
        friendly_name: "High",
      },
      meeting: {
        definition: {
          "light.monitor_bloom": { brightness: 255, state: "on" },
          "light.office_fan": { brightness: 100, state: "on" },
          "light.office_plant_accent": { brightness: 100, state: "on" },
          "switch.desk_strip_crafts": { state: "off" },
          "switch.desk_strip_dog_light": { state: "off" },
          "switch.mega_matrix": { state: "on" },
        },
        friendly_name: "Meeting",
      },
      night: {
        definition: {
          "light.monitor_bloom": { brightness: 75, state: "on" },
          "light.office_fan": { brightness: 40, state: "on" },
          "light.office_plant_accent": { brightness: 80, state: "on" },
          "switch.desk_strip_dog_light": { state: "off" },
          "switch.mega_matrix": { state: "on" },
        },
        friendly_name: "Night",
      },
      off: {
        definition: {
          "light.monitor_bloom": { state: "off" },
          "light.office_fan": { state: "off" },
          "light.office_plant_accent": { state: "off" },
          "switch.desk_strip_crafts": { state: "off" },
          "switch.desk_strip_dog_light": { state: "off" },
          "switch.mega_matrix": { state: "off" },
        },
        friendly_name: "Off",
      },
    },
  });

  // # Entities
  // ## official
  const isHome = hass.entity.byId("binary_sensor.zoe_is_home");
  const { meetingMode, windowsOpen } = home_automation.sensors;

  // ## virtual
  synapse.button({
    context,
    exec: async () => await Focus(),
    name: "Office Focus",
  });

  // # Managed switches
  // ## Blanket light
  automation.managed_switch({
    context,
    entity_id: "switch.blanket_light",
    onUpdate: [meetingMode, isHome],
    shouldBeOn() {
      if (isHome.state === "off") {
        return false;
      }
      if (meetingMode.state === "on") {
        return true;
      }
      const [AM7, PM7, NOW] = ZCC.shortTime(["AM7", "PM7", "NOW"]);
      return !NOW.isBetween(AM7, PM7);
    },
  });

  // ## Fairy lights
  automation.managed_switch({
    context,
    entity_id: "switch.fairy_lights",
    onUpdate: [meetingMode, isHome],
    shouldBeOn() {
      // if (isHome.state === "off") {
      //   return false;
      // }
      const [AM7, PM10, NOW] = ZCC.shortTime(["AM7", "PM10", "NOW"]);
      return NOW.isBetween(AM7, PM10);
    },
  });

  // ## Plant lights
  automation.managed_switch({
    context,
    entity_id: "switch.desk_strip_office_plants",
    onUpdate: [meetingMode],
    shouldBeOn() {
      if (meetingMode.state === "on") {
        return false;
      }
      if (!automation.solar.isBetween("sunrise", "sunset")) {
        return false;
      }
      const [PM3, PM5, NOW] = ZCC.shortTime(["PM3", "PM5", "NOW"]);
      if (NOW.isBefore(PM3)) {
        return true;
      }
      if (NOW.isAfter(PM5)) {
        return false;
      }
      if (room.scene !== "high") {
        return false;
      }
      // leave as is
      return undefined;
    },
  });

  // ## Wax warmer
  automation.managed_switch({
    context,
    entity_id: "switch.desk_strip_wax",
    onUpdate: [windowsOpen, room.sceneId(room.scene)],
    shouldBeOn() {
      const scene = room.scene;
      const [PM9, AM5, NOW] = ZCC.shortTime(["PM9", "AM5", "NOW"]);
      return (scene !== "off" && NOW.isBetween(AM5, PM9)) || scene === "auto";
    },
  });

  // # Pico bindings
  // ## Wall
  home_automation.pico.office({
    context,
    exec: async () => (room.scene = "high"),
    match: ["on"],
  });

  home_automation.pico.office({
    context,
    exec: async () => (room.scene = AutoScene()),
    match: ["stop", "stop"],
  });

  home_automation.pico.office({
    context,
    exec: async () => (room.scene = "off"),
    match: ["off"],
  });

  // ## Desk
  home_automation.pico.desk({
    context,
    exec: async () =>
      await hass.call.fan.decrease_speed({
        entity_id: "fan.office_ceiling_fan",
      }),
    match: ["lower"],
  });

  home_automation.pico.desk({
    context,
    exec: async () => (meetingMode.on = !meetingMode.on),
    match: ["stop", "on"],
  });

  home_automation.pico.desk({
    context,
    exec: async () =>
      await hass.call.fan.turn_off({
        entity_id: "fan.office_ceiling_fan",
      }),
    match: ["lower", "lower"],
  });

  home_automation.pico.desk({
    context,
    exec: async () =>
      await hass.call.fan.increase_speed({
        entity_id: "fan.office_ceiling_fan",
      }),
    match: ["raise"],
  });

  // plug repurposed while cold out
  // home_automation.pico.desk({
  //   context,
  //   exec: async () =>
  //     await hass.call.switch.toggle({
  //       entity_id: "switch.foot_fan",
  //     }),
  //   match: ["stop", "lower"],
  // });

  home_automation.pico.desk({
    context,
    exec: async () => await Focus(),
    match: ["stop", "stop", "stop"],
  });

  home_automation.pico.desk({
    context,
    exec: async () => (room.scene = "high"),
    match: ["on"],
  });

  home_automation.pico.desk({
    context,
    exec: async () => (room.scene = "off"),
    match: ["off"],
  });

  room.currentSceneEntity.onUpdate(async () => {
    // Tie monitor brightness to room scene
    // xrandr --output {display} --brightness {value}
    await (DIM_SCENES.has(room.scene)
      ? vividra.graft.setMonitorDim()
      : vividra.graft.setMonitorBright());

    // Turn off display, and set the screen timeout super short when room is off
    // Set display timeout very long, and turn back on display when room is turned on
    // xset dpms force {off|on}
    await (room.scene === "off"
      ? vividra.graft.shortTimeout()
      : vividra.graft.longTimeout());
  });

  return room;
}
