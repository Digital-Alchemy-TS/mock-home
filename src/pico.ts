import { TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";

type DeviceName = keyof typeof PicoIds;

export type PicoEvent<NAME extends DeviceName> = {
  action: "press" | "release";
  area_name: string;
  button_number: number;
  button_type: "off";
  device_id: (typeof PicoIds)[NAME];
  device_name: string;
  leap_button_number: number;
  serial: number;
  type: string;
};

const PicoIds = {
  bed: "af58bc7c849cf506534a04db68f15206",
  bedroom: "b8c0901cd3307d6218c26bbc91356c35",
  desk: "311e7afc5fbc6744164356b0f2663cf2",
  games: "f547d2fdec6dc65f3415fe42f9fc972b",
  living: "d3e6a05643d61dd4865d6f0f541a5211",
  loft: "67ed2563dec0b65888bb1323bc988ec7",
  office: "b121787310e8056fa158a50b7f8f1c4e",
  spare: "bd415449f84963177c877d124883535f",
} as const;

export enum Buttons {
  lower = "lower",
  stop = "stop",
  on = "on",
  off = "off",
  raise = "raise",
}

type PicoWatcher = {
  exec: () => TBlackHole;
  match: `${Buttons}`[];
  context: TContext;
};

type PicoBindings = Record<DeviceName, (options: PicoWatcher) => TBlackHole>;

type TEventData<NAME extends DeviceName> = {
  data: PicoEvent<NAME>;
};

export function LutronPicoBindings({
  automation,
  internal,
}: TServiceParams): PicoBindings {
  function LutronPicoSequenceMatcher<NAME extends DeviceName>(
    target_device: NAME,
  ) {
    return function ({ match, exec, context }: PicoWatcher) {
      return automation.sequence({
        context,
        event_type: "lutron_caseta_button_event",
        exec: async () => internal.safeExec(async () => await exec()),
        filter: ({ data: { device_id, action } }: TEventData<NAME>) => {
          return action === "press" && device_id === PicoIds[target_device];
        },
        label: target_device,
        match,
        path: "data.button_type",
      });
    };
  }
  const names = Object.keys(PicoIds) as DeviceName[];

  return Object.fromEntries(
    names.map(key => [key as DeviceName, LutronPicoSequenceMatcher(key)]),
  ) as PicoBindings;
}
