import { CreateLibrary } from "@digital-alchemy/core";

import { Graft } from "./graft";
import { Maple } from "./maple";
import { Orchid } from "./orchid";

export const INTERNAL_DEVICES = CreateLibrary({
  name: "devices",
  services: {
    graft: Graft,
    maple: Maple,
    orchid: Orchid,
  },
});

declare module "@digital-alchemy/core" {
  export interface LoadedModules {
    devices: typeof INTERNAL_DEVICES;
  }
}
