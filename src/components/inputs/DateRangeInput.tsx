import { Avatar, Button, DatePicker, Divider } from 'antd';
import { UintRange, deepCopy } from 'bitbadgesjs-proto';
import moment from 'moment';
import { getTimeRangesElement } from '../../utils/dates';
import { DeleteOutlined, EditOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { checkIfUintRangesOverlap, sortUintRangesAndMergeIfNecessary } from 'bitbadgesjs-utils';
import { useState } from 'react';
import IconButton from '../display/IconButton';

export function DateRangeInput({
  timeRanges,
  setTimeRanges,
  suggestedTimeRanges,
}: {
  timeRanges: UintRange<bigint>[],
  setTimeRanges: (timeRanges: UintRange<bigint>[]) => void,
  suggestedTimeRanges?: UintRange<bigint>[],
}) {

  const [showTimeRange, setShowTimeRange] = useState(-1);

  // //Top of the hour even :00:00
  const currTimeNextHour = new Date();
  currTimeNextHour.setHours(currTimeNextHour.getHours() - 1);
  currTimeNextHour.setMinutes(0);
  currTimeNextHour.setSeconds(0);
  currTimeNextHour.setMilliseconds(0);

  const timeRangesOverlap = checkIfUintRangesOverlap(timeRanges);


  return <>
    <div>
      <div style={{ textAlign: 'center', marginTop: 4 }} className='primary-text'>
        <div className='flex flex-column'>

          {timeRanges.length === 0 && <div className='primary-text' style={{ marginTop: 4 }}>
            None
          </div>}
          {timeRanges.map((x, i) => {
            return <div key={i} className='flex-center flex-wrap' style={{ marginBottom: 8 }}>
              <div>
                {getTimeRangesElement([x], '', true, false)}
              </div>
              <div className='flex-center flex-wrap'>
                <IconButton
                  style={{
                    color: showTimeRange === i ? '#1890ff' : undefined,
                    backgroundColor: showTimeRange === i ? 'inherit' : undefined,
                    border: showTimeRange === i ? '1px solid #1890ff' : undefined,
                  }}
                  src={<EditOutlined />}
                  onClick={() => {
                    if (showTimeRange === i) {
                      setShowTimeRange(-1);
                      return;
                    }
                    setShowTimeRange(i);
                  }}
                  text='Edit'
                />
                <IconButton
                  onClick={() => {
                    const newTimeRanges = deepCopy(timeRanges.filter((_, j) => j !== i))
                    setShowTimeRange(-1);
                    setTimeRanges(newTimeRanges);
                  }}
                  src={<DeleteOutlined />}
                  text='Delete'
                />
              </div>
            </div>
          })}
          <br />

        </div >

        <div>
          {timeRangesOverlap && <div className='primary-text' style={{ color: 'red' }}>
            <WarningOutlined />
            Time ranges overlap which is not allowed.
            <br />
            <br />
          </div>}

          <div className='flex-center flex-column'>
            {timeRangesOverlap && <>
              <Button type='primary'
                style={{ width: 200 }}
                className="landing-button"
                onClick={() => {
                  const newUintRanges = sortUintRangesAndMergeIfNecessary(timeRanges);

                  setTimeRanges(newUintRanges);
                }}>
                Sort and Remove Overlaps
              </Button>
              <br />

            </>
            }
          </div>

        </div>

        <Avatar
          className='styled-icon-button'
          style={{ cursor: 'pointer' }}
          onClick={() => {
            // const len = timeRanges.length
            setTimeRanges([...timeRanges, { start: BigInt(currTimeNextHour.valueOf()), end: BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24) }]);
            setShowTimeRange(-1);
          }}
          src={<PlusOutlined />}
        />
        <br />
        <br />
      </div>
      {showTimeRange >= 0 && showTimeRange < timeRanges.length && <>
        <hr />
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <b>Editing Time Range: {getTimeRangesElement([timeRanges[showTimeRange]], '', true, false)}</b>
          <br />
        </div>
        <b >Suggested Time Ranges</b>
        <br />
        <div className='flex flex-wrap'>
          <Button
            className='styled-icon-button'
            style={{ margin: 4 }}
            onClick={() => {
              timeRanges[showTimeRange].start = BigInt(currTimeNextHour.valueOf());
              timeRanges[showTimeRange].end = BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24);

              setTimeRanges(deepCopy(timeRanges));
            }}
          >
            +1 Day
          </Button>
          <Button
            className='styled-icon-button'
            style={{ margin: 4 }}
            onClick={() => {
              timeRanges[showTimeRange].start = BigInt(currTimeNextHour.valueOf());
              timeRanges[showTimeRange].end = BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24 * 7);

              setTimeRanges(deepCopy(timeRanges));
            }}
          >
            +1 Week
          </Button>
          <Button
            className='styled-icon-button'
            style={{ margin: 4 }}
            onClick={() => {
              timeRanges[showTimeRange].start = BigInt(currTimeNextHour.valueOf());
              timeRanges[showTimeRange].end = BigInt(currTimeNextHour.valueOf() + 1000 * 60 * 60 * 24 * 30);

              setTimeRanges(deepCopy(timeRanges));
            }}
          >
            +1 Year
          </Button>
          {suggestedTimeRanges?.map(x => {
            return <>

              <Button
                className='styled-icon-button'
                style={{ margin: 4 }}
                onClick={() => {
                  timeRanges[showTimeRange].start = x.start;
                  timeRanges[showTimeRange].end = x.end;

                  setTimeRanges(deepCopy(timeRanges));
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
          value={timeRanges[showTimeRange].start ? moment(new Date(Number(timeRanges[showTimeRange].start))) : null}
          className='primary-text inherit-bg full-width'
          onChange={(_date, dateString) => {
            if (new Date(dateString).valueOf() > new Date(Number(timeRanges[showTimeRange].end)).valueOf()) {
              alert('Start time must be before end time.');
              return;
            }

            timeRanges[showTimeRange].start = BigInt(new Date(dateString).valueOf());

            setTimeRanges(deepCopy(timeRanges));
          }}
        />
        <br />
        <br />
        <b>End Time</b>
        <DatePicker
          showMinute
          showTime
          placeholder='End Date'
          value={timeRanges[showTimeRange].end ? moment(new Date(Number(timeRanges[showTimeRange].end))) : null}
          className='primary-text inherit-bg full-width'
          onChange={(_date, dateString) => {
            if (new Date(dateString).valueOf() < new Date(Number(timeRanges[showTimeRange].start)).valueOf()) {
              alert('End time must be after start time.');
              return;
            }

            timeRanges[showTimeRange].end = BigInt(new Date(dateString).valueOf());

            setTimeRanges(deepCopy(timeRanges));
          }}
        />
        <Divider />
      </>}
    </div >

  </>
}