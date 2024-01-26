import { CloseOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Switch } from 'antd';
import { BitBadgesCollection, CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails, DistributionMethod, getReservedAddressList, getUnhandledCollectionApprovals, getUnhandledUserIncomingApprovals, getUnhandledUserOutgoingApprovals, isInAddressList, validateCollectionApprovalsUpdate } from 'bitbadgesjs-utils';
import { FC, useState } from 'react';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { compareObjects } from '../../../utils/compare';
import { EmptyIcon } from '../../common/Empty';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { ApprovalSelect } from '../../transfers/ApprovalSelect';
import { TransferabilityDisplay } from './TransferabilityDisplay';

//We have a couple wrapper components
//Editable means we will display the add more and edit button where applicable
//Display means we will not display anything to edit (read-only)

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
  hideActions?: boolean;
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
    fromListLocked={isOutgoingDisplay || isMintDisplay}
    toListLocked={isIncomingDisplay}

    defaultToList={isIncomingDisplay ? getReservedAddressList(approverAddress) : getReservedAddressList("All")}
    defaultFromList={isMintDisplay ? getReservedAddressList("Mint") : isOutgoingDisplay ?
      getReservedAddressList(approverAddress)
      : isPostMintDisplay ? getReservedAddressList("!Mint") : getReservedAddressList("All")
    }
    defaultInitiatedByList={getReservedAddressList(chain.cosmosAddress)}
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
  hideActions,
  title, addMoreNode, onDelete, editable, approvals, collection, badgeId, filterFromMint, hideHelperMessage, approvalLevel, approverAddress, onlyShowFromMint
}) => {
  const [showHidden, setShowHidden] = useState<boolean>(defaultShowDisallowed ?? false);
  const chain = useChainContext();
  const txTimelineContext = useTxTimelineContext();
  const [address, setAddress] = useState<string>(chain.address);
  const [filterByBadgeId, setFilterByBadgeId] = useState<boolean>(!!badgeId);
  const deletedApprovals = startingApprovals?.filter(x => !approvals.find(y => compareObjects(x, y)));
  const [showUserApprovalsOnly, setShowUserApprovalsOnly] = useState<boolean>(false);

  //Initial cleansing
  approvals = approvals.filter((x, i) => approvals.findIndex(y => y.approvalId === x.approvalId) === i); //filter approvals to only take first time an approvalId is seen (used for duplicates "self-initiated-incoming" and "self-initiated-outgoing")
  startingApprovals = !txTimelineContext.existingCollectionId || txTimelineContext.existingCollectionId == 0n ? [] : startingApprovals;  //To get rid of saying that the default 24 hour manager approval is "Existing"

  let disapproved = showHidden ? approvalLevel === "incoming" ? getUnhandledUserIncomingApprovals(approvals, approverAddress, true)
    : approvalLevel === "outgoing" ? getUnhandledUserOutgoingApprovals(approvals, approverAddress, true)
      : getUnhandledCollectionApprovals(approvals, true, true) : [];

  if (onlyShowFromMint) {
    approvals = approvals.filter(x => isInAddressList(x.fromList, 'Mint'))
    approvals = approvals.map(x => {
      return {
        ...x,
        fromList: getReservedAddressList('Mint'),
        fromListId: 'Mint',
      }
    })

    disapproved = disapproved.filter(x => isInAddressList(x.fromList, 'Mint'))
    disapproved = disapproved.map(x => {
      return {
        ...x,
        fromList: getReservedAddressList('Mint'),
        fromListId: 'Mint',
      }
    })
  }

  if (showUserApprovalsOnly) {
    approvals = approvals.filter(x => isInAddressList(x.initiatedByList, chain.cosmosAddress))
    disapproved = disapproved.filter(x => isInAddressList(x.initiatedByList, chain.cosmosAddress))
  }

  //Three levels of rows (current, grayed out (deleted), and disapproved)
  const getRows = () => {
    return <>
      {approvals.map((x, idx) => {
        const result = <TransferabilityDisplay
          startingApprovals={startingApprovals}
          approvalPermissions={approvalPermissions ?? []}
          setAllApprovals={setApprovals ? setApprovals : () => { }}
          editable={editable}
          approverAddress={approverAddress}
          onDelete={onDelete}
          allApprovals={approvals}
          address={address}
          setAddress={setAddress}
          isIncomingDisplay={approvalLevel === "incoming"}
          isOutgoingDisplay={approvalLevel === "outgoing"}
          approval={x}
          hideActions={hideActions}

          key={idx}
          badgeId={filterByBadgeId ? badgeId : undefined}
          collectionId={collection.collectionId}
          filterFromMint={filterFromMint}
        />
        return result
      })}

      {showDeletedGrayedOut && deletedApprovals?.map((x, idx) => {
        const result = <TransferabilityDisplay grayedOut
          setAllApprovals={setApprovals ? setApprovals : () => { }}
          approvalPermissions={approvalPermissions ?? []}
          onRestore={onRestore ? onRestore : () => { }}
          allApprovals={approvals}
          address={address}
          setAddress={setAddress}
          isIncomingDisplay={approvalLevel === "incoming"}
          isOutgoingDisplay={approvalLevel === "outgoing"}
          hideActions={hideActions}
          approval={x}
          key={idx}
          badgeId={badgeId} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
        return result
      })}

      {disapproved.map((x, idx) => {
        const result = <TransferabilityDisplay
          setAllApprovals={setApprovals ? setApprovals : () => { }}
          approvalPermissions={approvalPermissions ?? []}
          onDelete={onDelete} allApprovals={approvals}
          hideActions={hideActions}

          address={address} setAddress={setAddress} isIncomingDisplay={approvalLevel === "incoming"}
          isOutgoingDisplay={approvalLevel === "outgoing"} disapproved approval={x}
          key={idx}
          badgeId={filterByBadgeId ? badgeId : undefined} collectionId={collection.collectionId} filterFromMint={filterFromMint} />
        return result
      })}
    </>
  }

  let hasRows = false;
  if (approvals.length > 0) hasRows = true;
  if (showDeletedGrayedOut && deletedApprovals && deletedApprovals?.length > 0) hasRows = true;
  if (disapproved.length > 0) hasRows = true;

  return <>
    <br />

    <InformationDisplayCard
      title={title ?? ''}
      span={24} subtitle={subtitle}
      noBorder inheritBg
      noPadding
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
          checkedChildren={`Filter by Badge ID ${badgeId}?`}
          unCheckedChildren={`Filter by Badge ID ${badgeId}?`}
          checked={filterByBadgeId}
          onChange={(checked) => setFilterByBadgeId(checked)}
        />}

        <Switch
          checkedChildren="Hide Disapprovals?"
          unCheckedChildren="Hide Disapprovals?"
          checked={!showHidden}
          onChange={(checked) => setShowHidden(!checked)}
        />

        {chain.address && chain.connected && <Switch
          style={{ margin: 10 }}
          checkedChildren="My Approvals Only?"
          unCheckedChildren="My Approvals Only?"
          checked={showUserApprovalsOnly}
          onChange={(checked) => setShowUserApprovalsOnly(checked)}
        />}
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
          <InfoCircleOutlined />{' '}{"Successful transfers require sufficient balances from the sender and must satisfy the collection approvals, sender's outgoing approvals, and recipient's incoming approvals where applicable."}
        </p></>}
      <Divider />
    </InformationDisplayCard >
  </>
}
