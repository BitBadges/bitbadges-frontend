import { EditOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { TimelineItem } from 'bitbadgesjs-proto';
import { getCurrentIdxForTimeline } from 'bitbadgesjs-utils';
import { getTimeRangesElement } from '../../utils/dates';

export function TimelineTimesIcon<T extends TimelineItem<bigint>>({ timeline, createNode }: { timeline: T[], createNode: (val: T) => JSX.Element }) {
  const timelineTimes = timeline.map(x => x.timelineTimes);

  if (timelineTimes.length < 1) {

    return <></>
  }

  return <Popover color='black' className="primary-text" content={
    <div style={{ textAlign: 'center', alignItems: 'center', backgroundColor: 'black', color: 'white' }}>
      <p>This is a timeline-based property and is currently set to have different values at different times.</p>
      {timelineTimes.map((x, idx) => {
        return <>
          <div className='flex' style={{ alignItems: 'center' }}>
            <b style={{ marginRight: 4 }}><FieldTimeOutlined style={{ marginLeft: 8, }} /> Time {idx + 1}: </b>{' '}
            {getTimeRangesElement(x, '', true)}
            <br />
          </div>
          <div className='flex' style={{ alignItems: 'center' }}>
            <b style={{ marginRight: 4 }}><EditOutlined style={{ marginLeft: 8 }} /> Value {idx + 1}: </b>{' '}
            {createNode(timeline[idx])}
            <br />
          </div>
          <br />
        </>
      })}
    </div>
  }>
    <FieldTimeOutlined style={{ marginLeft: 8 }} />
  </Popover>
}

export function TimelineFieldWrapper<T extends TimelineItem<bigint>>({ createNode, timeline, emptyNode }: { createNode: (val: T) => JSX.Element, timeline: T[], emptyNode: JSX.Element }) {
  let defaultIdx = -1;
  const managerIdx = getCurrentIdxForTimeline(timeline);
  if (managerIdx >= 0) defaultIdx = Number(managerIdx);

  const timelineTimes = timeline.map(x => x.timelineTimes).flat();
  const currVal = timeline.length > 0 && defaultIdx >= 0 ? timeline[defaultIdx] : undefined;

  return <>
    <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'end', alignItems: 'center' }}>
      <div className='flex-between' style={{ textAlign: 'right', padding: 0 }}>
        {currVal ? createNode(currVal) : emptyNode}
        {timelineTimes.length > 1 && <TimelineTimesIcon timeline={timeline} createNode={createNode} />}
        {timelineTimes.length == 1 && defaultIdx < 0 && <TimelineTimesIcon timeline={timeline} createNode={createNode} />}
      </div>
    </div>
  </>
}
