import { Button, DatePicker } from 'antd';
import { UintRange, deepCopy } from 'bitbadgesjs-proto';
import moment from 'moment';
import { getTimeRangesElement } from '../../../utils/dates';

export function DateRangeInput({
  timeRanges,
  setTimeRanges,
  suggestedTimeRanges,
}: {
  timeRanges: UintRange<bigint>[],
  setTimeRanges: (timeRanges: UintRange<bigint>[]) => void,
  suggestedTimeRanges?: UintRange<bigint>[],
}) {

  // //Top of the hour even :00:00
  const currTimeNextHour = new Date();
  currTimeNextHour.setHours(currTimeNextHour.getHours());
  currTimeNextHour.setMinutes(0);
  currTimeNextHour.setSeconds(0);
  currTimeNextHour.setMilliseconds(0);

  return <>
    <div>
      <b>Suggested Time Ranges</b>
      <br />
      <div className='flex flex-wrap'>
        <Button
          className='screen-button'
          style={{ margin: 4 }}
          onClick={() => {
            setTimeRanges([{ start: BigInt(currTimeNextHour.valueOf()), end: BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24) }]);
          }}
        >
          +1 Day
        </Button>
        <Button
          className='screen-button'
          style={{ margin: 4 }}
          onClick={() => {
            setTimeRanges([{ start: BigInt(currTimeNextHour.valueOf()), end: BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24 * 7) }]);
          }}
        >
          +1 Week
        </Button>
        <Button
          className='screen-button'
          style={{ margin: 4 }}
          onClick={() => {
            setTimeRanges([{ start: BigInt(currTimeNextHour.valueOf()), end: BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24 * 365) }]);
          }}
        >
          +1 Year
        </Button>
        {suggestedTimeRanges?.map(x => {
          return <>

            <Button
              className='screen-button'
              style={{ margin: 4 }}
              onClick={() => {
                setTimeRanges(deepCopy([x]));
              }}
            >
              {getTimeRangesElement([x], '', true, false)}
            </Button>
          </>
        })}
      </div><br />

      <b>Start Time</b>
      <DatePicker
        showMinute
        showTime
        placeholder='Start Date'
        value={timeRanges[0].start ? moment(new Date(Number(timeRanges[0].start))) : null}
        className='primary-text primary-blue-bg full-width'
        onChange={(_date, dateString) => {
          if (new Date(dateString).valueOf() > new Date(Number(timeRanges[0].end)).valueOf()) {
            alert('Start time must be before end time.');
            return;
          }

          setTimeRanges([{ ...timeRanges[0], start: BigInt(new Date(dateString).valueOf()) }]);
        }}
      />
      <br />
      <br />
      <b>End Time</b>
      <DatePicker
        showMinute
        showTime
        placeholder='End Date'
        value={timeRanges[0].end ? moment(new Date(Number(timeRanges[0].end))) : null}
        className='primary-text primary-blue-bg full-width'
        onChange={(_date, dateString) => {
          if (new Date(dateString).valueOf() < new Date(Number(timeRanges[0].start)).valueOf()) {
            alert('End time must be after start time.');
            return;
          }

          setTimeRanges([{ ...timeRanges[0], end: BigInt(new Date(dateString).valueOf()) }]);
        }}
      />
    </div>
  </>
}