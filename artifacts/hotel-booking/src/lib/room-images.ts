import roomStandard from "@/assets/room-standard.png";
import roomDeluxe from "@/assets/room-deluxe.png";
import roomSuite from "@/assets/room-suite.png";

export function getRoomImage(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("suite")) return roomSuite;
  if (t.includes("deluxe")) return roomDeluxe;
  return roomStandard;
}

export { roomStandard, roomDeluxe, roomSuite };
