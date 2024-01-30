import { ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Divider, Empty, Typography } from 'antd';
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails, appendSelfInitiatedIncomingApproval, appendSelfInitiatedOutgoingApproval, castIncomingTransfersToCollectionTransfers, castOutgoingTransfersToCollectionTransfers, castUserIncomingApprovalPermissionToCollectionApprovalPermission, castUserOutgoingApprovalPermissionToCollectionApprovalPermission, getReservedAddressList, getUnhandledUserIncomingApprovals } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { useAccount } from '../../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { EXPLORER_URL, NODE_API_URL } from '../../../constants';
import { GO_MAX_UINT_64 } from '../../../utils/dates';
import { AddressSelect } from '../../address/AddressSelect';
import { Tabs } from '../../navigation/Tabs';
import { SwitchForm } from '../../tx-timelines/form-items/SwitchForm';
import { DefaultApprovedDisplay, DefaultOptInDisplay } from '../../tx-timelines/step-items/DefaultToApprovedSelectStepItem';
import { UserPermissionsOverview } from '../PermissionsInfo';
import { TransferabilityTab } from './TransferabilityTab';
import { EditableApprovalsDisplay } from './ApprovalsDisplay';


interface UserApprovalTabProps {
  collectionId: bigint,
  isIncomingApprovalEdit?: boolean,
  isOutgoingApprovalEdit?: boolean,
  userIncomingApprovals?: UserIncomingApprovalWithDetails<bigint>[],
  userOutgoingApprovals?: UserOutgoingApprovalWithDetails<bigint>[],
  setUserIncomingApprovals?: (incomingApprovals: UserIncomingApprovalWithDetails<bigint>[]) => void,
  setUserOutgoingApprovals?: (outgoingApprovals: UserOutgoingApprovalWithDetails<bigint>[]) => void,
  advancedMode?: boolean,

  //TODO: These props, at the time of writing this, are never passed in from an external call (we use some of them internally calling the collection defaults)
  //Could possibly clean them up
  hideSelect?: boolean,
  defaultApprover?: string,
  hideIncomingApprovals?: boolean,
  hideOutgoingApprovals?: boolean,
  showCollectionApprovals?: boolean,
  hideUpdateHistory?: boolean,
  hideDefaults?: boolean,
  showingDefaults?: boolean,
}

export function EditableUserApprovalsTab(props: UserApprovalTabProps) {
  return <UniversalUserApprovalsTab {...props} />;
}

export function UserApprovalsTab(props: { collectionId: bigint }) {
  return <UniversalUserApprovalsTab {...props} />;
}

function UniversalUserApprovalsTab({
  collectionId,
  userIncomingApprovals,
  userOutgoingApprovals,
  setUserIncomingApprovals,
  setUserOutgoingApprovals,
  hideSelect,
  defaultApprover,
  hideIncomingApprovals,
  hideUpdateHistory,
  hideOutgoingApprovals,
  showCollectionApprovals,
  hideDefaults,
  showingDefaults,
  advancedMode,
}: UserApprovalTabProps) {
  const chain = useChainContext();
  const collection = useCollection(collectionId);
  const isIncomingApprovalEdit = !!setUserIncomingApprovals;
  const isOutgoingApprovalEdit = !!setUserOutgoingApprovals;
  const normalMode = !advancedMode;

  const [address, setAddress] = useState<string>(defaultApprover ?? chain.address);
  const [tab, setTab] = useState<string>(isIncomingApprovalEdit ? 'incoming' : 'outgoing');

  const approverAccount = useAccount(address);

  const fetchedBalanceStore = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)

  //We use the context values if no props are provided. Else, we use the props
  //We then append defaults if applicable
  const fetchedOutgoingApprovals = fetchedBalanceStore?.outgoingApprovals ?? [];
  const fetchedIncomingApprovals = fetchedBalanceStore?.incomingApprovals ?? [];
  const outgoingApprovals = userOutgoingApprovals ? userOutgoingApprovals : fetchedOutgoingApprovals;
  const incomingApprovals = userIncomingApprovals ? userIncomingApprovals : fetchedIncomingApprovals;
  const appendDefaultIncoming = fetchedBalanceStore?.autoApproveSelfInitiatedIncomingTransfers ?? collection?.defaultBalances.autoApproveSelfInitiatedIncomingTransfers;
  const appendDefaultOutgoing = fetchedBalanceStore?.autoApproveSelfInitiatedOutgoingTransfers ?? collection?.defaultBalances.autoApproveSelfInitiatedOutgoingTransfers;
  const outgoingApprovalsWithDefaults = !approverAccount?.cosmosAddress ? [] : appendSelfInitiatedOutgoingApproval(outgoingApprovals, approverAccount?.cosmosAddress ?? '')
  const incomingApprovalsWithDefaults = !approverAccount?.cosmosAddress ? [] : appendSelfInitiatedIncomingApproval(incomingApprovals, approverAccount?.cosmosAddress ?? '')

  const updateHistory = fetchedBalanceStore?.updateHistory ?? [];

  useEffect(() => {
    if (address) fetchBalanceForUser(collectionId, address);
  }, [address, collectionId])


  if (!collection) return <></>;

  //For compatibility with other components, we cast the approvals to the collection transfer type
  const castedOutgoingApprovals = approverAccount?.cosmosAddress ? castOutgoingTransfersToCollectionTransfers(
    appendDefaultOutgoing ? outgoingApprovalsWithDefaults : outgoingApprovalsWithDefaults.filter(x => x.approvalId !== "self-initiated-outgoing"),
    approverAccount?.cosmosAddress ?? '')
    : [];
  const castedIncomingApprovals = approverAccount?.cosmosAddress ? castIncomingTransfersToCollectionTransfers(
    appendDefaultIncoming ? incomingApprovalsWithDefaults : incomingApprovals.filter(x => x.approvalId !== "self-initiated-incoming"),
    approverAccount?.cosmosAddress ?? '') : []

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
      key: 'permissions',
      content: <>Permissions</>
    })
  }

  if (showCollectionApprovals) {
    tabInfo.push({

      key: 'collection',
      content: <>Collection Transferability</>

    })
  }


  if (!isIncomingApprovalEdit && !isOutgoingApprovalEdit && !hideUpdateHistory) {
    tabInfo.push({
      key: 'history',
      content: <>Update History</>
    })
  }

  if (!isIncomingApprovalEdit && !isOutgoingApprovalEdit && !hideDefaults) {
    tabInfo.push({
      key: 'defaults',
      content: <>Collection Defaults</>
    })
  }

  if (hideIncomingApprovals) {
    tabInfo.splice(1, 1);
  }

  if (hideOutgoingApprovals) {
    tabInfo.splice(0, 1);
  }

  return (<>
    <div className='primary-text full-width'>
      {isIncomingApprovalEdit && tab === 'incoming' && normalMode && <><SwitchForm
        showCustomOption

        options={[
          {
            title: 'Approve All',
            message: 'Approve any incoming transfer for this collection.',
            isSelected: getUnhandledUserIncomingApprovals((userIncomingApprovals ?? []).filter(x => x.approvalId !== "self-initiated-incoming"), approverAccount?.cosmosAddress ?? '', true).length == 0,
            additionalNode: () => <><DefaultApprovedDisplay address={approverAccount?.cosmosAddress ?? ''} /></>
          },
          {
            title: 'Must Initiate',
            message: 'Only approve incoming transfers that were initiated by you.',
            isSelected: (userIncomingApprovals ?? []).filter(x => x.approvalId !== "self-initiated-incoming").length === 0,
            additionalNode: () => <><DefaultOptInDisplay address={approverAccount?.cosmosAddress ?? ''} /></>
          }
        ]}
        onSwitchChange={(value) => {
          if (value === 0) {
            setUserIncomingApprovals?.([{
              fromListId: "All",
              fromList: getReservedAddressList("All"),
              initiatedByList: getReservedAddressList("All"),
              initiatedByListId: "All",
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
      </>}
      {(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <br />}

    </div >

    <div className='primary-text full-width'>
      {!(isIncomingApprovalEdit || isOutgoingApprovalEdit) && !hideSelect && <>
        <AddressSelect
          defaultValue={chain.address}
          onUserSelect={(value) => {
            setAddress(value);
          }}
          fontSize={20}
        />
        <br />
      </>}
      {!(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <>
        <Tabs
          type='underline'
          fullWidth
          tab={tab}
          theme='dark'
          setTab={setTab}
          tabInfo={tabInfo}
        /></>}

      {tab === 'defaults' && approverAccount?.address && <>
        <br />
        <div className="secondary-text">
          <InfoCircleOutlined /> Collections can define default values for incoming and outgoing approvals as well as default user permissions.
          These values are used upon initial creation.
        </div>
        <Divider />
        <UniversalUserApprovalsTab
          userIncomingApprovals={collection.defaultBalances.incomingApprovals}
          userOutgoingApprovals={collection.defaultBalances.outgoingApprovals}
          collectionId={collectionId}
          hideUpdateHistory
          hideSelect
          defaultApprover={approverAccount?.address}
          hideDefaults
          showingDefaults
        />
      </>}

      {tab == 'collection' && <div>
        <TransferabilityTab collectionId={collectionId} />
      </div>}

      {tab == 'permissions' && <div>
        <br />
        <div className='flex-center'>
          <UserPermissionsOverview
            collectionId={collectionId}
            addressOrUsername={approverAccount?.address ?? ''}
            displayDefaults={showingDefaults}
          />
        </div>
      </div>}

      {tab === 'history' && <div className='primary-text'>
        <br />
        {updateHistory.sort((a, b) => a.block > b.block ? -1 : 1).map((update, i) => {
          return <div key={i} style={{ textAlign: 'left' }} className='primary-text'>
            <Typography.Text strong className='primary-text' style={{ fontSize: '1.2em' }}>
              <ClockCircleOutlined style={{ marginRight: '5px' }} />
              {new Date(Number(update.blockTimestamp)).toLocaleString()}
              {' '}(Block #{update.block.toString()})
            </Typography.Text>
            {update.txHash &&
              <p><a href={EXPLORER_URL + '/BitBadges/tx/' + update.txHash} target='_blank' rel='noopener noreferrer'>
                See Blockchain Transaction
              </a></p>
            }
            <Divider />
          </div>
        })}
        {updateHistory.length === 0 && <div>
          <Empty
            className='primary-text'
            description={<>
              This user has never updated their approvals.
            </>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>}
      </div>}

      {approverAccount?.address && <>
        {tab === 'outgoing' && <>

          <EditableApprovalsDisplay
            approvals={castedOutgoingApprovals}
            collection={collection}
            mintingOnly={false}
            approvalLevel='outgoing'
            editable={!!setUserOutgoingApprovals}
            startingApprovals={castOutgoingTransfersToCollectionTransfers(fetchedOutgoingApprovals, approverAccount.address)}
            approverAddress={approverAccount?.address ?? ''}
            setApprovals={setUserOutgoingApprovals ?? (() => { })}
            approvalPermissions={castUserOutgoingApprovalPermissionToCollectionApprovalPermission(
              (collection.owners?.find(x => x.cosmosAddress === approverAccount?.address)?.userPermissions.canUpdateOutgoingApprovals ?? []).map(x => {
                return {
                  ...x,
                  toList: getReservedAddressList(x.toListId),
                  initiatedByList: getReservedAddressList(x.initiatedByListId),
                }
              }),
              approverAccount.address
            )}
          />
        </>}

        {tab === 'incoming' && (!isIncomingApprovalEdit || (
          isIncomingApprovalEdit && advancedMode
        )) && <>
            <EditableApprovalsDisplay
              approvals={castedIncomingApprovals}
              collection={collection}
              approvalLevel='incoming'
              mintingOnly={false}
              editable={!!setUserIncomingApprovals}
              startingApprovals={castIncomingTransfersToCollectionTransfers(fetchedIncomingApprovals, approverAccount.address)}
              approverAddress={approverAccount?.address ?? ''}
              setApprovals={setUserIncomingApprovals ?? (() => { })}
              approvalPermissions={castUserIncomingApprovalPermissionToCollectionApprovalPermission(
                (collection.owners?.find(x => x.cosmosAddress === approverAccount?.address)?.userPermissions.canUpdateIncomingApprovals ?? []).map(x => {
                  return {
                    ...x,
                    fromList: getReservedAddressList(x.fromListId),
                    initiatedByList: getReservedAddressList(x.initiatedByListId),
                  }
                }),
                approverAccount.address
              )}
            />
          </>}
      </>}
    </div >

  </>
  );
}
