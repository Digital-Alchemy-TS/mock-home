import { LIB_AUTOMATION } from "@digital-alchemy/automation";
import { CreateApplication } from "@digital-alchemy/core";
import { LIB_HASS } from "@digital-alchemy/hass";
import { LIB_SYNAPSE } from "@digital-alchemy/synapse";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isBetween from "dayjs/plugin/isBetween";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import weekOfYear from "dayjs/plugin/weekOfYear";

import { BedRoom, LivingRoom, Office } from ".";
import { AllRooms } from "./all";
import { HomeBasics } from "./basics";
import { LutronPicoBindings } from "./pico";
import { SensorsExtension } from "./sensors";
import { INTERNAL_DEVICES } from "./shared/internal.module";

export const HOME_AUTOMATION = CreateApplication({
  libraries: [LIB_AUTOMATION, LIB_SYNAPSE, LIB_HASS, INTERNAL_DEVICES],
  name: "home_automation",
  priorityInit: ["sensors"],
  services: {
    basics: HomeBasics,
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
