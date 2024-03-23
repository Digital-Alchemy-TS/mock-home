import { TServiceParams } from "@digital-alchemy/core";

export function Graft({ logger }: TServiceParams) {
  return {
    findPhone() {
      logger.info("playing sound on phone");
    },
    async longTimeout() {
      logger.info("set screen timeout long");
    },
    async setMonitorBright() {
      logger.info("set monitor bright");
    },
    async setMonitorDim() {
      logger.info("set monitor dim");
    },
    async shortTimeout() {
      logger.info("screen timeout short");
    },
  };
}
