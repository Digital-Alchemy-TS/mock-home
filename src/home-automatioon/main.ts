import { CreateApplication } from "@digital-alchemy/core";
import { LIB_AUTOMATION } from "@digital-alchemy/core/automation";
import { LIB_HASS } from "@digital-alchemy/core/hass";
import { LIB_SYNAPSE } from "@digital-alchemy/core/synapse";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isBetween from "dayjs/plugin/isBetween";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import weekOfYear from "dayjs/plugin/weekOfYear";

import { LutronPicoBindings, SensorsExtension } from "./extensions/index";
import { AllRooms } from "./rooms/all.room";
import { BedRoom, LivingRoom, Office } from "./rooms/index";

export const HOME_AUTOMATION = CreateApplication({
  libraries: [LIB_AUTOMATION, LIB_SYNAPSE, LIB_HASS],
  name: "home_automation",
  priorityInit: ["sensors"],
  services: {
    bedroom: BedRoom,
    global: AllRooms,
    living: LivingRoom,
    office: Office,
    pico: LutronPicoBindings,
    sensors: SensorsExtension,
  },
});

declare module "@digital-alchemy/core" {
  export interface LoadedModules {
    home_automation: typeof HOME_AUTOMATION;
  }
}

// Kick off the application!
setImmediate(async () => {
  await HOME_AUTOMATION.bootstrap();
});

// Grab bag of my personal most needed
dayjs.extend(weekOfYear);
dayjs.extend(advancedFormat);
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
