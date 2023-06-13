import { IdRange } from "bitbadgesjs-proto";

export const FOREVER_DATE = 8640000000000000n //If dates are greater than this, they are considered valid forever

export function getTimeRangeString(validFrom?: IdRange<bigint>, prefix = "Valid", includeTime = false): string {
  let str = "";
  if (!validFrom) return prefix + " forever!";

  let endTimestamp = validFrom.end;
  let validForever = validFrom.end >= FOREVER_DATE;

  const endDateString = validForever ? `forever` : new Date(
    endTimestamp.toString()
  ).toLocaleDateString();

  const endTimeString = validForever ? `` : new Date(
    endTimestamp.toString()
  ).toLocaleTimeString();

  const startDateString = new Date(
    validFrom.start.toString()
  ).toLocaleDateString();

  const startTimeString = new Date(
    validFrom.start.toString()
  ).toLocaleTimeString();

  if (includeTime) {
    str = `${prefix} from ${startDateString} ${startTimeString} - ${endDateString} ${endTimeString}`;
  } else {
    str = `${prefix} from ${startDateString} - ${endDateString}`;
  }

  return str;
}