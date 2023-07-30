import { UintRange } from "bitbadgesjs-proto";

export const FOREVER_DATE = 8640000000000000n //If dates are greater than this, they are considered valid forever

export function getTimeRangesString(validFrom?: UintRange<bigint>[], prefix = "Valid", includeTime = false, numbersOnly?: boolean): string {
  console.log("VALID FROM", validFrom)
  let str = `${prefix} from `
  if (!validFrom) return prefix + " forever!";

  for (const timeRange of validFrom) {
    let endTimestamp = timeRange.end;
    let validForever = timeRange.end >= FOREVER_DATE;

    if (numbersOnly) {
      str += timeRange.start.toString() + "-" + timeRange.end.toString()
      continue
    }

    const endDateString = validForever ? `forever` : new Date(Number(
      endTimestamp.toString()
    )).toLocaleDateString();

    const endTimeString = validForever ? `` : new Date(Number(
      endTimestamp.toString()
    )).toLocaleTimeString();

    const startDateString = new Date(Number(
      timeRange.start.toString()
    )).toLocaleDateString();

    const startTimeString = new Date(Number(
      timeRange.start.toString()
    )).toLocaleTimeString();

    if (includeTime) {
      str += `${startDateString} ${startTimeString} - ${endDateString} ${endTimeString}`;
    } else {
      str += `${startDateString} - ${endDateString}`;
    }
  }

  return str;
}