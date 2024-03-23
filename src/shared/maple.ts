import { TServiceParams } from "@digital-alchemy/core";

export function Maple({ logger }: TServiceParams) {
  return {
    async startSound() {
      logger.info("issue start sound call");
    },
    async stopSound() {
      logger.info("issue stop sound call");
    },
  };
}
