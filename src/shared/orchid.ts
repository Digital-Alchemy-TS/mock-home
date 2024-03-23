import { TServiceParams } from "@digital-alchemy/core";

export function Orchid({ logger }: TServiceParams) {
  return {
    async playSound(sound: string) {
      logger.info({ sound }, "playing sound");
    },
  };
}
