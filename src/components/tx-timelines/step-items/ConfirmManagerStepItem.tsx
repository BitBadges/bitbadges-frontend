import { Col, Divider } from "antd";
import { checkIfUintRangesOverlap, convertToCosmosAddress, getCurrentValueForTimeline, removeUintRangeFromUintRange } from "bitbadgesjs-utils";
import { useEffect, useState } from "react";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { EmptyStepItem, NEW_COLLECTION_ID, useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";


import { DeleteOutlined, InfoCircleOutlined, MinusOutlined, PlusOutlined, UpOutlined } from "@ant-design/icons";
import { TimelineItem } from 'bitbadgesjs-proto';
import { UintRange } from "blockin/dist/types/verify.types";
import { useAccount } from "../../../bitbadges-api/contexts/accounts/AccountsContext";
import { updateCollection, useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { GO_MAX_UINT_64, getTimeRangesElement } from "../../../utils/dates";
import { AddressDisplay } from "../../address/AddressDisplay";
import { AddressSelect } from "../../address/AddressSelect";
import { DateSelectWithSwitch, PermissionsOverview } from "../../collection-page/PermissionsInfo";
import { DevMode } from "../../common/DevMode";
import IconButton from "../../display/IconButton";
import { InformationDisplayCard } from "../../display/InformationDisplayCard";
import { TableRow } from "../../display/TableRow";
import { SwitchForm } from "../form-items/SwitchForm";
import { UpdateSelectWrapper } from "../form-items/UpdateSelectWrapper";

const AddManagerNode = ({ address, setAddress }: { address: string, setAddress: (address: string) => void }) => {

  return <div style={{ marginBottom: 10, marginTop: 4, display: 'flex', justifyContent: 'center' }}>
    <AddressSelect
      defaultValue={address}
      onUserSelect={(address) => {
        setAddress(address);

      }}
    />
  </div>
}

export function ConfirmManagerStepItem() {
  const chain = useChainContext();


  const collection = useCollection(NEW_COLLECTION_ID);

  const txTimelineContext = useTxTimelineContext();
  const canUpdateManager = txTimelineContext.updateManagerTimeline;
  const setCanUpdateManager = txTimelineContext.setUpdateManagerTimeline;

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? '';
  const signedInAccount = useAccount(chain.address);
  const currentManagerAccount = useAccount(currentManager);

  const [address, setAddress] = useState<string>(currentManagerAccount?.address || signedInAccount?.address || '');
  const [err, setErr] = useState<Error | null>(null);




  useEffect(() => {
    setAddress(currentManagerAccount?.address || signedInAccount?.address || '');
  }, [currentManagerAccount?.address, signedInAccount?.address])

  if (!collection) return EmptyStepItem;

  const hasManager = !!collection.managerTimeline.find(x => x.manager)








  return {
    title: 'Manager',
    disabled: !!err || checkIfUintRangesOverlap(collection.managerTimeline.map(x => x.timelineTimes).flat()),
    description: <>{'The manager is a special role which can have custom admin privileges where applicable. See full list of privileges '}
      <a href="https://docs.bitbadges.io/overview/how-it-works/manager" target="_blank" rel="noopener noreferrer">
        {' '}here.
      </a>
    </>,
    node:
      <UpdateSelectWrapper
        err={err}
        setErr={(err) => { setErr(err) }}
        updateFlag={canUpdateManager}
        setUpdateFlag={setCanUpdateManager}
        jsonPropertyPath="managerTimeline"
        permissionName="canUpdateManager"
        node={

          <div className='primary-text' style={{ padding: '0', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
            <div className='primary-text'
              style={{
                padding: '0',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
              }}
            >
              <SwitchForm
                showCustomOption
                onSwitchChange={(idx) => {
                  if (idx == 0) {
                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      managerTimeline: [],
                    })
                  } else {
                    updateCollection({
                      collectionId: NEW_COLLECTION_ID,
                      managerTimeline: [{
                        manager: convertToCosmosAddress(address),
                        timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                      }],
                    })
                  }
                }}
                options={[{
                  title: 'No Manager',
                  message: <>Do not have a manager for this collection. No admin privileges will ever be available for this collection. <span style={{ fontWeight: 'bold', color: 'orange' }}>All collection details will be frozen and final after this transaction. No manager permissions will be executable moving forward.</span></>,
                  isSelected: !hasManager,
                  additionalNode: <>
                    <div className="flex-center">
                      <PermissionsOverview
                        span={24}
                        collectionId={collection.collectionId}
                      />
                    </div>
                  </>,
                },
                {
                  title: 'Manager',
                  message: <>{'Specify a manager for this collection that can execute admin privileges. You can select which permissions are enabled.'}</>,
                  additionalNode: <>
                    {hasManager && <div>

                      <TimelineEditor
                        timelineName="Manager"
                        valueToAdd={{
                          manager: convertToCosmosAddress(address),
                          timelineTimes: [], //overriden
                        }}
                        timeline={collection.managerTimeline} displayNode={(item) => {
                          return <div className='flex' style={{ alignItems: 'center' }}>
                            <AddressDisplay addressOrUsername={item.manager} />
                          </div>
                        }}
                        createNode={<AddManagerNode address={address} setAddress={setAddress} />}
                        setTimeline={(timeline) => {
                          updateCollection({
                            collectionId: NEW_COLLECTION_ID,
                            managerTimeline: timeline,
                          })
                        }}
                      />

                      <Divider />
                      <div className="flex-center">
                        <PermissionsOverview
                          span={24}
                          tbd
                          collectionId={collection.collectionId}
                        />
                      </div>
                    </div>
                    }
                  </>,
                  isSelected: hasManager,
                },
                ]}
              />
            </div>
            <DevMode obj={collection.managerTimeline} />
          </div >
        }
      />
  }
}

export function TimelineEditor<T extends TimelineItem<bigint>>({
  timeline,
  displayNode,
  setTimeline,
  createNode,
  valueToAdd,
  timelineName

}: {
  timeline: T[],
  displayNode: (item: T) => JSX.Element,
  setTimeline: (timeline: T[]) => void,
  createNode: JSX.Element,
  valueToAdd: T,
  timelineName?: string
}) {
  const [addIsVisible, setAddIsVisible] = useState(false);
  const [timeRanges, setTimeRanges] = useState<UintRange<bigint>[]>([{ start: 1n, end: GO_MAX_UINT_64 }]);

  let firstMatchOnlyTimeline: T[] = [];
  let diffFromSelected = false;
  for (let i = 0; i < timeline.length; i++) {
    const x = timeline[i];
    let validUintRanges = x.timelineTimes;
    for (const prevTimelineItem of timeline.slice(0, i)) {
      const [remaining, removed] = removeUintRangeFromUintRange(prevTimelineItem.timelineTimes, validUintRanges);
      validUintRanges = remaining;
      diffFromSelected = diffFromSelected || removed.length > 0;
    }

    if (validUintRanges.length == 0) continue;

    firstMatchOnlyTimeline.push({
      ...x,
      timelineTimes: validUintRanges,
    })
  }



  return <>
    <div className='' style={{ padding: 0 }}>
      <Col xs={0} sm={0} md={24} lg={24} xl={24} xxl={24}>
        <TableRow value={<div className="primary-text" style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Times</div>} label={<div className="primary-text" style={{ fontSize: 18, fontWeight: 'bold' }}>{timelineName ?? "Value"}</div>} valueSpan={12} labelSpan={12} />
      </Col>
      {/* <TableRow value={"Times"} label={"Value"} valueSpan={12} labelSpan={12} /> */}
      {timeline.map((x, idx) => {



        return <>
          <Col xs={24} sm={24} md={0} lg={0} xl={0} xxl={0}>
            <div className="flex-center primary-text" style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
              {timelineName ?? "Value"} {idx + 1}
            </div>
          </Col>
          <TableRow value={
            <div className="flex-center flex-wrap" style={{ float: 'right', alignItems: 'center' }}>
              {getTimeRangesElement(x.timelineTimes, '', true)}
            </div>} label={
              <div className="flex-center-if-mobile" style={{ alignItems: 'center' }}>
                {displayNode(x)}
              </div>} valueSpan={12} labelSpan={12} />
          <div className="flex-center" style={{ alignItems: 'center' }}>
            {idx > 0 && <IconButton
              text=''
              src={<UpOutlined />} onClick={() => {
                const newTimeline = [...timeline];
                const temp = newTimeline[idx - 1];
                newTimeline[idx - 1] = newTimeline[idx];
                newTimeline[idx] = temp;
                setTimeline(newTimeline);
              }
              } />}
            {idx < timeline.length - 1 && <IconButton
              text=''
              src={<UpOutlined rotate={180} />} onClick={() => {
                const newTimeline = [...timeline];
                const temp = newTimeline[idx + 1];
                newTimeline[idx + 1] = newTimeline[idx];
                newTimeline[idx] = temp;
                setTimeline(newTimeline);
              }
              } />}
            <IconButton
              text=''
              src={<DeleteOutlined />} onClick={() => {
                setTimeline(timeline.filter((_, idx) => {
                  return idx != timeline.indexOf(x);
                }))
              }} />
          </div>
          <br />
        </>
      })}
    </div>
    {diffFromSelected && <>
      <div className="secondary-text" >
        <span style={{ color: 'red', fontWeight: 'bold' }}>Warning: </span> We do not allow the same time being set for different values.
        Please remove all overlapping times.
      </div>
      <br />
      <div className="flex-center">
        <button className="landing-button" style={{ width: '100%' }} onClick={() => {

          setTimeline(firstMatchOnlyTimeline);
        }}>
          Sort and Remove Overlaps
        </button>

      </div>
      <div className="secondary-text" >
        <InfoCircleOutlined /> When sorting, the first value is given priority over the second, and so on.
      </div>
      <br />
    </>}
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
    {addIsVisible && <> <div className="flex flex-wrap">

      <InformationDisplayCard md={12} xs={24} sm={24} title={`Add ${timelineName ?? 'Value'}`} subtitle="">
        {createNode}
      </InformationDisplayCard>
      <InformationDisplayCard
        md={12} xs={24} sm={24}
        title="Add Times" subtitle="">
        <DateSelectWithSwitch timeRanges={timeRanges} setTimeRanges={(timeRanges) => {
          setTimeRanges(timeRanges);
        }} />
      </InformationDisplayCard>
    </div>
      <button className="landing-button" style={{ width: '100%' }}

        disabled={checkIfUintRangesOverlap(timeRanges) || timeRanges.length == 0}
        onClick={() => {
          setAddIsVisible(false);
          setTimeline([...timeline, {
            ...valueToAdd,
            timelineTimes: timeRanges,
          }])
        }}>
        Add
      </button>

    </>}
    <br />
    <div className="secondary-text" >
      <InfoCircleOutlined /> This is a timeline-based property, meaning it can be set to have different values at different times.
    </div>
  </>

}