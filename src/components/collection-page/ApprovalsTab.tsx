import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Divider, Empty, Typography } from 'antd';
import { AddressMapping, ApprovalTrackerIdDetails, NumberType } from 'bitbadgesjs-proto';
import { BitBadgesCollection, CollectionApprovedTransferWithDetails, UserApprovedIncomingTransferWithDetails, UserApprovedOutgoingTransferWithDetails, appendDefaultForIncoming, appendDefaultForOutgoing, castIncomingTransfersToCollectionTransfers, castOutgoingTransfersToCollectionTransfers, getFirstMatchForUserIncomingApprovedTransfers, getFirstMatchForUserOutgoingApprovedTransfers, getReservedAddressMapping } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useAccountsContext } from '../../bitbadges-api/contexts/AccountsContext';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE, NODE_URL } from '../../constants';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { Tabs } from '../navigation/Tabs';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { TransferabilityRow, getTableHeader } from './TransferabilityRow';


export const getApprovalsDisplay = (convertedFirstMatches: CollectionApprovedTransferWithDetails<bigint>[], collection: BitBadgesCollection<bigint>, badgeId?: bigint,
  filterFromMint?: boolean
) => {
  return <>
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
            const result = <TransferabilityRow transfer={x} key={idx} badgeId={badgeId} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
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

        const approvedTransfers = (approvedTransfersCasted as UserApprovedIncomingTransferWithDetails<bigint>[]).filter(x => x.approvalDetails.length > 0)

        const approvalsIdsToFetch = approvedTransfers.flatMap(approvedTransfer => {
          return approvedTransfer.approvalDetails.map(x => {
            const approvalTrackerId = x.approvalTrackerId;
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
        });

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
        {getApprovalsDisplay(convertedFirstOutgoingMatches, collection, badgeId)}
      </>}

      {tab === 'incoming' && <>
        {getApprovalsDisplay(convertedFirstIncomingMatches, collection, badgeId)}
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
              allowedCombinations: [{
                isApproved: true,
                initiatedByMappingOptions: {},
                fromMappingOptions: {},
                badgeIdsOptions: {},
                ownershipTimesOptions: {},
                transferTimesOptions: {},
              }],
              approvalDetails: []
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
