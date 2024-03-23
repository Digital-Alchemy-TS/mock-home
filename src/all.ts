import { CronExpression, TServiceParams } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";
import dayjs from "dayjs";
import { join } from "path";

const BASICALLY_NOW = 10;
type states = "heat_cool" | "off";

export function AllRooms({
  automation,
  context,
  hass,
  home_automation,
  logger,
  scheduler,
  devices, // internal device interactions
}: TServiceParams) {
  //
  // imports & definitions
  //

  const list = ["office", "bed", "bedroom", "living", "desk"] as const;
  const downstairs = hass.entity.byId("climate.downstairs");
  const upstairs = hass.entity.byId("climate.ecobee_upstairs");

  async function globalOff() {
    home_automation.living.scene = "off";
    home_automation.office.scene = "off";
    home_automation.bedroom.scene = "off";
  }

  /**
   * Mental note: this does not properly respect high vs evening high type distinctions
   *
   * It serves a "make everything bright" role
   */
  async function globalOn() {
    home_automation.living.scene = "high";
    home_automation.office.scene = "high";
    home_automation.bedroom.scene = "high";
  }

  scheduler.cron({
    exec: async () => {
      if (!automation.solar.isBetween("sunriseEnd", "dusk")) {
        return;
      }
      const file = `${dayjs().format("YYYY-MM-DD-HH-mm")}.png`;

      await hass.call.camera.snapshot({
        entity_id: "camera.garage_high",
        filename: join("/snapshots/garage", file),
      });
      await hass.call.camera.snapshot({
        entity_id: "camera.back_yard_high",
        filename: join("/snapshots/back", file),
      });
    },
    schedule: CronExpression.EVERY_30_MINUTES,
  });

  async function setThermostat(
    entity: PICK_ENTITY<"climate">,
    current: string,
    expected: states,
  ) {
    if (current !== expected) {
      logger.info(`[%s] set state {%s}`, entity, expected);
      await hass.call.climate.set_hvac_mode({
        entity_id: entity,
        hvac_mode: expected,
      });
    }
  }

  const { windowsOpen, guestMode } = home_automation.sensors;

  windowsOpen.onUpdate(async () => {
    const expected = windowsOpen.state === "on" ? "off" : "heat_cool";
    await setThermostat("climate.ecobee_upstairs", upstairs.state, expected);
    await setThermostat("climate.downstairs", downstairs.state, expected);
  });

  async function globalDoorbell() {
    await devices.orchid.playSound("bell");
  }

  hass.entity
    .byId("binary_sensor.doorbell_doorbell")
    .onUpdate(async () => await globalDoorbell());

  /**
   * Keep away tricker or treaters!
   *
   * Unless I'm having a party, and am expecting you
   */
  const keepLightsOff = () => {
    if (guestMode.on) {
      return false;
    }
    const halloween = new Date();
    halloween.setMonth(10);
    halloween.setDate(1);
    halloween.setHours(0);

    const NOW = dayjs();
    if (Math.abs(NOW.diff(halloween, "hour")) <= BASICALLY_NOW) {
      return true;
    }
    return false;
  };

  automation.managed_switch({
    context,
    entity_id: "switch.front_porch_light",
    shouldBeOn() {
      if (keepLightsOff()) {
        return false;
      }
      return !automation.solar.isBetween("dawn", "dusk");
    },
  });

  list.forEach(i => {
    // Push the secret code on common switches, and the phone rings!
    // Only gets used a few times per day
    // powered by kdeconnect
    home_automation.pico[i]({
      context,
      exec: async () => await devices.graft.findPhone(),
      match: ["stop", "lower", "raise"],
    });

    home_automation.pico[i]({
      context,
      exec: async () => await globalOff(),
      match: ["off", "off"],
    });

    home_automation.pico[i]({
      context,
      exec: async () => await globalOn(),
      match: ["on", "on"],
    });
  });

  return {
    focus: async () =>
      await hass.call.switch.turn_off({
        entity_id: ["switch.stair_lights"],
      }),
    globalDoorbell,
    globalOff,
    globalOn,
  };
}
