import { UintRange } from "bitbadgesjs-proto";
import { DateRangeInput } from "../inputs/DateRangeInput";

export function ClaimTimeRangeSelectStep(
  timeRange: UintRange<bigint>,
  setTimeRange: (timeRange: UintRange<bigint>) => void,
) {
  return {
    title: 'Time',
    description: <div>

      <div style={{ textAlign: 'center', marginTop: 4 }} className='primary-text'>
        <h3 style={{ textAlign: 'center' }} className='primary-text'>When can the recipients claim?</h3>
      </div>

      <DateRangeInput
        timeRanges={[timeRange]}
        setTimeRanges={(timeRanges) => {
          setTimeRange(timeRanges[0]);
        }}
      />
    </div>,
    disabled: !timeRange.start || !timeRange.end || timeRange.start > timeRange.end,
  }
}