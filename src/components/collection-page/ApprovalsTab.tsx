import { ClockCircleOutlined, DownOutlined, FieldTimeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Divider, Empty, Select, Tooltip, Typography } from 'antd';
import { AddressMapping, ApprovalTrackerIdDetails } from 'bitbadgesjs-proto';
import { BitBadgesCollection, CollectionApprovedTransferTimelineWithDetails, CollectionApprovedTransferWithDetails, NumberType, UserApprovedIncomingTransferTimelineWithDetails, UserApprovedIncomingTransferWithDetails, UserApprovedOutgoingTransferTimelineWithDetails, UserApprovedOutgoingTransferWithDetails, appendDefaultForIncoming, appendDefaultForOutgoing, castIncomingTransfersToCollectionTransfers, castOutgoingTransfersToCollectionTransfers, getCurrentIdxForTimeline, getFirstMatchForUserIncomingApprovedTransfers, getFirstMatchForUserOutgoingApprovedTransfers, getReservedAddressMapping } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE, NODE_URL } from '../../constants';
import { GO_MAX_UINT_64, getTimeRangesElement } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { Tabs } from '../navigation/Tabs';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { TransferabilityRow, getTableHeader } from './TransferabilityRow';


export const getApprovalsDisplay = (timeline:
  UserApprovedIncomingTransferTimelineWithDetails<bigint>[] | UserApprovedOutgoingTransferTimelineWithDetails<bigint>[]
  | CollectionApprovedTransferTimelineWithDetails<bigint>[], convertedFirstMatches: CollectionApprovedTransferWithDetails<bigint>[], defaultOutgoingIdx: number, setDefaultOutgoingIdx: (idx: number) => void, collection: BitBadgesCollection<bigint>, badgeId?: bigint,
  isClaimSelect?: boolean
  ) => {
  return <> {collection && ((timeline.length > 1)) ?
    <>
      <Select
        className="selector primary-text primary-blue-bg"
        style={{ marginLeft: 4 }}
        defaultValue={defaultOutgoingIdx}
        onChange={(value) => {
          setDefaultOutgoingIdx(Number(value));
        }}
        suffixIcon={
          <DownOutlined
            className='primary-text'
          />
        }
      >
        {timeline.map((timeline, idx) => {
          return <Select.Option key={idx} value={idx}>{getTimeRangesElement(timeline.timelineTimes, '', true)}</Select.Option>
        })}
      </Select>
      <br />
      <br />
    </> : <> </>
  }



    {/* //TODO:  User permissions */}
    {/* <Divider />
<p>Note: Go to permissions on the overview tab to see if these currently set values can be changed or not by the manager.</p> */}
    <br />
    <div className='flex-between' style={{ overflow: 'auto' }}>

      <table style={{ width: '100%', fontSize: 16 }}>
        {getTableHeader()}
        <br />
        {
          convertedFirstMatches.map((x, idx) => {
            const result = <TransferabilityRow transfer={x} key={idx} badgeId={badgeId} collectionId={collection.collectionId} />
            return result
          })
        }
      </table>
    </div>
  </>
}


export function UserApprovalsTab({ collectionId,
  badgeId, isIncomingApprovalEdit, isOutgoingApprovalEdit,
  userApprovedIncomingTransfers, userApprovedOutgoingTransfers,
  setUserApprovedIncomingTransfers,
  // setUserApprovedOutgoingTransfers //We never use this
}: {
  collectionId: bigint,
  badgeId?: bigint,
  isIncomingApprovalEdit?: boolean,
  isOutgoingApprovalEdit?: boolean,
  userApprovedIncomingTransfers?: UserApprovedIncomingTransferTimelineWithDetails<bigint>[],
  userApprovedOutgoingTransfers?: UserApprovedOutgoingTransferTimelineWithDetails<bigint>[],
  setUserApprovedIncomingTransfers?: (approvedIncomingTransfers: UserApprovedIncomingTransferTimelineWithDetails<bigint>[]) => void,
  // setUserApprovedOutgoingTransfers?: (approvedOutgoingTransfers: UserApprovedOutgoingTransferTimelineWithDetails<bigint>[]) => void,
}) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];

  const accounts = useAccountsContext();
  const [address, setAddress] = useState<string>(chain.address);

  const [tab, setTab] = useState<string>(isIncomingApprovalEdit ? 'incoming' : 'outgoing');

  const approverAccount = address ? accounts.getAccount(address) : undefined;
  const approvedOutgoingTransfersTimeline = userApprovedOutgoingTransfers ? userApprovedOutgoingTransfers :
    collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.approvedOutgoingTransfersTimeline ?? [];
  const approvedIncomingTransfersTimeline = userApprovedIncomingTransfers ? userApprovedIncomingTransfers :
    collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.approvedIncomingTransfersTimeline ?? [];
  const updateHistory = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.updateHistory ?? [];

  const currOutgoingTransferabilityIdx = getCurrentIdxForTimeline(approvedOutgoingTransfersTimeline);
  const currIncomingTransferabilityIdx = getCurrentIdxForTimeline(approvedIncomingTransfersTimeline);


  const [defaultOutgoingIdx, setDefaultOutgoingIdx] = useState<number>(Number(currOutgoingTransferabilityIdx));
  const [defaultIncomingIdx, setDefaultIncomingIdx] = useState<number>(Number(currIncomingTransferabilityIdx));
  // const [approvedIncomingUsers, setApprovedIncomingUsers] = useState<string[]>([]);

  // const [showAllPossible, setShowAllPossible] = useState<boolean>(true);
  const showAllPossible = true;


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch trackers a');

    if (collectionId > 0) {
      const approvedOutgoingTransfersTimeline = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.approvedOutgoingTransfersTimeline ?? [];
      const approvedIncomingTransfersTimeline = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.approvedIncomingTransfersTimeline ?? [];

      setDefaultIncomingIdx(Number(getCurrentIdxForTimeline(approvedIncomingTransfersTimeline)));
      setDefaultOutgoingIdx(Number(getCurrentIdxForTimeline(approvedOutgoingTransfersTimeline)));
    }
  }, [collectionId, approvedIncomingTransfersTimeline, approvedOutgoingTransfersTimeline]);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch trackers a');

    if (collectionId <= 0) {
      return;
    }

    function fetchTrackers(approvedTransfersTimeline: UserApprovedIncomingTransferTimelineWithDetails<bigint>[] | UserApprovedOutgoingTransferTimelineWithDetails<bigint>[], approvalLevel: string) {
      const idx = getCurrentIdxForTimeline(approvedTransfersTimeline);
      const defaultIdx = idx < 0 ? 0 : idx;

      if (collection && approvedTransfersTimeline.length > 0) {
        const approvedTransfersCasted = approvalLevel === "outgoing" ?
          (approvedTransfersTimeline[Number(defaultIdx)] as any).approvedOutgoingTransfers as UserApprovedOutgoingTransferWithDetails<bigint>[]
          : (approvedTransfersTimeline[Number(defaultIdx)] as any).approvedIncomingTransfers as UserApprovedIncomingTransferWithDetails<bigint>[];

        const approvedTransfers = (approvedTransfersCasted as UserApprovedIncomingTransferWithDetails<bigint>[]).filter(x => x.approvalDetails.length > 0)

        const approvalsIdsToFetch = approvedTransfers.flatMap(approvedTransfer => {
          const approvalTrackerId = approvedTransfer.approvalDetails[0].approvalTrackerId;
          return [
            {
              collectionId,
              approvalTrackerId,
              approvalLevel,
              approvedAddress: "",
              approverAddress: approverAccount?.cosmosAddress,
              trackerType: "overall",
            },
            {
              collectionId,
              approvalTrackerId,
              approvalLevel,
              approvedAddress: chain.cosmosAddress,
              approverAddress: approverAccount?.cosmosAddress,
              trackerType: "initiatedBy",
            },
            {
              collectionId,
              approvalTrackerId,
              approvalLevel,
              approvedAddress: chain.cosmosAddress,
              approverAddress: approverAccount?.cosmosAddress,
              trackerType: "to",
            },
            {
              collectionId,
              approvalTrackerId,
              approvalLevel,
              approvedAddress: chain.cosmosAddress,
              approverAddress: approverAccount?.cosmosAddress,
              trackerType: "from",
            },
          ] as ApprovalTrackerIdDetails<NumberType>[]
        });

        return approvalsIdsToFetch
      }

      return [];
    }

    const outgoingArr = fetchTrackers(approvedOutgoingTransfersTimeline, "outgoing");
    const incomingArr = fetchTrackers(approvedIncomingTransfersTimeline, "incoming");
    collections.fetchCollectionsWithOptions([{
      collectionId,
      viewsToFetch: [],
      merkleChallengeIdsToFetch: [],
      approvalsTrackerIdsToFetch: [...outgoingArr, ...incomingArr],
      handleAllAndAppendDefaults: true,
    }]);
  }, [address, chain.cosmosAddress, collectionId]);


  if (!collection) return <></>;

  console.log(defaultOutgoingIdx, defaultIncomingIdx, approvedOutgoingTransfersTimeline, approvedIncomingTransfersTimeline, approverAccount);
  const firstOutgoingMatches = !approverAccount?.cosmosAddress ? [] : getFirstMatchForUserOutgoingApprovedTransfers(appendDefaultForOutgoing(
    (defaultOutgoingIdx < 0 || defaultOutgoingIdx >= approvedOutgoingTransfersTimeline.length) ? [] : approvedOutgoingTransfersTimeline[Number(defaultOutgoingIdx)].approvedOutgoingTransfers, approverAccount?.cosmosAddress ?? ''), approverAccount?.cosmosAddress ?? '', showAllPossible);
  const firstIncomingMatches = !approverAccount?.cosmosAddress ? [] : getFirstMatchForUserIncomingApprovedTransfers(appendDefaultForIncoming(
    (defaultIncomingIdx < 0 || defaultIncomingIdx >= approvedIncomingTransfersTimeline.length) ? [] : approvedIncomingTransfersTimeline[Number(defaultIncomingIdx)].approvedIncomingTransfers, approverAccount?.cosmosAddress ?? ''), approverAccount?.cosmosAddress ?? '', showAllPossible);

  const convertedFirstOutgoingMatches = approverAccount?.cosmosAddress ? castOutgoingTransfersToCollectionTransfers(firstOutgoingMatches, approverAccount?.cosmosAddress ?? '') : [];
  const convertedFirstIncomingMatches = approverAccount?.cosmosAddress ? castIncomingTransfersToCollectionTransfers(firstIncomingMatches, approverAccount?.cosmosAddress ?? '') : []

  const tabInfo = [

    {
      key: 'outgoing',
      content: <>Outgoing Approvals</>
    },
    {
      key: 'incoming',
      content: <>Incoming Approvals</>
    },

  ];

  if (!isIncomingApprovalEdit && !isOutgoingApprovalEdit) {
    tabInfo.push({

      key: 'history',
      content: <>Update History</>

    })
  }

  return (<>
    <div className='primary-text'>
      {!(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <>
        <Typography.Text className='primary-text' strong style={{ fontSize: 22 }}>Showing approvals for:</Typography.Text>
        <AddressDisplay
          addressOrUsername={address}
          fontSize={16}
        />
        <AddressSelect
          defaultValue={chain.address}
          onUserSelect={(value) => {
            setAddress(value);
          }}

        />
        <br />
      </>}
      {!(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <>
        <Tabs
          fullWidth
          tab={tab}
          theme='dark'
          setTab={setTab}
          tabInfo={tabInfo}
        /></>}

      {tab === 'history' && <div className='primary-text'>
        <br />
        <InfoCircleOutlined />{' '}This is a history of all the blockchain transactions where the user updated their approvals.
        <br />

        {updateHistory.map((update, i) => {
          return <div key={i} style={{ textAlign: 'left' }} className='primary-text'>
            <Typography.Text strong className='primary-text' style={{ fontSize: '1.2em' }}>
              <ClockCircleOutlined style={{ marginRight: '5px' }} />
              {new Date(Number(update.blockTimestamp)).toLocaleString()}
              {' '}(Block #{update.block.toString()})
            </Typography.Text>
            {update.txHash &&
              <p>Blockchain Transaction Hash: <a href={NODE_URL + '/cosmos/tx/v1beta1/txs/' + update.txHash} target='_blank' rel='noopener noreferrer'>
                {update.txHash}
              </a></p>
            }
            <Divider />
          </div>
        })}
        {updateHistory.length === 0 && <div>
          <Empty
            className='primary-text'
            description={<>
              <Typography.Text strong className='primary-text'>
                This user has never updated their approvals.
              </Typography.Text>
            </>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>}
      </div>}


      {tab === 'outgoing' && <>
        {/* <br /> */}
        <Typography.Text className='primary-text' strong style={{ fontSize: 24 }}>
          {collection && ((approvedOutgoingTransfersTimeline.length > 1)) &&
            <Tooltip color='black' title="The transferability for this collection is scheduled to have different set values at different times.">
              Outgoing Approvals <FieldTimeOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          }
        </Typography.Text>
        {getApprovalsDisplay(approvedOutgoingTransfersTimeline, convertedFirstOutgoingMatches, defaultOutgoingIdx, setDefaultOutgoingIdx, collection, badgeId)}
      </>}

      {tab === 'incoming' && <>
        <Typography.Text className='primary-text' strong style={{ fontSize: 24 }}>
          {collection && ((approvedIncomingTransfersTimeline.length > 1)) ?
            <Tooltip color='black' title="The transferability for this collection is scheduled to have different set values at different times.">
              Incoming Approvals <FieldTimeOutlined style={{ marginLeft: 4 }} />
            </Tooltip> : <> </>
          }
        </Typography.Text>
        {getApprovalsDisplay(approvedIncomingTransfersTimeline, convertedFirstIncomingMatches, defaultIncomingIdx, setDefaultIncomingIdx, collection, badgeId)}
      </>}
    </div>
    <div className='primary-text'>
      {tab !== 'history' && !(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <>      <Divider />
        <p>
          <InfoCircleOutlined />{' '}Approvals are broken down into multiple criteria: who can send? who can receive? etc.
          Each row represents a different set of criteria. For a transfer to be allowed, ALL of the criteria in the row must be satisfied. If transfers span multiple rows, they must satisfy ALL criteria in ALL the spanned rows.
        </p>
        <br />
        <p>
          <InfoCircleOutlined />{' '} Note that user level approvals can be overriden by the collection-level transferability.
        </p>
      </>}
      {(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <Divider />}

      {isIncomingApprovalEdit && tab === 'incoming' && <><SwitchForm
        options={[
          {
            title: 'Approve All',
            message: 'Approve any incoming transfer for this collection.',
            isSelected: (userApprovedIncomingTransfers ?? [])?.length > 0,
          },
          {
            title: 'Must Initiate',
            message: 'Only approve incoming transfers that were initiated by you.',
            isSelected: userApprovedIncomingTransfers?.length === 0,
          }
        ]
        }
        onSwitchChange={(value) => {
          if (value === 0) {
            setUserApprovedIncomingTransfers?.([
              {
                timelineTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                approvedIncomingTransfers: [{
                  fromMappingId: "AllWithMint",
                  fromMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                  initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
                  initiatedByMappingId: "AllWithMint",
                  transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
                  allowedCombinations: [{
                    isApproved: true,
                    initiatedByMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                    fromMappingOptions: { invertDefault: false, allValues: false, noValues: false },
                    badgeIdsOptions: { invertDefault: false, allValues: false, noValues: false },
                    ownershipTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                    transferTimesOptions: { invertDefault: false, allValues: false, noValues: false },
                  }],
                  approvalDetails: []
                }]
              }
            ]);

          } else if (value === 1) {
            setUserApprovedIncomingTransfers?.([]);
          }
        }}
      />
        {/* 
        TODO: Add speicifc users
        
        {userApprovedIncomingTransfers?.length === 1 && <>
          <Divider />
          <AddressListSelect
            users={approvedIncomingUsers}
            setUsers={setApprovedIncomingUsers}
          />
        </>} */}
      </>}
    </div >
  </>
  );
}
