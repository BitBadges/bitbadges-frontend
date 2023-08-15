import { Tooltip } from "antd";
import { UintRange } from "bitbadgesjs-proto";

export const FOREVER_DATE = 18446744073709551615n;

export function getTimeRangesElement(validFrom?: UintRange<bigint>[], prefix = "Valid from", includeTime = false, futureOnly = false, numbersOnly?: boolean): JSX.Element {
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

export function getTimeRangesString(validFrom?: UintRange<bigint>[], prefix = "Valid from", includeTime = false, futureOnly = false, numbersOnly?: boolean): string {

  if (!validFrom) return prefix + " forever!";

  const strings = validFrom.map((timeRange, idx) => {
    let str = idx == 0 ? `${prefix}` : '';
    let endTimestamp = timeRange.end;
    let validForever = timeRange.end >= FOREVER_DATE;

    if (numbersOnly) {
      str += timeRange.start.toString() + "-" + timeRange.end.toString()
      return str;
    }

    if (validForever && timeRange.start === 1n) {
      return "All Times";
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