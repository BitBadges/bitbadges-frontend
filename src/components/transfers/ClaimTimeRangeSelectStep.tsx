import { DatePicker } from "antd";
import { UintRange } from "bitbadgesjs-proto";
import moment from "moment";

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

      <b>Start Time</b>
      <DatePicker
        showMinute
        showTime
        placeholder='Start Date'
        value={timeRange.start ? moment(timeRange.start.toString()) : null}
        className='primary-text primary-blue-bg full-width'
        onChange={(_date, dateString) => {
          setTimeRange({
            ...timeRange,
            start: BigInt(new Date(dateString).valueOf()),
          });
        }}
      />
      <br />
      <br />
      <b>End Time</b>
      <DatePicker
        showMinute
        showTime
        placeholder='End Date'
        value={timeRange.end ? moment(timeRange.end.toString()) : null}
        className='primary-text primary-blue-bg full-width'
        onChange={(_date, dateString) => {
          setTimeRange({
            ...timeRange,
            end: BigInt(new Date(dateString).valueOf()),
          });
        }}
      />
    </div>,
    disabled: !timeRange.start || !timeRange.end || timeRange.start > timeRange.end,
  }
}