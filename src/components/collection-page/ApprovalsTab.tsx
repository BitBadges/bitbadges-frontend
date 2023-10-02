import { ClockCircleOutlined, DeleteOutlined, DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import { Avatar, Divider, Empty, Switch, Typography } from 'antd';
import { AddressMapping, ApprovalTrackerIdDetails, NumberType, deepCopy } from 'bitbadgesjs-proto';
import { BitBadgesCollection, CollectionApprovedTransferWithDetails, UserApprovedIncomingTransferWithDetails, UserApprovedOutgoingTransferWithDetails, appendDefaultForIncoming, appendDefaultForOutgoing, castCollectionApprovedTransferToUniversalPermission, castIncomingTransfersToCollectionTransfers, castOutgoingTransfersToCollectionTransfers, getFirstMatchForCollectionApprovedTransfers, getFirstMatchForUserIncomingApprovedTransfers, getFirstMatchForUserOutgoingApprovedTransfers, getReservedAddressMapping, isInAddressMapping, universalRemoveOverlaps } from 'bitbadgesjs-utils';
import { FC, useEffect, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { INFINITE_LOOP_MODE, NODE_URL } from '../../constants';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { Tabs } from '../navigation/Tabs';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { TransferabilityRow, getTableHeader } from './TransferabilityRow';
interface Props {
  convertedFirstMatches: CollectionApprovedTransferWithDetails<bigint>[];
  collection: BitBadgesCollection<bigint>;
  badgeId?: bigint;
  filterFromMint?: boolean;
  showIgnored?: boolean;
}

const getPreviousOverlaps = (approvedTransfersToAdd: CollectionApprovedTransferWithDetails<bigint>[], idx: number) => {
  const x = approvedTransfersToAdd[idx];
  const prevTransferability: CollectionApprovedTransferWithDetails<bigint>[] = deepCopy(approvedTransfersToAdd.slice(0, idx));
  const expandedTransferability: CollectionApprovedTransferWithDetails<bigint>[] = [];
  for (const transferability of prevTransferability) {
    for (const combination of transferability.allowedCombinations) {
      expandedTransferability.push({
        ...transferability,
        allowedCombinations: [combination],
      });
    }
  }

  const firstMatches = getFirstMatchForCollectionApprovedTransfers(expandedTransferability);

  let orig = castCollectionApprovedTransferToUniversalPermission(firstMatches).map((y, idx) => {
    return {
      badgeId: y.defaultValues.badgeIds[0],
      ownershipTime: y.defaultValues.ownershipTimes[0],
      transferTime: y.defaultValues.transferTimes[0],
      fromMapping: y.defaultValues.fromMapping,
      initiatedByMapping: y.defaultValues.initiatedByMapping,
      toMapping: y.defaultValues.toMapping,
      approvalTrackerIdMapping: y.defaultValues.approvalTrackerIdMapping,
      challengeTrackerIdMapping: y.defaultValues.challengeTrackerIdMapping,
      timelineTime: { start: 1n, end: 1n },

      permittedTimes: y.defaultValues.permittedTimes,
      forbiddenTimes: y.defaultValues.forbiddenTimes,

      arbitraryValue: {
        approvalDetails: firstMatches[idx].approvalDetails,
        allowedCombinations: firstMatches[idx].allowedCombinations,
        approvalId: firstMatches[idx].approvalId,
        approvalTrackerId: firstMatches[idx].approvalTrackerId,
        challengeTrackerId: firstMatches[idx].challengeTrackerId,
      }
    }
  })

  const filteredVal = castCollectionApprovedTransferToUniversalPermission([x])[0];
  const newVals = [];
  for (const origItem of orig) {
    const [, removed] = universalRemoveOverlaps(
      {
        badgeId: filteredVal.defaultValues.badgeIds[0],
        ownershipTime: filteredVal.defaultValues.ownershipTimes[0],
        transferTime: filteredVal.defaultValues.transferTimes[0],
        fromMapping: filteredVal.defaultValues.fromMapping,
        initiatedByMapping: filteredVal.defaultValues.initiatedByMapping,
        toMapping: filteredVal.defaultValues.toMapping,
        approvalTrackerIdMapping: filteredVal.defaultValues.approvalTrackerIdMapping,
        challengeTrackerIdMapping: filteredVal.defaultValues.challengeTrackerIdMapping,
        timelineTime: { start: 1n, end: 1n },

        permittedTimes: filteredVal.defaultValues.permittedTimes,
        forbiddenTimes: filteredVal.defaultValues.forbiddenTimes,

        arbitraryValue: {
          approvalDetails: x.approvalDetails,
          approvalId: x.approvalId,
          approvalTrackerId: x.approvalTrackerId,
          challengeTrackerId: x.challengeTrackerId,
        }
      },
      origItem
    )

    newVals.push(...removed);
  }

  orig = newVals;


  // const merged = MergeUniversalPermissionDetails(orig);

  const newApprovedTransfers: CollectionApprovedTransferWithDetails<bigint>[] = [];
  for (const match of orig) {
    newApprovedTransfers.push({
      fromMapping: match.fromMapping,
      fromMappingId: match.fromMapping.mappingId,
      toMapping: match.toMapping,
      toMappingId: match.toMapping.mappingId,
      initiatedByMapping: match.initiatedByMapping,
      initiatedByMappingId: match.initiatedByMapping.mappingId,

      badgeIds: [match.badgeId],
      transferTimes: [match.transferTime],
      ownershipTimes: [match.ownershipTime],

      approvalId: match.arbitraryValue.approvalId,
      approvalTrackerId: match.arbitraryValue.approvalTrackerId,
      challengeTrackerId: match.arbitraryValue.challengeTrackerId,


      //TODO: if broken down via first match only, the same approval details may be duplicated across multiple matches (so predeterminedBalances, approvalAmounts, etc. may be weird)
      approvalDetails: match.arbitraryValue.approvalDetails,
      allowedCombinations: match.arbitraryValue.allowedCombinations,
    })
  }

  return newApprovedTransfers;
}

export const ApprovalsDisplay: FC<Props> = ({ convertedFirstMatches, collection, badgeId, filterFromMint, showIgnored }) => {
  const [showOnlyFirstMatch, setShowOnlyFirstMatch] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(true);

  const txTimelineContext = useTxTimelineContext();
  let approvedTransfersToAdd = deepCopy(txTimelineContext.approvedTransfersToAdd);
  let toShowIgnored = showIgnored ?? false;

  if (!editMode) {
    approvedTransfersToAdd = getFirstMatchForCollectionApprovedTransfers(approvedTransfersToAdd, !showOnlyFirstMatch);
    approvedTransfersToAdd = approvedTransfersToAdd.filter(x => isInAddressMapping(x.fromMapping, 'Mint')).map(x => {
      return {
        ...x,
        fromMappingId: 'Mint',
        fromMapping: getReservedAddressMapping('Mint', '') as AddressMapping,
      }
    });
  }

  return <>
    <div>
      <div className='flex-between'>
        <div>
        </div>
        {showIgnored && <div>
          {!editMode &&
            <div style={{ float: 'right', margin: 8 }}>
              <Switch
                checkedChildren="Show Allowed Only"
                unCheckedChildren="Show All"
                checked={showOnlyFirstMatch}
                onChange={() => setShowOnlyFirstMatch(!showOnlyFirstMatch)}
              />
            </div>}
          <div style={{ float: 'right', margin: 8 }}>
            <Switch
              checkedChildren="Edit Mode"
              unCheckedChildren="Read Mode"
              checked={editMode}
              onChange={() => setEditMode(!editMode)}
            />
          </div>
        </div>}
      </div>
      <br />
      <br />
      <div className='flex-between' style={{ overflow: 'auto' }}>

        <table style={{ width: '100%', fontSize: 16 }}>
          {getTableHeader()}
          <br />
          {
            !toShowIgnored && convertedFirstMatches.map((x, idx) => {
              const result = <TransferabilityRow transfer={x} key={idx} badgeId={badgeId} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
              return result
            })
          }
          {
            toShowIgnored && approvedTransfersToAdd.length === 0 && <tr style={{ borderBottom: '1px solid #f0f0f0' }}></tr>
          }

          {
            toShowIgnored && approvedTransfersToAdd.length > 0 && approvedTransfersToAdd.map((x, idx) => {
              const newApprovedTransfers = getPreviousOverlaps(approvedTransfersToAdd, idx);

              if (toShowIgnored) {
                return <>
                  <tr style={{}}>
                    <td colSpan={1000} style={{ textAlign: 'center' }} className='primary-text'>
                      <div className='flex-between full-width'>
                        <div>

                          <b>Distribution Criteria #{idx + 1}</b>
                          {idx < approvedTransfersToAdd.length - 1 && approvedTransfersToAdd.length > 1 && editMode &&
                            <Avatar
                              className='primary-text styled-button'
                              style={{ cursor: 'pointer', margin: 8 }}
                              src={<DownOutlined />}
                              onClick={() => {
                                const newApprovedTransfers = [...approvedTransfersToAdd];
                                //Shift this down
                                newApprovedTransfers.splice(idx + 1, 0, newApprovedTransfers.splice(idx, 1)[0]);
                                txTimelineContext.setApprovedTransfersToAdd(newApprovedTransfers);
                              }}
                            />}


                          {idx > 0 && approvedTransfersToAdd.length > 1 && editMode &&
                            <Avatar
                              className='primary-text styled-button'
                              style={{ cursor: 'pointer', margin: 8 }}
                              src={<UpOutlined />}
                              onClick={() => {
                                const newApprovedTransfers = [...approvedTransfersToAdd];
                                //Shift this up
                                newApprovedTransfers.splice(idx - 1, 0, newApprovedTransfers.splice(idx, 1)[0]);
                                txTimelineContext.setApprovedTransfersToAdd(newApprovedTransfers);
                              }}
                            />}

                        </div>
                        <div>

                          {editMode &&
                            <Avatar
                              className='primary-text styled-button'
                              style={{ cursor: 'pointer', margin: 4 }}
                              src={<DeleteOutlined />}
                              onClick={() => {
                                const newApprovedTransfers = [...approvedTransfersToAdd];
                                newApprovedTransfers.splice(idx, 1);
                                txTimelineContext.setApprovedTransfersToAdd(newApprovedTransfers);
                              }}
                            />}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <br />
                  <TransferabilityRow transfer={x} key={idx} badgeId={badgeId} collectionId={collection.collectionId} filterFromMint={filterFromMint} noBorder />
                  <Divider />

                  <tr>
                    {newApprovedTransfers.length > 0 && <>
                      <td colSpan={1000} style={{ textAlign: 'center', color: 'orange' }} className='primary-text'>

                        WARNING: The following combo(s) are overwritten because a prior approval already exists for the same criteria, and we take first-match only.
                        <br />
                        If this is not okay, you can reorder the approvals to prioritize one over the other or restructure to prevent overlaps.
                      </td>
                    </>}

                  </tr>
                  {newApprovedTransfers.map((y, idx) => {
                    return <TransferabilityRow transfer={y} key={idx} badgeId={badgeId} collectionId={collection.collectionId} filterFromMint={filterFromMint} ignoreRow />
                  })}
                  <tr className='full-width' style={{ borderBottom: '1px solid #f0f0f0' }}></tr>
                  <br />
                </>
              }
            })
          }
        </table>
      </div >
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
  userApprovedIncomingTransfers?: UserApprovedIncomingTransferWithDetails<bigint>[],
  userApprovedOutgoingTransfers?: UserApprovedOutgoingTransferWithDetails<bigint>[],
  setUserApprovedIncomingTransfers?: (approvedIncomingTransfers: UserApprovedIncomingTransferWithDetails<bigint>[]) => void,
  // setUserApprovedOutgoingTransfers?: (approvedOutgoingTransfers: UserApprovedOutgoingTransferWithDetails<bigint>[]) => void,
}) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];

  const accounts = useAccountsContext();
  const [address, setAddress] = useState<string>(chain.address);

  const [tab, setTab] = useState<string>(isIncomingApprovalEdit ? 'incoming' : 'outgoing');

  const approverAccount = address ? accounts.getAccount(address) : undefined;
  const approvedOutgoingTransfers = userApprovedOutgoingTransfers ? userApprovedOutgoingTransfers :
    collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.approvedOutgoingTransfers ?? [];
  const approvedIncomingTransfers = userApprovedIncomingTransfers ? userApprovedIncomingTransfers :
    collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.approvedIncomingTransfers ?? [];
  const updateHistory = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.updateHistory ?? [];

  const showAllPossible = true;



  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch trackers a');

    if (collectionId <= 0) {
      return;
    }

    function fetchTrackers(_approvedTransfers: UserApprovedIncomingTransferWithDetails<bigint>[] | UserApprovedOutgoingTransferWithDetails<bigint>[], approvalLevel: string) {

      if (collection && _approvedTransfers.length > 0) {
        const approvedTransfersCasted = approvalLevel === "outgoing" ?
          _approvedTransfers as UserApprovedOutgoingTransferWithDetails<bigint>[]
          : _approvedTransfers as UserApprovedIncomingTransferWithDetails<bigint>[];

        const approvedTransfers = (approvedTransfersCasted as UserApprovedIncomingTransferWithDetails<bigint>[]).filter(x => x.approvalTrackerId);

        const approvalsIdsToFetch = approvedTransfers.flatMap(approvedTransfer => {
          const approvalTrackerId = approvedTransfer.approvalTrackerId;
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
        }).flat();

        return approvalsIdsToFetch
      }

      return [];
    }

    const outgoingArr = fetchTrackers(approvedOutgoingTransfers, "outgoing");
    const incomingArr = fetchTrackers(approvedIncomingTransfers, "incoming");
    collections.fetchCollectionsWithOptions([{
      collectionId,
      viewsToFetch: [],
      merkleChallengeIdsToFetch: [],
      approvalsTrackerIdsToFetch: [...outgoingArr, ...incomingArr],
      handleAllAndAppendDefaults: true,
    }]);
  }, [address, chain.cosmosAddress, collectionId]);


  if (!collection) return <></>;


  const firstOutgoingMatches = !approverAccount?.cosmosAddress ? [] : getFirstMatchForUserOutgoingApprovedTransfers(appendDefaultForOutgoing(
    approvedOutgoingTransfers, approverAccount?.cosmosAddress ?? ''), approverAccount?.cosmosAddress ?? '', showAllPossible);
  const firstIncomingMatches = !approverAccount?.cosmosAddress ? [] : getFirstMatchForUserIncomingApprovedTransfers(appendDefaultForIncoming(
    approvedIncomingTransfers, approverAccount?.cosmosAddress ?? ''), approverAccount?.cosmosAddress ?? '', showAllPossible);

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
        <ApprovalsDisplay
          convertedFirstMatches={convertedFirstOutgoingMatches}
          collection={collection}
          badgeId={badgeId}
        />
      </>}

      {tab === 'incoming' && <>
        <ApprovalsDisplay
          convertedFirstMatches={convertedFirstIncomingMatches}
          collection={collection}
          badgeId={badgeId}
        />
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
            setUserApprovedIncomingTransfers?.([{
              fromMappingId: "AllWithMint",
              fromMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
              initiatedByMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
              initiatedByMappingId: "AllWithMint",
              transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
              ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              approvalId: "approved all",
              approvalTrackerId: "",
              challengeTrackerId: "",
              allowedCombinations: [{
                isApproved: true,
                initiatedByMappingOptions: {},
                fromMappingOptions: {},
                badgeIdsOptions: {},
                ownershipTimesOptions: {},
                transferTimesOptions: {},
              }]
            }]);

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
