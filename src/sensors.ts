import { TServiceParams } from "@digital-alchemy/core";

export function SensorsExtension({ synapse, context }: TServiceParams) {
  return {
    fanSoundPlaying: synapse.binary_sensor({
      context,
      name: "Bed fan sound playing",
    }),
    guestMode: synapse.switch({
      context,
      name: "Guest Mode",
    }),
    meetingMode: synapse.switch({
      context,
      name: "Meeting Mode",
    }),
    windowsOpen: synapse.switch({
      context,
      name: "Windows Open",
    }),
  };
}
