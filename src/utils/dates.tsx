import { Tooltip } from "antd";
import { UintRange } from "bitbadgesjs-sdk";

export const GO_MAX_UINT_64 = 18446744073709551615n;

export const FOREVER_THRESHOLD = 7277881234n * 1000n;

export function getTimeRangesElement(validFrom?: UintRange<bigint>[], prefix = "", includeTime = false, futureOnly = false, numbersOnly?: boolean): JSX.Element {
  if (validFrom?.length == 0) {
    return <span>None</span>
  }

  let strWithTime = getTimeRangesString(validFrom, prefix, true, futureOnly, numbersOnly);
  let strWithoutTime = getTimeRangesString(validFrom, prefix, false, futureOnly, numbersOnly);

  if (includeTime) {

    return <Tooltip title={strWithTime}>
      <span>{strWithoutTime}</span>
    </Tooltip>
  } else {
    return <span>{strWithoutTime}</span>
  }
}

export function getTimeRangesString(validFrom?: UintRange<bigint>[], prefix = "", includeTime = false, futureOnly = false, numbersOnly?: boolean): string {

  if (!validFrom) return prefix + " forever!";

  const strings = validFrom.map((timeRange, idx) => {
    let str = idx == 0 ? `${prefix}` : '';
    let endTimestamp = timeRange.end;
    let validForever = timeRange.end >= GO_MAX_UINT_64;

    if (numbersOnly) {
      str += timeRange.start.toString() + "-" + timeRange.end.toString()
      return str;
    }

    if (validForever && timeRange.start === 1n) {
      return "All";
    }

    const endDateString = validForever ? `Forever` : new Date(Number(
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

    let currentRange = new Date().getTime() >= Number(timeRange.start.toString()) && new Date().getTime() <= Number(timeRange.end.toString());

    if (currentRange && futureOnly) {
      if (includeTime) {
        str += `Current - ${endDateString} ${endTimeString}`;
      } else {
        str += `Current - ${endDateString}`;
      }
    } else {
      if (includeTime) {
        str += `${startDateString} ${startTimeString} - ${endDateString} ${endTimeString}`;
      } else {
        str += `${startDateString} - ${endDateString}`;
      }
    }


    return str;
  })

  return strings.join(', ');
}