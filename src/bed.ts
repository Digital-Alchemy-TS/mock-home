import {
  CronExpression,
  HOUR,
  MINUTE,
  TServiceParams,
} from "@digital-alchemy/core";

export function BedRoom({
  automation,
  context,
  hass,
  home_automation,
  scheduler,
  synapse,
  devices, // internal device interactions
}: TServiceParams) {
  // # General functions
  async function napTime(time: number) {
    await home_automation.global.globalOff();
    home_automation.sensors.fanSoundPlaying.on = true;
    await devices.maple.startSound();
    setTimeout(async () => {
      room.scene = "high";
      home_automation.sensors.fanSoundPlaying.on = false;
      await devices.maple.stopSound();
    }, time);
  }

  synapse.button({
    context,
    exec: async () => await napTime(45 * MINUTE),
    name: "45 min nap",
  });

  scheduler.cron({
    exec: async () => {
      home_automation.sensors.fanSoundPlaying.on = true;
      await devices.maple.startSound();
    },
    schedule: CronExpression.EVERY_DAY_AT_10PM,
  });

  scheduler.cron({
    exec: async () => {
      home_automation.sensors.fanSoundPlaying.on = false;
    },
    schedule: CronExpression.EVERY_DAY_AT_8AM,
  });

  // # Room definition
  const room = automation.room({
    context,
    name: "Bedroom",
    scenes: {
      auto: {
        definition: {
          "light.bedroom_ceiling_fan": { brightness: 75, state: "on" },
          "light.dangle": { brightness: 150, state: "on" },
          "light.under_bed": { brightness: 200, state: "on" },
          "light.womp": { brightness: 255, state: "on" },
        },
        friendly_name: "Auto",
      },
      dimmed: {
        definition: {
          "light.bedroom_ceiling_fan": { brightness: 75, state: "on" },
          "light.dangle": { brightness: 150, state: "on" },
          "light.under_bed": { brightness: 200, state: "on" },
          "light.womp": { brightness: 255, state: "on" },
        },
        friendly_name: "Dimmed",
      },
      early: {
        definition: {
          "light.bedroom_ceiling_fan": { brightness: 75, state: "on" },
          "light.dangle": { brightness: 200, state: "on" },
          "light.under_bed": { brightness: 200, state: "on" },
          "light.womp": { brightness: 255, state: "on" },
        },
        friendly_name: "Early",
      },
      high: {
        definition: {
          "light.bedroom_ceiling_fan": { brightness: 255, state: "on" },
          "light.dangle": { brightness: 255, state: "on" },
          "light.under_bed": { brightness: 255, state: "on" },
          "light.womp": { brightness: 255, state: "on" },
        },
        friendly_name: "High",
      },
      high_dimmed: {
        definition: {
          "light.bedroom_ceiling_fan": { brightness: 200, state: "on" },
          "light.dangle": { brightness: 200, state: "on" },
          "light.under_bed": { brightness: 200, state: "on" },
          "light.womp": { brightness: 255, state: "on" },
        },
        friendly_name: "High Dimmed",
      },
      night: {
        definition: {
          "light.bedroom_ceiling_fan": { state: "off" },
          "light.dangle": { state: "off" },
          "light.under_bed": { brightness: 128, state: "on" },
          "light.womp": { brightness: 128, state: "on" },
        },
        friendly_name: "Night",
      },
      night_idle: {
        definition: {
          "light.bedroom_ceiling_fan": { state: "off" },
          "light.dangle": { state: "off" },
          "light.under_bed": { brightness: 32, state: "on" },
          "light.womp": { brightness: 32, state: "on" },
        },
        friendly_name: "Night Idle",
      },
      off: {
        definition: {
          "light.bedroom_ceiling_fan": { state: "off" },
          "light.dangle": { state: "off" },
          "light.under_bed": { state: "off" },
          "light.womp": { state: "off" },
        },
        friendly_name: "Off",
      },
    },
  });

  // # Pico bindings
  home_automation.pico.bed({
    context,
    exec: async () =>
      await hass.call.fan.increase_speed({
        entity_id: "fan.master_bedroom_ceiling_fan",
      }),
    match: ["raise", "raise"],
  });

  home_automation.pico.bed({
    context,
    exec: async () =>
      await hass.call.fan.decrease_speed({
        entity_id: "fan.master_bedroom_ceiling_fan",
      }),
    match: ["lower", "lower"],
  });

  home_automation.pico.bed({
    context,
    exec: async () => await napTime(HOUR),
    match: ["stop", "off"],
  });

  home_automation.pico.bed({
    context,
    exec: () => (room.scene = "off"),
    match: ["off"],
  });

  home_automation.pico.bedroom({
    context,
    exec: () => (room.scene = "off"),
    match: ["off"],
  });

  home_automation.pico.bed({
    context,
    exec: () => (room.scene = "high"),
    match: ["on"],
  });

  home_automation.pico.bedroom({
    context,
    exec: () => (room.scene = "high"),
    match: ["on"],
  });

  return room;
}
