import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Divider, Empty, Switch, Typography } from 'antd';
import { AddressMapping, AmountTrackerIdDetails } from 'bitbadgesjs-proto';
import { BitBadgesCollection, CollectionApprovalWithDetails, UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails, appendDefaultForIncoming, appendDefaultForOutgoing, castIncomingTransfersToCollectionTransfers, castOutgoingTransfersToCollectionTransfers, getReservedAddressMapping, getUnhandledCollectionApprovals } from 'bitbadgesjs-utils';
import { FC, useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE, NODE_URL } from '../../constants';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressSelect } from '../address/AddressSelect';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { Tabs } from '../navigation/Tabs';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { TransferabilityRow, getTableHeader } from './TransferabilityRow';
interface Props {
  approvals: CollectionApprovalWithDetails<bigint>[];
  collection: BitBadgesCollection<bigint>;
  badgeId?: bigint;
  filterFromMint?: boolean;
  hideHelperMessage?: boolean;
  approvalLevel: string;
  approverAddress: string;
}

export const ApprovalsDisplay: FC<Props> = ({ approvals, collection, badgeId, filterFromMint, hideHelperMessage, approvalLevel, approverAddress }) => {
  const [showHidden, setShowHidden] = useState<boolean>(false);
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const disapproved = showHidden ? getUnhandledCollectionApprovals(approvals, true, true) : [];

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch trackers b');
    const collectionId = collection?.collectionId;

    if (collectionId > 0) {
      async function fetchTrackers() {
        if (collection && collection?.collectionApprovals.length > 0) {

          const approvals = collection?.collectionApprovals.filter(x => x.amountTrackerId);

          const approvalsIdsToFetch: AmountTrackerIdDetails<bigint>[] =
            approvals.map(approval => {
              return [{
                collectionId,
                amountTrackerId: approval.amountTrackerId,
                approvalLevel: approvalLevel,
                approvedAddress: "",
                approverAddress: approverAddress,
                trackerType: "overall",
              },
              {
                collectionId,
                amountTrackerId: approval.amountTrackerId,
                approvalLevel: approvalLevel,
                approvedAddress: chain.cosmosAddress,
                approverAddress: approverAddress,
                trackerType: "initiatedBy",
              },
              {
                collectionId,
                amountTrackerId: approval.amountTrackerId,
                approvalLevel: approvalLevel,
                approvedAddress: chain.cosmosAddress,
                approverAddress: approverAddress,
                trackerType: "to",
              },
              {
                collectionId,
                amountTrackerId: approval.amountTrackerId,
                approvalLevel: approvalLevel,
                approvedAddress: chain.cosmosAddress,
                approverAddress: approverAddress,
                trackerType: "from",
              },
              ] as AmountTrackerIdDetails<bigint>[];
            }).flat();
          collections.fetchCollectionsWithOptions([{
            collectionId,
            viewsToFetch: [],
            merkleChallengeIdsToFetch: [],
            approvalsTrackerIdsToFetch: approvalsIdsToFetch,
            handleAllAndAppendDefaults: true,
          }]);
        }

      }
      fetchTrackers();

    }
  }, [collection, approvalLevel, approverAddress]);

  return <>
    <br />
    <InformationDisplayCard title='' >
      <br />
      {
        <div style={{ float: 'right' }}>
          <Switch
            checkedChildren="Show Approvals Only"
            unCheckedChildren="Show All"
            checked={!showHidden}
            onChange={(checked) => setShowHidden(!checked)}
          />
        </div>}
      <br />
      <div>
        <br />
        <br />
        <div className='flex-between' style={{ overflow: 'auto' }}>

          <table style={{ width: '100%', fontSize: 16 }}>
            {getTableHeader()}
            <br />
            {
              <>
                {approvals.map((x, idx) => {
                  const result = <TransferabilityRow transfer={x} key={idx} badgeId={badgeId} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
                  return result
                })}

                {disapproved.map((x, idx) => {
                  const result = <TransferabilityRow disapproved transfer={x} key={idx} badgeId={badgeId} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
                  return result
                })}
              </>
            }
          </table>
        </div >
      </div>
      {!hideHelperMessage && <>
        <Divider />
        <p>
          <InfoCircleOutlined />{' '}The table is broken down into multiple criteria: who can send? who can receive? etc.
          Each row represents a different set of criteria. For a transfer to be approved, ALL of the criteria in the row must be satisfied. If transfers span multiple rows, they must satisfy ALL criteria in ALL the spanned rows.
        </p></>}
      <Divider />
    </InformationDisplayCard >
  </>
}


export function UserApprovalsTab({ collectionId,
  badgeId, isIncomingApprovalEdit, isOutgoingApprovalEdit,
  userIncomingApprovals, userOutgoingApprovals,
  setUserIncomingApprovals,
  // setUserOutgoingApprovals //We never use this
}: {
  collectionId: bigint,
  badgeId?: bigint,
  isIncomingApprovalEdit?: boolean,
  isOutgoingApprovalEdit?: boolean,
  userIncomingApprovals?: UserIncomingApprovalWithDetails<bigint>[],
  userOutgoingApprovals?: UserOutgoingApprovalWithDetails<bigint>[],
  setUserIncomingApprovals?: (incomingApprovals: UserIncomingApprovalWithDetails<bigint>[]) => void,
  // setUserOutgoingApprovals?: (outgoingApprovals: UserOutgoingApprovalWithDetails<bigint>[]) => void,
}) {

  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];

  const accounts = useAccountsContext();
  const [address, setAddress] = useState<string>(chain.address);

  const [tab, setTab] = useState<string>(isIncomingApprovalEdit ? 'incoming' : 'outgoing');

  const approverAccount = address ? accounts.getAccount(address) : undefined;
  const outgoingApprovals = userOutgoingApprovals ? userOutgoingApprovals : collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.outgoingApprovals ?? [];
  const incomingApprovals = userIncomingApprovals ? userIncomingApprovals : collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.incomingApprovals ?? [];
  const updateHistory = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.updateHistory ?? [];


  if (!collection) return <></>;


  const outgoingApprovalsWithDefaults = !approverAccount?.cosmosAddress ? [] : appendDefaultForOutgoing(outgoingApprovals, approverAccount?.cosmosAddress ?? '')
  const incomingApprovalsWithDefaults = !approverAccount?.cosmosAddress ? [] : appendDefaultForIncoming(incomingApprovals, approverAccount?.cosmosAddress ?? '')

  const castedOutgoingApprovals = approverAccount?.cosmosAddress ? castOutgoingTransfersToCollectionTransfers(outgoingApprovalsWithDefaults, approverAccount?.cosmosAddress ?? '') : [];
  const castedIncomingApprovals = approverAccount?.cosmosAddress ? castIncomingTransfersToCollectionTransfers(incomingApprovalsWithDefaults, approverAccount?.cosmosAddress ?? '') : []

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
              <Typography.Text className='primary-text'>
                This user has never updated their approvals.
              </Typography.Text>
            </>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>}
      </div>}


      {tab === 'outgoing' && <>
        <ApprovalsDisplay
          approvals={castedOutgoingApprovals}
          collection={collection}
          badgeId={badgeId}
          approvalLevel='outgoing'
          approverAddress={approverAccount?.cosmosAddress ?? ''}
        />
      </>}

      {tab === 'incoming' && <>
        <ApprovalsDisplay
          approvals={castedIncomingApprovals}
          collection={collection}
          badgeId={badgeId}
          approvalLevel='incoming'
          approverAddress={approverAccount?.cosmosAddress ?? ''}
        />
      </>}
    </div>
    <div className='primary-text'>
      {(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <Divider />}

      {isIncomingApprovalEdit && tab === 'incoming' && <><SwitchForm
        options={[
          {
            title: 'Approve All',
            message: 'Approve any incoming transfer for this collection.',
            isSelected: (userIncomingApprovals ?? [])?.length > 0,
          },
          {
            title: 'Must Initiate',
            message: 'Only approve incoming transfers that were initiated by you.',
            isSelected: userIncomingApprovals?.length === 0,
          }
        ]
        }
        onSwitchChange={(value) => {
          if (value === 0) {
            setUserIncomingApprovals?.([{
              fromMappingId: "AllWithMint",
              fromMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
              initiatedByMapping: getReservedAddressMapping("AllWithMint") as AddressMapping,
              initiatedByMappingId: "AllWithMint",
              transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              badgeIds: [{ start: 1n, end: GO_MAX_UINT_64 }],
              ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
              approvalId: "approved all",
              amountTrackerId: "approved all",
              challengeTrackerId: "approved all",
            }]);

          } else if (value === 1) {
            setUserIncomingApprovals?.([]);
          }
        }}
      />
        {/* 
        TODO: Add speicifc users

        {userIncomingApprovals?.length === 1 && <>
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
