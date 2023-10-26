import { ClockCircleOutlined, CloseOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Empty, Switch, Typography } from 'antd';
import { BitBadgesCollection, CollectionApprovalWithDetails, DistributionMethod, UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails, appendDefaultForIncoming, appendDefaultForOutgoing, castFromCollectionTransferToIncomingTransfer, castFromCollectionTransferToOutgoingTransfer, castIncomingTransfersToCollectionTransfers, castOutgoingTransfersToCollectionTransfers, castUserIncomingApprovalPermissionToCollectionApprovalPermission, castUserOutgoingApprovalPermissionToCollectionApprovalPermission, getReservedAddressMapping, getUnhandledCollectionApprovals, getUnhandledUserIncomingApprovals, getUnhandledUserOutgoingApprovals, isInAddressMapping } from 'bitbadgesjs-utils';
import { FC, useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { NODE_URL } from '../../constants';
import { compareObjects } from '../../utils/compare';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { AddressSelect } from '../address/AddressSelect';
import IconButton from '../display/IconButton';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { Tabs } from '../navigation/Tabs';
import { ApprovalSelect } from '../transfers/ApprovalSelect';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { TransferabilityRow, getTableHeader } from './TransferabilityRow';
import { TransferabilityTab } from './TransferabilityTab';

interface Props {
  approvals: CollectionApprovalWithDetails<bigint>[];
  collection: BitBadgesCollection<bigint>;
  badgeId?: bigint;
  filterFromMint?: boolean;
  hideHelperMessage?: boolean;
  approvalLevel: string;
  approverAddress: string;
  onlyShowFromMint?: boolean;
  title?: string;
  subtitle?: React.ReactNode;

  //Edit features
  onDelete?: (approvalId: string) => void;
  onEdit?: (approval: any) => void;
  addMoreNode?: React.ReactNode;
  defaultShowDisallowed?: boolean;
  showDeletedGrayedOut?: boolean;
  startingApprovals?: CollectionApprovalWithDetails<bigint>[];
}

export const ApprovalsDisplay: FC<Props> = ({
  startingApprovals,
  showDeletedGrayedOut, subtitle, defaultShowDisallowed, title, addMoreNode, onDelete, onEdit, approvals, collection, badgeId, filterFromMint, hideHelperMessage, approvalLevel, approverAddress, onlyShowFromMint
}) => {
  const [showHidden, setShowHidden] = useState<boolean>(defaultShowDisallowed ?? false);
  const chain = useChainContext();

  let disapproved = showHidden ?
    approvalLevel === "incoming" ? getUnhandledUserIncomingApprovals(approvals, approverAddress, true)
      : approvalLevel === "outgoing" ? getUnhandledUserOutgoingApprovals(approvals, approverAddress, true)
        : getUnhandledCollectionApprovals(approvals, true, true) : [];

  //filter approvals to only take first time an approvalId is seen (used for duplicates "default-incoming" and "default-outgoing")
  approvals = approvals.filter((x, i) => approvals.findIndex(y => y.approvalId === x.approvalId) === i);

  const [address, setAddress] = useState<string>(chain.address);
  const [filterByBadgeId, setFilterByBadgeId] = useState<boolean>(!!badgeId);

  const deletedApprovals = startingApprovals?.filter(x => !approvals.find(y => compareObjects(x, y)));
  const txTimelineContext = useTxTimelineContext();

  if (onlyShowFromMint) {
    approvals = approvals.filter(x => isInAddressMapping(x.fromMapping, 'Mint'))
    approvals = approvals.map(x => {
      return {
        ...x,
        fromMapping: getReservedAddressMapping('Mint'),
        fromMappingId: 'Mint',
      }
    })

    disapproved = disapproved.filter(x => isInAddressMapping(x.fromMapping, 'Mint'))
    disapproved = disapproved.map(x => {
      return {
        ...x,
        fromMapping: getReservedAddressMapping('Mint'),
        fromMappingId: 'Mint',
      }
    })
  }

  return <>
    <br />

    <InformationDisplayCard title={title ?? ''} span={24} subtitle={subtitle} >
      <br />

      <div style={{ float: 'right' }}>
        {onlyShowFromMint && <Switch
          style={{ margin: 10 }}
          disabled
          checkedChildren="From Mint Only"
          unCheckedChildren="Show Mint Only"
          checked={true}
        />}

        {filterFromMint && <Switch
          style={{ margin: 10 }}
          disabled
          checkedChildren="From Non-Mint Only"
          unCheckedChildren="Show Mint Only"
          checked={true}
        />}

        {!!badgeId && <Switch
          style={{ margin: 10 }}
          checkedChildren={`Filter by Badge ID ${badgeId}`}
          unCheckedChildren="Show All"
          checked={filterByBadgeId}
          onChange={(checked) => setFilterByBadgeId(checked)}
        />}

        <Switch
          checkedChildren="Show Approvals Only"
          unCheckedChildren="Show All"
          checked={!showHidden}
          onChange={(checked) => setShowHidden(!checked)}
        />
      </div>
      <br />
      <div>
        <br />
        <br />
        <div className='overflow-x-auto'>
          <table className="table-auto overflow-x-scroll w-full table-wrp">
            <thead className='sticky top-0 z-10' style={{ zIndex: 10 }}>
              {getTableHeader(false)}
            </thead>
            <tbody>
              {
                <>
                  {approvals.map((x, idx) => {
                    const result = <TransferabilityRow
                      startingApprovals={startingApprovals}
                      onEdit={onEdit}
                      approverAddress={approverAddress}
                      onDelete={onDelete}
                      allTransfers={approvals}
                      address={address}
                      setAddress={setAddress}
                      isIncomingDisplay={approvalLevel === "incoming"}
                      isOutgoingDisplay={approvalLevel === "outgoing"}
                      transfer={x} key={idx}
                      badgeId={filterByBadgeId ? badgeId : undefined}
                      collectionId={collection.collectionId}
                      filterFromMint={filterFromMint}
                    />
                    return result
                  })}

                  {showDeletedGrayedOut && deletedApprovals?.map((x, idx) => {
                    const result = <TransferabilityRow grayedOut
                      onRestore={() => {
                        if (txTimelineContext.approvalsToAdd.find(y => y.approvalId === x.approvalId)) {
                          alert('This approval ID is already used.');
                          return;
                        }

                        const approvalsToAdd = txTimelineContext.approvalsToAdd;
                        txTimelineContext.setApprovalsToAdd([...approvalsToAdd, x]);
                      }}
                      allTransfers={approvals} address={address} setAddress={setAddress} isIncomingDisplay={approvalLevel === "incoming"} isOutgoingDisplay={approvalLevel === "outgoing"} transfer={x} key={idx} badgeId={badgeId} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
                    return result
                  })}

                  {disapproved.map((x, idx) => {
                    const result = <TransferabilityRow
                      onDelete={onDelete} allTransfers={approvals}
                      address={address} setAddress={setAddress} isIncomingDisplay={approvalLevel === "incoming"}
                      isOutgoingDisplay={approvalLevel === "outgoing"} disapproved transfer={x} key={idx}
                      badgeId={filterByBadgeId ? badgeId : undefined} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
                    return result
                  })}
                </>
              }
            </tbody>
          </table>
        </div>
      </div>
      <br />
      {addMoreNode}
      {!hideHelperMessage && <>
        <Divider />
        <p>
          <InfoCircleOutlined />{' '}The table is broken down into multiple criteria: who can send? who can receive? etc.
          Each row represents a different set of criteria.
          For a transfer to be approved, ALL of the criteria in the row must be satisfied. If transfers span multiple rows, they must satisfy ALL criteria in ALL the spanned rows.
        </p></>}
      <Divider />
    </InformationDisplayCard >
  </>
}


export function UserApprovalsTab({
  collectionId,
  badgeId, isIncomingApprovalEdit, isOutgoingApprovalEdit,
  userIncomingApprovals, userOutgoingApprovals,
  setUserIncomingApprovals,
  setUserOutgoingApprovals,
  hideSelect,
  defaultApprover,
  hideIncomingApprovals,
  hideUpdateHistory,
  hideOutgoingApprovals,
  showCollectionApprovals,
}: {
  collectionId: bigint,
  badgeId?: bigint,
  isIncomingApprovalEdit?: boolean,
  isOutgoingApprovalEdit?: boolean,
  userIncomingApprovals?: UserIncomingApprovalWithDetails<bigint>[],
  userOutgoingApprovals?: UserOutgoingApprovalWithDetails<bigint>[],
  setUserIncomingApprovals?: (incomingApprovals: UserIncomingApprovalWithDetails<bigint>[]) => void,
  setUserOutgoingApprovals?: (outgoingApprovals: UserOutgoingApprovalWithDetails<bigint>[]) => void,
  hideSelect?: boolean,
  defaultApprover?: string,
  hideIncomingApprovals?: boolean,
  hideOutgoingApprovals?: boolean,
  showCollectionApprovals?: boolean,
  hideUpdateHistory?: boolean,
}) {

  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  const accounts = useAccountsContext();
  const [address, setAddress] = useState<string>(defaultApprover ?? chain.address);
  const [visible, setVisible] = useState<boolean>(false);

  const [tab, setTab] = useState<string>(isIncomingApprovalEdit ? 'incoming' : 'outgoing');
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);

  const approverAccount = address ? accounts.getAccount(address) : undefined;

  //Initial or currently set ones
  const startingOutgoingApprovals = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.outgoingApprovals ?? [];
  const startingIncomingApprovals = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.incomingApprovals ?? [];

  const outgoingApprovals = userOutgoingApprovals ? userOutgoingApprovals : collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.outgoingApprovals ?? [];
  const incomingApprovals = userIncomingApprovals ? userIncomingApprovals : collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.incomingApprovals ?? [];
  const updateHistory = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.updateHistory ?? [];


  useEffect(() => {
    if (address) collections.fetchBalanceForUser(collectionId, address);
  }, [address]);


  if (!collection) return <></>;


  const appendDefaultIncoming = collection.owners?.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.autoApproveSelfInitiatedIncomingTransfers ?? false;
  const appendDefaultOutgoing = collection.owners?.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.autoApproveSelfInitiatedOutgoingTransfers ?? false;

  const outgoingApprovalsWithDefaults = !approverAccount?.cosmosAddress ? [] : appendDefaultForOutgoing(outgoingApprovals, approverAccount?.cosmosAddress ?? '')
  const incomingApprovalsWithDefaults = !approverAccount?.cosmosAddress ? [] : appendDefaultForIncoming(incomingApprovals, approverAccount?.cosmosAddress ?? '')



  const castedOutgoingApprovals = approverAccount?.cosmosAddress
    ? castOutgoingTransfersToCollectionTransfers(
      appendDefaultOutgoing ? outgoingApprovalsWithDefaults : outgoingApprovalsWithDefaults.filter(x => x.approvalId !== "default-outgoing"),
      approverAccount?.cosmosAddress ?? '')
    : [];
  const castedIncomingApprovals = approverAccount?.cosmosAddress ? castIncomingTransfersToCollectionTransfers(
    appendDefaultIncoming ? incomingApprovalsWithDefaults : incomingApprovals.filter(x => x.approvalId !== "default-incoming"),
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

  if (!isIncomingApprovalEdit && !isOutgoingApprovalEdit && !hideUpdateHistory) {
    tabInfo.push({

      key: 'history',
      content: <>Update History</>

    })
  }

  if (showCollectionApprovals) {
    tabInfo.push({

      key: 'collection',
      content: <>Collection Transferability</>

    })
  }

  if (hideIncomingApprovals) {
    tabInfo.splice(1, 1);
  }

  if (hideOutgoingApprovals) {
    tabInfo.splice(0, 1);
  }

  return (<>
    <div className='dark:text-white'>

      {isIncomingApprovalEdit && tab === 'incoming' && <><SwitchForm
        showCustomOption
        options={[
          {
            title: 'Approve All',
            message: 'Approve any incoming transfer for this collection.',
            isSelected: getUnhandledUserIncomingApprovals((userIncomingApprovals ?? []).filter(x => x.approvalId !== "default-incoming"), approverAccount?.cosmosAddress ?? '', true).length == 0,
          },
          {
            title: 'Must Initiate',
            message: 'Only approve incoming transfers that were initiated by you.',
            isSelected: (userIncomingApprovals ?? []).filter(x => x.approvalId !== "default-incoming").length === 0,
          }
        ]
        }
        onSwitchChange={(value) => {
          if (value === 0) {
            setUserIncomingApprovals?.([{
              fromMappingId: "AllWithMint",
              fromMapping: getReservedAddressMapping("AllWithMint"),
              initiatedByMapping: getReservedAddressMapping("AllWithMint"),
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
      </>}
      {(isIncomingApprovalEdit || isOutgoingApprovalEdit) && <br />}

    </div >

    <div className='dark:text-white'>

      {!(isIncomingApprovalEdit || isOutgoingApprovalEdit) && !hideSelect && <>
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

      {tab == 'collection' && <div>
        <TransferabilityTab
          collectionId={collectionId}
        />

      </div>}

      {tab === 'history' && <div className='dark:text-white'>
        <br />
        {updateHistory.sort((a, b) => a.block > b.block ? -1 : 1).map((update, i) => {
          return <div key={i} style={{ textAlign: 'left' }} className='dark:text-white'>
            <Typography.Text strong className='dark:text-white' style={{ fontSize: '1.2em' }}>
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
            className='dark:text-white'
            description={<>
              This user has never updated their approvals.
            </>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>}
      </div>}

      {approverAccount?.address && <>
        {tab === 'outgoing' && <>
          <ApprovalsDisplay
            approvals={castedOutgoingApprovals}
            collection={collection}
            badgeId={badgeId}
            approvalLevel='outgoing'
            startingApprovals={castOutgoingTransfersToCollectionTransfers(startingOutgoingApprovals, approverAccount.address)}
            approverAddress={approverAccount?.address ?? ''}
            onDelete={setUserOutgoingApprovals ? (approvalId: string) => {
              setUserOutgoingApprovals?.((userOutgoingApprovals ?? []).filter(x => x.approvalId !== approvalId));
            } : undefined}
            addMoreNode={setUserOutgoingApprovals ? <>
              <>
                <div className='flex-center'>
                  <IconButton
                    src={visible ? <CloseOutlined /> : <PlusOutlined />}
                    onClick={() => {
                      setVisible(!visible);
                    }}
                    text={visible ? 'Cancel' : 'Add'}
                  />
                </div>

                {visible &&
                  <>
                    <div style={{ justifyContent: 'center', width: '100%' }}>
                      <br />
                      <div>
                        <ApprovalSelect
                          defaultToMapping={getReservedAddressMapping("All")}
                          fromMappingLocked={true}
                          defaultFromMapping={getReservedAddressMapping(approverAccount?.address)}
                          collectionId={collectionId}
                          hideTransferDisplay={true}
                          setVisible={setVisible}
                          distributionMethod={distributionMethod}
                          setDistributionMethod={setDistributionMethod}
                          showMintingOnlyFeatures={false}
                          approvalsToAdd={castedOutgoingApprovals}
                          setApprovalsToAdd={(approvalsToAdd: CollectionApprovalWithDetails<bigint>[]) => {
                            setUserOutgoingApprovals?.(approvalsToAdd.map(x => castFromCollectionTransferToOutgoingTransfer(x)));
                          }}
                          hideCollectionOnlyFeatures
                          startingApprovals={
                            castOutgoingTransfersToCollectionTransfers(collection.owners?.find(x => x.cosmosAddress === approverAccount?.address)?.outgoingApprovals ?? [], approverAccount.address)
                          }
                          approvalPermissions={
                            castUserOutgoingApprovalPermissionToCollectionApprovalPermission(
                              (collection.owners?.find(x => x.cosmosAddress === approverAccount?.address)?.userPermissions.canUpdateOutgoingApprovals ?? []).map(x => {
                                return {
                                  ...x,
                                  toMapping: getReservedAddressMapping(x.toMappingId),
                                  initiatedByMapping: getReservedAddressMapping(x.initiatedByMappingId),
                                }
                              }),
                              approverAccount.address
                            )
                          }

                        />
                      </div>
                    </div >
                  </>}
              </>
            </> : <></>}
          />
        </>}

        {tab === 'incoming' && <>
          <ApprovalsDisplay
            approvals={castedIncomingApprovals}
            collection={collection}
            badgeId={badgeId}
            approvalLevel='incoming'
            startingApprovals={castIncomingTransfersToCollectionTransfers(startingIncomingApprovals, approverAccount.address)}
            approverAddress={approverAccount?.address ?? ''}
            onDelete={setUserIncomingApprovals ? (approvalId: string) => {
              setUserIncomingApprovals?.((userIncomingApprovals ?? []).filter(x => x.approvalId !== approvalId));
            } : undefined}
            addMoreNode={setUserIncomingApprovals ? <>
              <>
                <div className='flex-center'>
                  <IconButton
                    src={visible ? <CloseOutlined /> : <PlusOutlined />}
                    onClick={() => {
                      setVisible(!visible);
                    }}
                    text={visible ? 'Cancel' : 'Add'}
                  />
                </div>

                {visible &&
                  <>
                    <div style={{ justifyContent: 'center', width: '100%' }}>
                      <br />
                      <div>
                        <ApprovalSelect
                          defaultFromMapping={getReservedAddressMapping("All")}
                          toMappingLocked={true}
                          defaultToMapping={getReservedAddressMapping(approverAccount?.address)}
                          collectionId={collectionId}
                          hideTransferDisplay={true}
                          setVisible={setVisible}
                          distributionMethod={distributionMethod}
                          setDistributionMethod={setDistributionMethod}
                          showMintingOnlyFeatures={false}
                          approvalsToAdd={castedIncomingApprovals}
                          setApprovalsToAdd={(approvalsToAdd: CollectionApprovalWithDetails<bigint>[]) => {
                            setUserIncomingApprovals(approvalsToAdd.map(x => castFromCollectionTransferToIncomingTransfer(x)));
                          }}
                          hideCollectionOnlyFeatures
                          startingApprovals={
                            castIncomingTransfersToCollectionTransfers(collection.owners?.find(x => x.cosmosAddress === approverAccount?.address)?.incomingApprovals ?? [], approverAccount.address)
                          }
                          approvalPermissions={
                            castUserIncomingApprovalPermissionToCollectionApprovalPermission(
                              (collection.owners?.find(x => x.cosmosAddress === approverAccount?.address)?.userPermissions.canUpdateIncomingApprovals ?? []).map(x => {
                                return {
                                  ...x,
                                  fromMapping: getReservedAddressMapping(x.fromMappingId),
                                  initiatedByMapping: getReservedAddressMapping(x.initiatedByMappingId),
                                }
                              }),
                              approverAccount.address
                            )
                          }
                        />
                      </div>
                    </div >
                  </>}
              </>
            </> : <></>}
          />
        </>}
      </>}
    </div>

  </>
  );
}
