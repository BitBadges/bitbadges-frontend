import { DeleteOutlined, EditOutlined, FieldTimeOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { Col, Popover } from 'antd';
import { TimelineItem, UintRangeArray, getCurrentIdxForTimeline } from 'bitbadgesjs-sdk';
import { useMemo, useState } from 'react';
import { getTimeRangesElement } from '../../utils/dates';
import IconButton from '../display/IconButton';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { DateSelectWithSwitch } from '../inputs/DateRangeInput';

export function TimelineTimesIcon<T extends TimelineItem<bigint>>({ timeline, createNode }: { timeline: T[]; createNode: (val: T) => JSX.Element }) {
  const timelineTimes = timeline.map((x) => x.timelineTimes);

  if (timelineTimes.length < 1) {
    return <></>;
  }

  return (
    <Popover
      color="black"
      className="primary-text"
      content={
        <div
          style={{
            textAlign: 'center',
            alignItems: 'center',
            backgroundColor: 'black',
            color: 'white'
          }}>
          <p>This is a timeline-based property and is currently set to have different values at different times.</p>
          {timelineTimes.map((x, idx) => {
            return (
              <>
                <div className="flex" style={{ alignItems: 'center' }}>
                  <b style={{ marginRight: 4 }}>
                    <FieldTimeOutlined style={{ marginLeft: 8 }} /> Time {idx + 1}:{' '}
                  </b>{' '}
                  {getTimeRangesElement(x, '', true)}
                  <br />
                </div>
                <div className="flex" style={{ alignItems: 'center' }}>
                  <b style={{ marginRight: 4 }}>
                    <EditOutlined style={{ marginLeft: 8 }} /> Value {idx + 1}:{' '}
                  </b>{' '}
                  {createNode(timeline[idx])}
                  <br />
                </div>
                <br />
              </>
            );
          })}
        </div>
      }>
      <FieldTimeOutlined style={{ marginLeft: 8 }} />
    </Popover>
  );
}

export function TimelineFieldWrapper<T extends TimelineItem<bigint>>({
  createNode,
  timeline,
  emptyNode = <>None</>
}: {
  createNode: (val: T) => JSX.Element;
  timeline: T[];
  emptyNode?: JSX.Element;
}) {
  let defaultIdx = -1;
  const managerIdx = getCurrentIdxForTimeline(timeline);
  if (managerIdx >= 0) defaultIdx = Number(managerIdx);

  const timelineTimes = timeline.map((x) => x.timelineTimes).flat();
  const currVal = timeline.length > 0 && defaultIdx >= 0 ? timeline[defaultIdx] : undefined;

  return (
    <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'end', alignItems: 'center' }}>
      <div className="flex-between" style={{ textAlign: 'right', padding: 0 }}>
        {currVal ? createNode(currVal) : emptyNode}
        {timelineTimes.length > 1 && <TimelineTimesIcon timeline={timeline} createNode={createNode} />}
        {timelineTimes.length == 1 && defaultIdx < 0 && <TimelineTimesIcon timeline={timeline} createNode={createNode} />}
      </div>
    </div>
  );
}

export function TimelineEditor<T extends TimelineItem<bigint>>({
  timeline,
  displayNode,
  setTimeline,
  createNode,
  valueToAdd,
  timelineName,
  emptyValue
}: {
  timeline: T[];
  displayNode: (item: T) => JSX.Element;
  setTimeline: (timeline: T[]) => void;
  createNode: JSX.Element;
  valueToAdd: T;
  timelineName?: string;
  emptyValue: string;
}) {
  const [addIsVisible, setAddIsVisible] = useState(false);
  const [timeRanges, setTimeRanges] = useState<UintRangeArray<bigint>>(UintRangeArray.FullRanges());

  const firstMatchOnlyTimeline: T[] = useMemo(() => {
    const firstMatchOnlyTimeline: T[] = [];
    let diffFromSelected = false;
    for (let i = 0; i < timeline.length; i++) {
      const x = timeline[i];
      let validUintRanges = x.timelineTimes;
      for (const prevTimelineItem of timeline.slice(0, i)) {
        const [remaining, removed] = validUintRanges.getOverlapDetails(prevTimelineItem.timelineTimes);
        validUintRanges = remaining;
        diffFromSelected = diffFromSelected || removed.length > 0;
      }

      if (validUintRanges.length == 0) continue;

      firstMatchOnlyTimeline.push({
        ...x,
        timelineTimes: validUintRanges
      });
    }

    return firstMatchOnlyTimeline;
  }, [timeline]);

  const diffFromSelected = JSON.stringify(firstMatchOnlyTimeline) != JSON.stringify(timeline); //TODO: Compare with custom types

  return (
    <>
      <div className="" style={{ padding: 0 }}>
        <Col xs={0} sm={0} md={24} lg={24} xl={24} xxl={24}>
          <TableRow
            value={
              <div className="primary-text" style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                Times
              </div>
            }
            label={
              <div className="primary-text" style={{ fontSize: 18, fontWeight: 'bold' }}>
                {timelineName ?? 'Value'}
              </div>
            }
            valueSpan={12}
            labelSpan={12}
          />
        </Col>
        {/* <TableRow value={"Times"} label={"Value"} valueSpan={12} labelSpan={12} /> */}
        {timeline.map((x, idx) => {
          return (
            <>
              <Col xs={24} sm={24} md={0} lg={0} xl={0} xxl={0}>
                <div className="flex-center primary-text" style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
                  {timelineName ?? 'Value'} {idx + 1}
                </div>
              </Col>
              <TableRow
                value={
                  <div className="flex-center flex-wrap" style={{ float: 'right', alignItems: 'center' }}>
                    {getTimeRangesElement(x.timelineTimes, '', true)}
                  </div>
                }
                label={
                  <div className="flex-center-if-mobile" style={{ alignItems: 'center' }}>
                    {displayNode(x)}
                  </div>
                }
                valueSpan={12}
                labelSpan={12}
              />
              <div className="flex-center" style={{ alignItems: 'center' }}>
                {idx > 0 && (
                  <IconButton
                    text=""
                    src={<UpOutlined />}
                    onClick={() => {
                      const newTimeline = [...timeline];
                      const temp = newTimeline[idx - 1];
                      newTimeline[idx - 1] = newTimeline[idx];
                      newTimeline[idx] = temp;
                      setTimeline(newTimeline);
                    }}
                  />
                )}
                {idx < timeline.length - 1 && (
                  <IconButton
                    text=""
                    src={<UpOutlined rotate={180} />}
                    onClick={() => {
                      const newTimeline = [...timeline];
                      const temp = newTimeline[idx + 1];
                      newTimeline[idx + 1] = newTimeline[idx];
                      newTimeline[idx] = temp;
                      setTimeline(newTimeline);
                    }}
                  />
                )}
                <IconButton
                  text=""
                  src={<DeleteOutlined />}
                  onClick={() => {
                    setTimeline(
                      timeline.filter((_, idx) => {
                        return idx != timeline.indexOf(x);
                      })
                    );
                  }}
                />
              </div>
              <br />
            </>
          );
        })}
      </div>
      {diffFromSelected && (
        <>
          <div className="secondary-text">
            <span style={{ color: 'red', fontWeight: 'bold' }}>Warning: </span> We do not allow the same time being set for different values. Please
            remove all overlapping times.
          </div>
          <br />
          <div className="flex-center">
            <button
              className="landing-button"
              style={{ width: '100%' }}
              onClick={() => {
                setTimeline(firstMatchOnlyTimeline);
              }}>
              Sort and Remove Overlaps
            </button>
          </div>
          <div className="secondary-text">
            <InfoCircleOutlined /> When sorting, the first value is given priority over the second, and so on.
          </div>
          <br />
        </>
      )}
      <div className="flex-center">
        <IconButton
          src={addIsVisible ? <MinusOutlined /> : <PlusOutlined />}
          onClick={() => {
            setAddIsVisible(!addIsVisible);
          }}
          text={addIsVisible ? 'Hide' : 'Add'}
        />
      </div>
      <br />
      {addIsVisible && (
        <>
          {' '}
          <div className="flex flex-wrap">
            <InformationDisplayCard md={12} xs={24} sm={24} title={`Add ${timelineName ?? 'Value'}`}>
              {createNode}
            </InformationDisplayCard>
            <InformationDisplayCard md={12} xs={24} sm={24} title="Add Times">
              <DateSelectWithSwitch
                timeRanges={timeRanges}
                setTimeRanges={(timeRanges) => {
                  setTimeRanges(timeRanges);
                }}
              />
            </InformationDisplayCard>
          </div>
          <button
            className="landing-button"
            style={{ width: '100%' }}
            disabled={timeRanges.hasOverlaps() || timeRanges.length == 0}
            onClick={() => {
              setAddIsVisible(false);
              setTimeline([
                ...timeline,
                {
                  ...valueToAdd,
                  timelineTimes: timeRanges
                }
              ]);
            }}>
            Add
          </button>
        </>
      )}
      <br />
      <div className="secondary-text">
        <InfoCircleOutlined /> This is a timeline-based property, meaning it can be set to have different values at different times. If there is not a
        value set for a given time, the following value will be used: {emptyValue}.
      </div>
    </>
  );
}
