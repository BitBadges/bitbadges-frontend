import { UintRange } from "bitbadgesjs-proto";
import { DateRangeInput } from "../inputs/DateRangeInput";

export function ClaimTimeRangeSelectStep(
  timeRanges: UintRange<bigint>[],
  setTimeRanges: (timeRange: UintRange<bigint>[]) => void,
) {
  return {
    title: 'Time',
    description: <div>

      <div style={{ textAlign: 'center', marginTop: 4 }} className='primary-text'>
        <h3 style={{ textAlign: 'center' }} className='primary-text'>When can the recipients claim?</h3>
      </div>

      <DateRangeInput
        timeRanges={timeRanges}
        setTimeRanges={(timeRanges) => {
          setTimeRanges(timeRanges);
        }}
      />
    </div>,
    disabled: timeRanges.length === 0,
  }
}