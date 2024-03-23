import { TServiceParams } from "@digital-alchemy/core";

export function HomeBasics({ logger, hass }: TServiceParams) {
  //
  const isHome = hass.entity.byId("binary_sensor.zoe_is_home");
  const garageDoor = hass.entity.byId("binary_sensor.garage_door_open");

  isHome.onUpdate(async () => {
    if (isHome.state === "on") {
      // am home, don't bother me
      return;
    }
    if (garageDoor.state === "off") {
      // garage door is closed, all is fine
      return;
    }
    logger.info("left home without closing the garage!");
    await hass.call.notify.notify({
      message: "Come back and close the garage door!",
    });
  });
}
