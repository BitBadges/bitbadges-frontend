import { ClockCircleOutlined, CloseOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Empty, Switch, Typography } from 'antd';
import { BitBadgesCollection, CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails, DistributionMethod, UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails, appendDefaultForIncoming, appendDefaultForOutgoing, castIncomingTransfersToCollectionTransfers, castOutgoingTransfersToCollectionTransfers, castUserIncomingApprovalPermissionToCollectionApprovalPermission, castUserOutgoingApprovalPermissionToCollectionApprovalPermission, getReservedAddressMapping, getUnhandledCollectionApprovals, getUnhandledUserIncomingApprovals, getUnhandledUserOutgoingApprovals, isInAddressMapping, validateCollectionApprovalsUpdate } from 'bitbadgesjs-utils';
import { FC, useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchBalanceForUser, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { NODE_API_URL } from '../../constants';
import { compareObjects } from '../../utils/compare';
import { GO_MAX_UINT_64 } from '../../utils/dates';
import { AddressSelect } from '../address/AddressSelect';
import IconButton from '../display/IconButton';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { Tabs } from '../navigation/Tabs';
import { ApprovalSelect } from '../transfers/ApprovalSelect';
import { SwitchForm } from '../tx-timelines/form-items/SwitchForm';
import { UserPermissionsOverview } from './PermissionsInfo';
import { TransferabilityRow } from './TransferabilityRow';
import { TransferabilityTab } from './TransferabilityTab';
import { EmptyIcon } from '../common/Empty';
import { useTxTimelineContext } from '../../bitbadges-api/contexts/TxTimelineContext';

interface DisplayProps {
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
  defaultShowDisallowed?: boolean;
}

interface EditableProps extends DisplayProps {
  editable: boolean;
  showDeletedGrayedOut?: boolean;
  startingApprovals: CollectionApprovalWithDetails<bigint>[];
  approvalPermissions: CollectionApprovalPermissionWithDetails<bigint>[];
  setApprovals: (approvals: CollectionApprovalWithDetails<bigint>[]) => void;
  mintingOnly: boolean;
  defaultApproval?: CollectionApprovalWithDetails<bigint>;
}

type FullProps = DisplayProps & Partial<EditableProps> & {
  editable?: boolean,
  onDelete?: (approvalId: string) => void,
  onRestore?: (approvalId: string) => void,
  addMoreNode?: React.ReactNode
};


export const ApprovalSelectWrapper: FC<{
  startingApprovals: CollectionApprovalWithDetails<bigint>[];
  approvalPermissions: CollectionApprovalPermissionWithDetails<bigint>[];
  approvals: CollectionApprovalWithDetails<bigint>[];
  setApprovals: (approvals: CollectionApprovalWithDetails<bigint>[]) => void;
  collection: BitBadgesCollection<bigint>;
  approverAddress: string;
  mintingOnly: boolean;
  setVisible: (visible: boolean) => void;
  defaultApproval?: CollectionApprovalWithDetails<bigint>;
  approvalLevel: string;
} & { setVisible: (visible: boolean) => void }> = (props) => {
  const startingApprovals = props.startingApprovals;
  const approvalPermissions = props.approvalPermissions;
  const approvals = props.approvals;
  const setApprovals = props.setApprovals;
  const collection = props.collection;
  const approverAddress = props.approverAddress;
  const mintingOnly = props.mintingOnly;
  const setVisible = props.setVisible;
  const isIncomingDisplay = props.approvalLevel === "incoming";
  const isOutgoingDisplay = props.approvalLevel === "outgoing";
  const isPostMintDisplay = !isIncomingDisplay && !isOutgoingDisplay && !mintingOnly;
  const isMintDisplay = !isIncomingDisplay && !isOutgoingDisplay && mintingOnly;
  const defaultApproval = props.defaultApproval;
  const chain = useChainContext();

  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>(DistributionMethod.None);

  return <ApprovalSelect
    fromMappingLocked={isOutgoingDisplay || isMintDisplay}
    toMappingLocked={isIncomingDisplay}

    defaultToMapping={
      isIncomingDisplay ? getReservedAddressMapping(approverAddress) : getReservedAddressMapping("All")}
    defaultFromMapping={isMintDisplay ? getReservedAddressMapping("Mint") : isOutgoingDisplay ?
      getReservedAddressMapping(approverAddress)
      : isPostMintDisplay ? getReservedAddressMapping("AllWithoutMint") : getReservedAddressMapping("All")
    }
    defaultInitiatedByMapping={{
      ...getReservedAddressMapping(chain.cosmosAddress),
      mappingId: chain.cosmosAddress,
      includeAddresses: true
    }}
    defaultApproval={defaultApproval}
    collectionId={collection.collectionId}
    hideTransferDisplay={true}
    setVisible={setVisible}
    distributionMethod={distributionMethod}
    setDistributionMethod={setDistributionMethod}
    showMintingOnlyFeatures={isMintDisplay}
    approvalsToAdd={approvals}
    setApprovalsToAdd={setApprovals}
    hideCollectionOnlyFeatures={isIncomingDisplay || isOutgoingDisplay}
    startingApprovals={startingApprovals}
    approvalPermissions={approvalPermissions}
  />
}


export const EditableApprovalsDisplay: FC<EditableProps> = (props) => {
  const editable = props.editable;
  const startingApprovals = props.startingApprovals;
  const approvalPermissions = props.approvalPermissions;
  const approvals = props.approvals;

  const setApprovals = props.setApprovals;

  const [addMoreIsVisible, setAddMoreIsVisible] = useState<boolean>(false);

  const onRestore = (approvalId: string) => {
    const approvalsToAdd = approvals;
    const x = startingApprovals.find(x => x.approvalId === approvalId);
    if (!x) return;

    if (approvalsToAdd?.find(y => y.approvalId === x.approvalId)) {
      alert('This approval ID is already used.');
      return;
    }
    setApprovals?.([...approvalsToAdd, x]);
  }

  const onDelete = (approvalId: string) => {
    const postApprovalsToAdd = approvals.filter(x => x.approvalId !== approvalId);

    let hasValidateUpdateError = validateCollectionApprovalsUpdate(startingApprovals, postApprovalsToAdd, approvalPermissions);
    if (hasValidateUpdateError && !confirm("This update is disallowed by the collection permissions. See the current permissions by clicking Permission at the top of the page. Please confirm this action was intended. Details: " + hasValidateUpdateError.message)) {
      return;
    }

    //Overwrite duplicate approval IDs
    setApprovals(approvals.filter(x => x.approvalId !== approvalId));
  }

  const addMoreNode =
    <>
      <div className='flex-center'>
        <IconButton
          src={addMoreIsVisible ? <CloseOutlined /> : <PlusOutlined />}
          onClick={() => {
            setAddMoreIsVisible(!addMoreIsVisible);
          }}
          text={addMoreIsVisible ? 'Cancel' : 'Add'}
        />
      </div>

      {
        addMoreIsVisible &&
        <>
          <div style={{ justifyContent: 'center', width: '100%' }}>
            <br />
            <div>
              <ApprovalSelectWrapper {...props} setVisible={setAddMoreIsVisible} />
            </div>
          </div >
        </>
      }
    </>

  const editableProps = editable ? {
    onDelete, addMoreNode, onRestore, editable
  } : {};

  return <FullApprovalsDisplay
    {...props}
    {...editableProps}
  />
}

export const ApprovalsDisplay: FC<DisplayProps> = (props) => {
  return <FullApprovalsDisplay {...props} />
}

const FullApprovalsDisplay: FC<FullProps> = ({
  setApprovals,
  startingApprovals,
  onRestore,
  approvalPermissions,
  showDeletedGrayedOut,
  subtitle,
  defaultShowDisallowed,
  title, addMoreNode, onDelete, editable, approvals, collection, badgeId, filterFromMint, hideHelperMessage, approvalLevel, approverAddress, onlyShowFromMint
}) => {
  const [showHidden, setShowHidden] = useState<boolean>(defaultShowDisallowed ?? false);
  const chain = useChainContext();
  const txTimelineContext = useTxTimelineContext();
  //To get rid of saying that the default 24 hour manager approval is "Exsiting"
  startingApprovals = !txTimelineContext.existingCollectionId || txTimelineContext.existingCollectionId == 0n ? [] : startingApprovals;

  let disapproved = showHidden ? approvalLevel === "incoming" ? getUnhandledUserIncomingApprovals(approvals, approverAddress, true)
    : approvalLevel === "outgoing" ? getUnhandledUserOutgoingApprovals(approvals, approverAddress, true)
      : getUnhandledCollectionApprovals(approvals, true, true) : [];

  //filter approvals to only take first time an approvalId is seen (used for duplicates "default-incoming" and "default-outgoing")
  approvals = approvals.filter((x, i) => approvals.findIndex(y => y.approvalId === x.approvalId) === i);

  const [address, setAddress] = useState<string>(chain.address);
  const [filterByBadgeId, setFilterByBadgeId] = useState<boolean>(!!badgeId);

  const deletedApprovals = startingApprovals?.filter(x => !approvals.find(y => compareObjects(x, y)));

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

  const getRows = () => {
    return <>
      {
        <>
          {approvals.map((x, idx) => {
            const result = <TransferabilityRow
              startingApprovals={startingApprovals}
              approvalPermissions={approvalPermissions ?? []}
              setAllTransfers={setApprovals ? setApprovals : () => { }}
              editable={editable}
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
              setAllTransfers={setApprovals ? setApprovals : () => { }}
              approvalPermissions={approvalPermissions ?? []}
              onRestore={onRestore ? onRestore : () => { }}
              allTransfers={approvals}
              address={address}
              setAddress={setAddress}
              isIncomingDisplay={approvalLevel === "incoming"}
              isOutgoingDisplay={approvalLevel === "outgoing"}
              transfer={x} key={idx}
              badgeId={badgeId} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
            return result
          })}

          {disapproved.map((x, idx) => {
            const result = <TransferabilityRow
              setAllTransfers={setApprovals ? setApprovals : () => { }}
              approvalPermissions={approvalPermissions ?? []}
              onDelete={onDelete} allTransfers={approvals}
              address={address} setAddress={setAddress} isIncomingDisplay={approvalLevel === "incoming"}
              isOutgoingDisplay={approvalLevel === "outgoing"} disapproved transfer={x} key={idx}
              badgeId={filterByBadgeId ? badgeId : undefined} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
            return result
          })}
        </>
      }
    </>
  }

  let hasRows = false;
  if (approvals.length > 0) hasRows = true;
  if (showDeletedGrayedOut && deletedApprovals && deletedApprovals?.length > 0) hasRows = true;
  if (disapproved.length > 0) hasRows = true;

  return <>
    <br />

    <InformationDisplayCard


      title={title ?? ''

      }
      span={24} subtitle={subtitle}
      noBorder inheritBg
    >

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
        {getRows()}
        {!hasRows && <EmptyIcon description='No approvals found.' />}
      </div>
      <br />
      {addMoreNode}
      {!hideHelperMessage && <>
        <Divider />
        <p className='secondary-text'>
          <InfoCircleOutlined />{' '}{"Successful transfers require sufficient balances from the sender and must satisfy the collection approvals, in addition to the sender's outgoing approvals and recipient's incoming approvals (if applicable)."}
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
  hideDefaults,
  showingDefaults,
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
  hideDefaults?: boolean,
  showingDefaults?: boolean,
}) {

  const chain = useChainContext();
  const collection = useCollection(collectionId);


  const [address, setAddress] = useState<string>(defaultApprover ?? chain.address);
  const [tab, setTab] = useState<string>(isIncomingApprovalEdit ? 'incoming' : 'outgoing');

  const approverAccount = useAccount(address);

  //Initial or currently set ones
  const startingOutgoingApprovals = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.outgoingApprovals ?? [];
  const startingIncomingApprovals = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.incomingApprovals ?? [];

  const outgoingApprovals = userOutgoingApprovals ? userOutgoingApprovals : collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.outgoingApprovals ?? [];
  const incomingApprovals = userIncomingApprovals ? userIncomingApprovals : collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.incomingApprovals ?? [];
  const updateHistory = collection?.owners.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.updateHistory ?? [];

  useEffect(() => {
    if (address) fetchBalanceForUser(collectionId, address);
  }, [address, collectionId])


  if (!collection) return <></>;


  const appendDefaultIncoming = collection.owners?.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.autoApproveSelfInitiatedIncomingTransfers ?? collection.defaultBalances.autoApproveSelfInitiatedIncomingTransfers;
  const appendDefaultOutgoing = collection.owners?.find(x => x.cosmosAddress === approverAccount?.cosmosAddress)?.autoApproveSelfInitiatedOutgoingTransfers ?? collection.defaultBalances.autoApproveSelfInitiatedOutgoingTransfers;

  // console.log(appendDefaultForOutgoing(outgoingApprovals, approverAccount?.cosmosAddress ?? ''))

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
    <div className='primary-text'>

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

    <div className='primary-text'>

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
        <UserApprovalsTab
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
              <p><a href={NODE_API_URL + '/cosmos/tx/v1beta1/txs/' + update.txHash} target='_blank' rel='noopener noreferrer'>
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
            badgeId={badgeId}
            mintingOnly={false}
            approvalLevel='outgoing'
            editable={!!setUserOutgoingApprovals}
            startingApprovals={castOutgoingTransfersToCollectionTransfers(startingOutgoingApprovals, approverAccount.address)}
            approverAddress={approverAccount?.address ?? ''}
            setApprovals={setUserOutgoingApprovals ?? (() => { })}
            approvalPermissions={castUserOutgoingApprovalPermissionToCollectionApprovalPermission(
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
        </>}

        {tab === 'incoming' && <>
          <EditableApprovalsDisplay
            approvals={castedIncomingApprovals}
            collection={collection}
            badgeId={badgeId}
            approvalLevel='incoming'
            mintingOnly={false}
            editable={!!setUserIncomingApprovals}
            startingApprovals={castIncomingTransfersToCollectionTransfers(startingIncomingApprovals, approverAccount.address)}
            approverAddress={approverAccount?.address ?? ''}
            setApprovals={setUserIncomingApprovals ?? (() => { })}
            approvalPermissions={castUserIncomingApprovalPermissionToCollectionApprovalPermission(
              (collection.owners?.find(x => x.cosmosAddress === approverAccount?.address)?.userPermissions.canUpdateIncomingApprovals ?? []).map(x => {
                return {
                  ...x,
                  fromMapping: getReservedAddressMapping(x.fromMappingId),
                  initiatedByMapping: getReservedAddressMapping(x.initiatedByMappingId),
                }
              }),
              approverAccount.address
            )}
          />
        </>}
      </>}
    </div>

  </>
  );
}
