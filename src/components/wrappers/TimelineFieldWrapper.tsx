import { ClockCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { TimelineItem } from 'bitbadgesjs-proto';
import { useState } from 'react';
import { getTimeRangesString } from '../../utils/dates';
import { getCurrentValueIdxForTimeline } from 'bitbadgesjs-utils';

export function TimelineTimesIcon({ timeline, currIdx, setCurrIdx }: { timeline: TimelineItem<bigint>[], currIdx: number, setCurrIdx: (x: number) => void }) {
  const timelineTimes = timeline.map(x => x.timelineTimes);

  if (timelineTimes.length <= 1) {
    return <></>
  }

  return <Tooltip color='black' title={
    <div>
      {timelineTimes.map((x, idx) => {
        return <>
          <div className='flex-center'>
            <ClockCircleOutlined style={{ marginLeft: 8 }} />
            {getTimeRangesString(x, '', true)}
            {idx === currIdx && <>(current)</>}
            {idx !== currIdx && <SwapOutlined style={{ cursor: 'pointer' }} onClick={
              () => {
                setCurrIdx(idx);
              }
            } />}
          </div>
        </>
      })}
    </div>
  }>
    <ClockCircleOutlined style={{ marginLeft: 8 }} />
  </Tooltip>
}

export function TimelineFieldWrapper<T extends TimelineItem<bigint>>({ createNode, timeline, emptyNode }: { createNode: (val: T) => JSX.Element, timeline: T[], emptyNode: JSX.Element }) {
  let defaultIdx = 0;
  const managerIdx = getCurrentValueIdxForTimeline(timeline);
  if (managerIdx >= 0) defaultIdx = Number(managerIdx);

  const [currIdx, setCurrIdx] = useState<number>(defaultIdx);

  if (timeline.length === 0) return emptyNode;

  const timelineTimes = timeline.map(x => x.timelineTimes).flat();
  const currVal = timeline[currIdx];

  return <>
    <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'end', alignItems: 'center' }}>
      <div className='flex-between flex-column' style={{ textAlign: 'right', padding: 0 }}>
        {currVal ? createNode(currVal) : emptyNode}
        {timelineTimes.length > 1 && <TimelineTimesIcon timeline={timeline} currIdx={currIdx} setCurrIdx={setCurrIdx} />}
      </div>
    </div>
  </>
}
