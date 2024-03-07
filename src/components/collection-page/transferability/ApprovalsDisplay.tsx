import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import {
  AddressList,
  CollectionApprovalPermissionWithDetails,
  CollectionApprovalWithDetails,
  UserIncomingApprovalWithDetails,
  UserOutgoingApprovalWithDetails,
  getUnhandledCollectionApprovals,
  getUnhandledUserIncomingApprovals,
  getUnhandledUserOutgoingApprovals,
  validateCollectionApprovalsUpdate
} from 'bitbadgesjs-sdk';
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

type ApprovalType = CollectionApprovalWithDetails<bigint> | UserOutgoingApprovalWithDetails<bigint> | UserIncomingApprovalWithDetails<bigint>;

interface DisplayProps<T extends ApprovalType = CollectionApprovalWithDetails<bigint>> {
  approvals: T[];
  collectionId: bigint;
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
  forceMobile?: boolean;
}

interface EditableProps<T extends ApprovalType = CollectionApprovalWithDetails<bigint>> extends DisplayProps<T> {
  editable: boolean;
  showDeletedGrayedOut?: boolean;
  startingApprovals: Array<CollectionApprovalWithDetails<bigint>>;
  approvalPermissions: Array<CollectionApprovalPermissionWithDetails<bigint>>;
  setApprovals: (approvals: Array<CollectionApprovalWithDetails<bigint>>) => void;
  mintingOnly: boolean;
  defaultApproval?: CollectionApprovalWithDetails<bigint>;
}

type FullProps = DisplayProps &
  Partial<EditableProps> & {
    editable?: boolean;
    onDelete?: (approvalId: string) => void;
    onRestore?: (approvalId: string) => void;
    addMoreNode?: React.ReactNode;
  };

export const ApprovalSelectWrapper: FC<
  {
    startingApprovals: Array<CollectionApprovalWithDetails<bigint>>;
    approvalPermissions: Array<CollectionApprovalPermissionWithDetails<bigint>>;
    approvals: Array<CollectionApprovalWithDetails<bigint>>;
    setApprovals: (approvals: Array<CollectionApprovalWithDetails<bigint>>) => void;
    collectionId: bigint;
    approverAddress: string;
    mintingOnly: boolean;
    setVisible: (visible: boolean) => void;
    defaultApproval?: CollectionApprovalWithDetails<bigint>;
    approvalLevel: string;
    forceMobile?: boolean;
  } & { setVisible: (visible: boolean) => void }
> = (props) => {
  const startingApprovals = props.startingApprovals;
  const approvalPermissions = props.approvalPermissions;
  const approvals = props.approvals;
  const setApprovals = props.setApprovals;
  const collectionId = props.collectionId;
  const approverAddress = props.approverAddress;
  const mintingOnly = props.mintingOnly;
  const setVisible = props.setVisible;
  const isIncomingDisplay = props.approvalLevel === 'incoming';
  const isOutgoingDisplay = props.approvalLevel === 'outgoing';
  const isPostMintDisplay = !isIncomingDisplay && !isOutgoingDisplay && !mintingOnly;
  const isMintDisplay = !isIncomingDisplay && !isOutgoingDisplay && mintingOnly;
  const defaultApproval = props.defaultApproval;
  const chain = useChainContext();

 

  return (
    <ApprovalSelect
      fromListLocked={isOutgoingDisplay || isMintDisplay}
      toListLocked={isIncomingDisplay}
      defaultToList={isIncomingDisplay ? AddressList.getReservedAddressList(approverAddress) : AddressList.AllAddresses()}
      defaultFromList={
        isMintDisplay
          ? AddressList.getReservedAddressList('Mint')
          : isOutgoingDisplay
            ? AddressList.getReservedAddressList(approverAddress)
            : isPostMintDisplay
              ? AddressList.getReservedAddressList('!Mint')
              : AddressList.AllAddresses()
      }
      defaultInitiatedByList={AddressList.getReservedAddressList(chain.cosmosAddress)}
      defaultApproval={defaultApproval}
      collectionId={collectionId}
      hideTransferDisplay={true}
      setVisible={setVisible}
      showMintingOnlyFeatures={isMintDisplay}
      approvalsToAdd={approvals}
      setApprovalsToAdd={setApprovals}
      hideCollectionOnlyFeatures={isIncomingDisplay || isOutgoingDisplay}
      startingApprovals={startingApprovals}
      approvalPermissions={approvalPermissions}
    />
  );
};

export const EditableApprovalsDisplay: FC<EditableProps> = (props) => {
  const editable = props.editable;
  const startingApprovals = props.startingApprovals;
  const approvalPermissions = props.approvalPermissions;
  const approvals = props.approvals;
  const setApprovals = props.setApprovals;

  const [addMoreIsVisible, setAddMoreIsVisible] = useState<boolean>(false);

  const onRestore = (approvalId: string) => {
    const approvalsToAdd = approvals;
    const x = startingApprovals.find((x) => x.approvalId === approvalId);
    if (!x) return;

    if (approvalsToAdd?.find((y) => y.approvalId === x.approvalId)) {
      alert('This approval ID is already used.');
      return;
    }
    setApprovals?.([...approvalsToAdd, x]);
  };

  const onDelete = (approvalId: string) => {
    const postApprovalsToAdd = approvals.filter((x) => x.approvalId !== approvalId);

    const hasValidateUpdateError = validateCollectionApprovalsUpdate(startingApprovals, postApprovalsToAdd, approvalPermissions);
    if (
      hasValidateUpdateError &&
      !confirm(
        'This update is disallowed by the collection permissions. See the current permissions by clicking Permission at the top of the page. Please confirm this action was intended. Details: ' +
          hasValidateUpdateError.message
      )
    ) {
      return;
    }

    setApprovals(approvals.filter((x) => x.approvalId !== approvalId));
  };

  const addMoreNode = (
    <>
      <div className="flex-center mt-4">
        <IconButton
          src={addMoreIsVisible ? <CloseOutlined /> : <PlusOutlined />}
          onClick={() => {
            setAddMoreIsVisible(!addMoreIsVisible);
          }}
          text={addMoreIsVisible ? 'Cancel' : 'Add'}
        />
      </div>

      {addMoreIsVisible && (
        <>
          <div style={{ justifyContent: 'center', width: '100%' }}>
            <br />
            <div>
              <ApprovalSelectWrapper {...props} setVisible={setAddMoreIsVisible} />
            </div>
          </div>
        </>
      )}
    </>
  );

  const editableProps = editable
    ? {
        onDelete,
        addMoreNode,
        onRestore,
        editable
      }
    : {};

  return <FullApprovalsDisplay {...props} {...editableProps} />;
};

export const ApprovalsDisplay: FC<DisplayProps> = (props) => {
  return <FullApprovalsDisplay {...props} />;
};

const FullApprovalsDisplay: FC<FullProps> = ({
  setApprovals,
  startingApprovals,
  onRestore,
  approvalPermissions,
  showDeletedGrayedOut,
  subtitle,
  defaultShowDisallowed,
  hideActions,
  title,
  addMoreNode,
  onDelete,
  editable,
  approvals,
  collectionId,
  badgeId,
  filterFromMint,
  approvalLevel,
  approverAddress,
  onlyShowFromMint,
  forceMobile
}) => {
  const [showHidden, setShowHidden] = useState<boolean>(defaultShowDisallowed ?? false);
  const chain = useChainContext();
  const txTimelineContext = useTxTimelineContext();
  const [address, setAddress] = useState<string>(chain.address);
  const [filterByBadgeId, setFilterByBadgeId] = useState<boolean>(!!badgeId);
  const deletedApprovals = startingApprovals?.filter((x) => !approvals.find((y) => compareObjects(x, y)));
  const [showUserApprovalsOnly, setShowUserApprovalsOnly] = useState<boolean>(false);

  approvals = approvals.map((x) => x.clone());

  //Initial cleansing
  approvals = approvals.filter((x, i) => approvals.findIndex((y) => y.approvalId === x.approvalId) === i); //filter approvals to only take first time an approvalId is seen (used for duplicates "self-initiated-incoming" and "self-initiated-outgoing")
  startingApprovals = !txTimelineContext.existingCollectionId || txTimelineContext.existingCollectionId == 0n ? [] : startingApprovals; //To get rid of saying that the default 24 hour manager approval is "Existing"

  let disapproved = showHidden
    ? approvalLevel === 'incoming'
      ? getUnhandledUserIncomingApprovals(
          approvals.map((x) => x.castToIncomingApproval()),
          approverAddress,
          true
        )
      : approvalLevel === 'outgoing'
        ? getUnhandledUserOutgoingApprovals(
            approvals.map((x) => x.castToOutgoingApproval()),
            approverAddress,
            true
          )
        : getUnhandledCollectionApprovals(approvals, true, true)
    : [];

  if (onlyShowFromMint) {
    approvals = approvals.filter((x) => x.fromList.checkAddress('Mint'));
    approvals = approvals.map((x) => {
      x.fromList = AddressList.getReservedAddressList('Mint');
      x.fromListId = 'Mint';
      return x;
    });

    disapproved = disapproved.filter((x) => x.fromList.checkAddress('Mint'));
    disapproved = disapproved.map((x) => {
      x.fromList = AddressList.getReservedAddressList('Mint');
      x.fromListId = 'Mint';
      return x;
    });
  }

  if (showUserApprovalsOnly) {
    approvals = approvals.filter((x) => x.initiatedByList.checkAddress(chain.cosmosAddress));
    disapproved = disapproved.filter((x) => x.initiatedByList.checkAddress(chain.cosmosAddress));
  }

  //Three levels of rows (current, grayed out (deleted), and disapproved)
  const getRows = () => {
    return (
      <>
        {approvals.map((x, idx) => {
          const result = (
            <TransferabilityDisplay
              startingApprovals={startingApprovals}
              approvalPermissions={approvalPermissions ?? []}
              setAllApprovals={setApprovals ? setApprovals : () => {}}
              editable={editable}
              approverAddress={approverAddress}
              onDelete={onDelete}
              allApprovals={approvals}
              address={address}
              setAddress={setAddress}
              isIncomingDisplay={approvalLevel === 'incoming'}
              isOutgoingDisplay={approvalLevel === 'outgoing'}
              approval={x}
              hideActions={hideActions}
              key={idx}
              badgeId={filterByBadgeId ? badgeId : undefined}
              collectionId={collectionId}
              filterFromMint={filterFromMint}
              forceMobile={forceMobile}
            />
          );
          return result;
        })}

        {showDeletedGrayedOut &&
          deletedApprovals?.map((x, idx) => {
            const result = (
              <TransferabilityDisplay
                grayedOut
                setAllApprovals={setApprovals ? setApprovals : () => {}}
                approvalPermissions={approvalPermissions ?? []}
                onRestore={onRestore ? onRestore : () => {}}
                allApprovals={approvals}
                address={address}
                setAddress={setAddress}
                isIncomingDisplay={approvalLevel === 'incoming'}
                isOutgoingDisplay={approvalLevel === 'outgoing'}
                hideActions={hideActions}
                approval={x}
                key={idx}
                badgeId={badgeId}
                collectionId={collectionId}
                filterFromMint={filterFromMint}
                forceMobile={forceMobile}
              />
            );
            return result;
          })}

        {disapproved.map((x, idx) => {
          const result = (
            <TransferabilityDisplay
              setAllApprovals={setApprovals ? setApprovals : () => {}}
              approvalPermissions={approvalPermissions ?? []}
              onDelete={onDelete}
              allApprovals={approvals}
              hideActions={hideActions}
              address={address}
              setAddress={setAddress}
              isIncomingDisplay={approvalLevel === 'incoming'}
              isOutgoingDisplay={approvalLevel === 'outgoing'}
              disapproved
              approval={x}
              key={idx}
              badgeId={filterByBadgeId ? badgeId : undefined}
              collectionId={collectionId}
              filterFromMint={filterFromMint}
              forceMobile={forceMobile}
            />
          );
          return result;
        })}
      </>
    );
  };

  let hasRows = false;
  if (approvals.length > 0) hasRows = true;
  if (showDeletedGrayedOut && deletedApprovals && deletedApprovals?.length > 0) hasRows = true;
  if (disapproved.length > 0) hasRows = true;

  return (
    <>
      <InformationDisplayCard title={title ?? ''} span={24} subtitle={subtitle} noBorder inheritBg noPadding>
        <div
          style={{
            display: 'flex',
            justifyContent: 'end',
            flexDirection: 'row-reverse',
            flexWrap: 'wrap'
          }}>
          {onlyShowFromMint && (
            <Switch style={{ margin: 10 }} disabled checkedChildren="From Mint Only" unCheckedChildren="Show Mint Only" checked={true} />
          )}

          {filterFromMint && (
            <Switch style={{ margin: 10 }} disabled checkedChildren="From Non-Mint Only" unCheckedChildren="Show Mint Only" checked={true} />
          )}

          {!!badgeId && (
            <Switch
              style={{ margin: 10 }}
              checkedChildren={`Filter by Badge ID ${badgeId}?`}
              unCheckedChildren={`Filter by Badge ID ${badgeId}?`}
              checked={filterByBadgeId}
              onChange={(checked) => {
                setFilterByBadgeId(checked);
              }}
            />
          )}

          <Switch
            style={{ margin: 10 }}
            checkedChildren="Hide Disapprovals?"
            unCheckedChildren="Hide Disapprovals?"
            checked={!showHidden}
            onChange={(checked) => {
              setShowHidden(!checked);
            }}
          />

          {chain.address && chain.connected && (
            <Switch
              style={{ margin: 10 }}
              checkedChildren="My Approvals Only?"
              unCheckedChildren="My Approvals Only?"
              checked={showUserApprovalsOnly}
              onChange={(checked) => {
                setShowUserApprovalsOnly(checked);
              }}
            />
          )}
        </div>
        <div className="">
          {getRows()}
          {!hasRows && <EmptyIcon description="No approvals found." />}
        </div>
        {addMoreNode}
        {/* {!hideHelperMessage && (
          <>
            <br />
            <p className="secondary-text">
              <InfoCircleOutlined />{' '}
              {'Successful transfers require sufficient balances and sufficient approvals where applicable (collection, incoming, and outgoing).'}
            </p>
          </>
        )} */}
      </InformationDisplayCard>
    </>
  );
};
