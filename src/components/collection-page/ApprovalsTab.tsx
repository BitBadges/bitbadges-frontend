import { DownOutlined, FieldTimeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Divider, Select, Tooltip, Typography } from 'antd';
import { AddressMapping, ApprovalTrackerIdDetails } from 'bitbadgesjs-proto';
import { UserApprovedIncomingTransferTimelineWithDetails, UserApprovedOutgoingTransferTimelineWithDetails, appendDefaultForIncoming, appendDefaultForOutgoing, castIncomingTransfersToCollectionTransfers, castOutgoingTransfersToCollectionTransfers, getCurrentValueIdxForTimeline, getFirstMatchForUserIncomingApprovedTransfers, getFirstMatchForUserOutgoingApprovedTransfers, getReservedAddressMapping } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { GO_MAX_UINT_64, getTimeRangesElement } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { Tabs } from '../navigation/Tabs';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { TransferabilityRow, getTableHeader } from './TransferabilityTab';

export function UserApprovalsTab({ collectionId, badgeId, isIncomingApprovalEdit, isOutgoingApprovalEdit,
  userApprovedIncomingTransfers, userApprovedOutgoingTransfers,
  setUserApprovedIncomingTransfers,
  // setUserApprovedOutgoingTransfers

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
  const approvedOutgoingTransfersTimeline =
    userApprovedOutgoingTransfers ? userApprovedOutgoingTransfers :
      collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.approvedOutgoingTransfersTimeline ?? [];
  const approvedIncomingTransfersTimeline =
    userApprovedIncomingTransfers ? userApprovedIncomingTransfers :
      collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.approvedIncomingTransfersTimeline ?? [];

  const currOutgoingTransferabilityIdx = getCurrentValueIdxForTimeline(approvedOutgoingTransfersTimeline);
  const currIncomingTransferabilityIdx = getCurrentValueIdxForTimeline(approvedIncomingTransfersTimeline);


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

      setDefaultIncomingIdx(Number(getCurrentValueIdxForTimeline(approvedIncomingTransfersTimeline)));
      setDefaultOutgoingIdx(Number(getCurrentValueIdxForTimeline(approvedOutgoingTransfersTimeline)));
    }
  }, [collectionId, approvedIncomingTransfersTimeline, approvedOutgoingTransfersTimeline]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch trackers a');
    if (collectionId > 0) {
      async function fetchTrackers() {
        const outgoingIdx = getCurrentValueIdxForTimeline(approvedOutgoingTransfersTimeline);
        const defaultOutgoingIdx = outgoingIdx < 0 ? 0 : outgoingIdx;

        if (collection && approvedOutgoingTransfersTimeline.length > 0) {

          const approvedTransfers = approvedOutgoingTransfersTimeline[Number(defaultOutgoingIdx)].approvedOutgoingTransfers.filter(x => x.approvalDetails.length > 0);


          const approvalsIdsToFetch: ApprovalTrackerIdDetails<bigint>[] =
            approvedTransfers.map(approvedTransfer => {
              const approvalId = approvedTransfer.approvalDetails[0].approvalId;
              const approvalIdDetails = [
                {
                  collectionId,
                  approvalId,
                  approvalLevel: "outgoing",
                  approvedAddress: "",
                  approverAddress: approverAccount?.cosmosAddress,
                  trackerType: "overall",
                },
                {
                  collectionId,
                  approvalId,
                  approvalLevel: "outgoing",
                  approvedAddress: chain.cosmosAddress,
                  approverAddress: approverAccount?.cosmosAddress,
                  trackerType: "initiatedBy",
                },
                {
                  collectionId,
                  approvalId,
                  approvalLevel: "outgoing",
                  approvedAddress: chain.cosmosAddress,
                  approverAddress: approverAccount?.cosmosAddress,
                  trackerType: "to",
                },
                {
                  collectionId,
                  approvalId,
                  approvalLevel: "outgoing",
                  approvedAddress: chain.cosmosAddress,
                  approverAddress: approverAccount?.cosmosAddress,
                  trackerType: "from",
                },
              ] as ApprovalTrackerIdDetails<bigint>[];
              return approvalIdDetails;
            }).flat();



          collections.fetchCollectionsWithOptions([{
            collectionId,
            viewsToFetch: [],
            merkleChallengeIdsToFetch: [],
            approvalsTrackerIdsToFetch: approvalsIdsToFetch,
            handleAllAndAppendDefaults: true,
          }]);
        }


        const incomingIdx = getCurrentValueIdxForTimeline(approvedIncomingTransfersTimeline);
        const defaultIncomingIdx = incomingIdx < 0 ? 0 : incomingIdx;

        if (collection && approvedIncomingTransfersTimeline.length > 0) {

          const approvedTransfers = approvedIncomingTransfersTimeline[Number(defaultIncomingIdx)].approvedIncomingTransfers.filter(x => x.approvalDetails.length > 0);


          const approvalsIdsToFetch: ApprovalTrackerIdDetails<bigint>[] = approvedTransfers.map(approvedTransfer => {
            const approvalId = approvedTransfer.approvalDetails[0].approvalId;
            const approvalIdDetails = [
              {
                collectionId,
                approvalId,
                approvalLevel: "incoming",
                approvedAddress: "",
                approverAddress: approverAccount?.cosmosAddress,
                trackerType: "overall",
              },
              {
                collectionId,
                approvalId,
                approvalLevel: "incoming",
                approvedAddress: chain.cosmosAddress,
                approverAddress: approverAccount?.cosmosAddress,
                trackerType: "initiatedBy",
              },
              {
                collectionId,
                approvalId,
                approvalLevel: "incoming",
                approvedAddress: chain.cosmosAddress,
                approverAddress: approverAccount?.cosmosAddress,
                trackerType: "to",
              },
              {
                collectionId,
                approvalId,
                approvalLevel: "incoming",
                approvedAddress: chain.cosmosAddress,
                approverAddress: approverAccount?.cosmosAddress,
                trackerType: "from",
              },
            ] as ApprovalTrackerIdDetails<bigint>[];
            return approvalIdDetails;
          }).flat();


          collections.fetchCollectionsWithOptions([{
            collectionId,
            viewsToFetch: [],
            merkleChallengeIdsToFetch: [],
            approvalsTrackerIdsToFetch: approvalsIdsToFetch,
            handleAllAndAppendDefaults: true,
          }])
        }
      }

      fetchTrackers();

    }
  }, []);

  if (!collection) return <></>;

  const firstOutgoingMatches = getFirstMatchForUserOutgoingApprovedTransfers(appendDefaultForOutgoing(
    defaultOutgoingIdx < 0 || defaultOutgoingIdx >= approvedOutgoingTransfersTimeline.length ? [] : approvedOutgoingTransfersTimeline[Number(defaultOutgoingIdx)].approvedOutgoingTransfers, approverAccount?.cosmosAddress ?? ''), approverAccount?.cosmosAddress ?? '', showAllPossible);
  const firstIncomingMatches = getFirstMatchForUserIncomingApprovedTransfers(appendDefaultForIncoming(
    defaultIncomingIdx < 0 || defaultIncomingIdx >= approvedIncomingTransfersTimeline.length ? [] : approvedIncomingTransfersTimeline[Number(defaultIncomingIdx)].approvedIncomingTransfers, approverAccount?.cosmosAddress ?? ''), approverAccount?.cosmosAddress ?? '', showAllPossible);

  const convertedFirstOutgoingMatches = approverAccount?.cosmosAddress ? castOutgoingTransfersToCollectionTransfers(firstOutgoingMatches, approverAccount?.cosmosAddress ?? '') : [];
  const convertedFirstIncomingMatches = approverAccount?.cosmosAddress ? castIncomingTransfersToCollectionTransfers(firstIncomingMatches, approverAccount?.cosmosAddress ?? '') : []


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
          tabInfo={[
            {
              key: 'outgoing',
              content: <>Outgoing Approvals</>
            },
            {
              key: 'incoming',
              content: <>Incoming Approvals</>
            },
          ]}
        /></>}
      {tab === 'outgoing' && <>
        {/* <br /> */}
        <Typography.Text className='primary-text' strong style={{ fontSize: 24 }}>
          {collection && ((approvedOutgoingTransfersTimeline.length > 1)) &&
            <Tooltip color='black' title="The transferability for this collection is scheduled to have different set values at different times.">
              Outgoing Approvals <FieldTimeOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          }
        </Typography.Text>
        {/* <br /> */}
        {collection && ((approvedOutgoingTransfersTimeline.length > 1)) ?
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
              {approvedOutgoingTransfersTimeline.map((timeline, idx) => {
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
              convertedFirstOutgoingMatches.map((x, idx) => {
                const result = <TransferabilityRow transfer={x} key={idx} badgeId={badgeId} collectionId={collectionId} />
                return result
              }
              )
            }
            {/* {
              convertedFirstOutgoingMatches.length === 0 &&
              <tr>
                <td>
                  <p>No outgoing approvals found.</p>
                </td>
              </tr>
            } */}
            <br />
            {/* <TransferabilityRow transfer={{
              fromMapping: {
              
              },
              approvalDetails: [],
            }} key={"all else"} badgeId={badgeId} collectionId={collectionId} /> */}

          </table>
        </div>
      </>}



      {tab === 'incoming' && <>
        <Typography.Text className='primary-text' strong style={{ fontSize: 24 }}>
          {collection && ((approvedIncomingTransfersTimeline.length > 1)) ?
            <Tooltip color='black' title="The transferability for this collection is scheduled to have different set values at different times.">
              Incoming Approvals <FieldTimeOutlined style={{ marginLeft: 4 }} />
            </Tooltip> : <> </>
          }


        </Typography.Text>
        {collection && ((approvedIncomingTransfersTimeline.length > 1)) ?
          <>
            <Select
              className="selector primary-text primary-blue-bg"
              style={{ marginLeft: 4 }}
              defaultValue={defaultIncomingIdx}
              onChange={(value) => {
                setDefaultIncomingIdx(Number(value));
              }}
              suffixIcon={
                <DownOutlined
                  className='primary-text'
                />
              }
            >
              {approvedIncomingTransfersTimeline.map((timeline, idx) => {
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
              convertedFirstIncomingMatches.map((x, idx) => {
                return <TransferabilityRow transfer={x} key={idx} badgeId={badgeId} collectionId={collectionId} />
              }
              )
            }

          </table>
        </div>
      </>}
    </div>
    <div className='primary-text'>
      {!(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <>      <Divider />
        <p>
          <InfoCircleOutlined />{' '}Approvals are broken down into multiple criteria: who can send? who can receive? etc.
          Each row represents a different set of criteria. For a transfer to be allowed, ALL of the criteria in the row must be satisfied. If transfers span multiple rows, they must satisfy ALL criteria in ALL the spanned rows.
        </p>
        <br />
        <p>
          <InfoCircleOutlined />{' '} Note that approvals can be overriden by the collection-level transferability (if set).
        </p>
      </>}
      {(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <Divider />}

      {/* {isIncomingApprovalEdit && tab === 'outgoing' && <>
        <ApprovalSelect
          plusButton
          hideTransferDisplay
          hideRemaining
          sender={chain.cosmosAddress}

          distributionMethod={DistributionMethod.FirstComeFirstServe}
          collectionId={collectionId}
          originalSenderBalances={collection.owners.find(x => x.cosmosAddress === chain.cosmosAddress)?.balances ?? []}
          approvedTransfersToAdd={approvedTransfersToAdd}

          setApprovedTransfersToAdd={(value) => {
            setApprovedTransfersToAdd(value);

            console.log(value);

            setUserApprovedOutgoingTransfers?.([{
              ...approvedOutgoingTransfersTimeline[0],
              approvedOutgoingTransfers: [...value.map(x => castFromCollectionTransferToOutgoingTransfer(x))]
            }])

            console.log([...value.map(x => castFromCollectionTransferToOutgoingTransfer(x))]);
          }}
        />

      </>} */}

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
