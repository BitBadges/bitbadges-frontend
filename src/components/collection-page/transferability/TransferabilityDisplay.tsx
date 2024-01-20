import { BookOutlined, CloudSyncOutlined, DatabaseOutlined, DeleteOutlined, EditOutlined, GiftOutlined, MenuFoldOutlined, MenuUnfoldOutlined, MinusOutlined, SwapOutlined, UndoOutlined } from '@ant-design/icons';
import { Spin, Tag, Typography, notification } from 'antd';
import { AmountTrackerIdDetails } from 'bitbadgesjs-proto';
import { CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails, convertToCosmosAddress, getCurrentValueForTimeline, isInAddressList, searchUintRangesForId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { fetchCollectionsWithOptions, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalCriteriaHasNoAmountRestrictions, approvalCriteriaUsesPredeterminedBalances } from '../../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { MarkdownDisplay } from '../../../pages/account/[addressOrUsername]/settings';
import { compareObjects } from '../../../utils/compare';
import { Divider } from '../../display/Divider';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { CreateTxMsgClaimBadgeModal } from '../../tx-modals/CreateTxMsgClaimBadge';
import { CreateTxMsgTransferBadgesModal } from '../../tx-modals/CreateTxMsgTransferBadges';
import { FetchCodesModal } from '../../tx-modals/FetchCodesModal';
import { transferableApproval } from '../../tx-timelines/step-items/TransferabilitySelectStepItem';
import { ApprovalBalancesCard } from './ApprovalBalancesCard';
import { ApprovalSelectWrapper } from './ApprovalsDisplay';
import { DetailsCard } from './DetailsCard';
import { TransferabilityInfoDisplay } from './TransferabilityInfoDisplay';


export function TransferabilityDisplay({
  address, setAddress,
  allApprovals,
  setAllApprovals,
  startingApprovals,
  onRestore,
  grayedOut,
  onDelete,
  hideActions,
  editable,
  approval,
  badgeId,
  collectionId,
  approvalPermissions,
  filterFromMint,
  noBorder,
  disapproved,
  isIncomingDisplay,
  isOutgoingDisplay,
  approverAddress,
  defaultShowDetails
}: {
  approval: CollectionApprovalWithDetails<bigint>,
  allApprovals: CollectionApprovalWithDetails<bigint>[],
  setAllApprovals?: (allApprovals: CollectionApprovalWithDetails<bigint>[]) => void,
  startingApprovals?: CollectionApprovalWithDetails<bigint>[],
  approverAddress?: string,
  badgeId?: bigint,
  hideActions?: boolean,
  collectionId: bigint,
  filterFromMint?: boolean,
  noBorder?: boolean,
  disapproved?: boolean,
  isIncomingDisplay?: boolean,
  isOutgoingDisplay?: boolean,
  address?: string,
  setAddress: (address: string) => void,
  onDelete?: (approvalId: string) => void,
  editable?: boolean,
  onRestore?: (approvalId: string) => void,
  grayedOut?: boolean,
  approvalPermissions?: CollectionApprovalPermissionWithDetails<bigint>[]
  defaultShowDetails?: boolean,
}) {
  const collection = useCollection(collectionId);
  const chain = useChainContext();

  const [showMoreIsVisible, setShowMoreIsVisible] = useState(defaultShowDetails ?? false);
  const [editIsVisible, setEditIsVisible] = useState(false);
  const [transferIsVisible, setTransferIsVisible] = useState(false);
  const [fetchCodesModalIsVisible, setFetchCodesModalIsVisible] = useState<boolean>(false);

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? "";
  const hasPredetermined = approvalCriteriaUsesPredeterminedBalances(approval.approvalCriteria);

  //Doesn't make sense to transfer to mint or have mint intiate so we remove these
  const toAddresses = useMemo(() => {
    return approval.toList.addresses.filter(x => x !== 'Mint');
  }, [approval.toList.addresses]);

  const initiatedByAddresses = useMemo(() => {
    return approval.initiatedByList.addresses.filter(x => x !== 'Mint');
  }, [approval.initiatedByList.addresses]);

  const fromAddresses = useMemo(() => {
    return filterFromMint ? approval.fromList.addresses.filter(x => x !== 'Mint') : approval.fromList.addresses;
  }, [approval.fromList.addresses, filterFromMint]);


  const approvalCriteria = approval.approvalCriteria;
  const challengeTrackerId = approval.challengeTrackerId;
  const approvalLevel = isIncomingDisplay ? 'incoming' : isOutgoingDisplay ? 'outgoing' : 'collection';

  const refreshable = !(approvalCriteriaHasNoAmountRestrictions(approvalCriteria) && !approvalCriteria?.merkleChallenge?.root);

  const [refreshing, setRefreshing] = useState(false);
  const [alreadyRefreshed, setAlreadyRefreshed] = useState(false);

  const refreshTrackers = useCallback(async (manualClick?: boolean) => {
    try {
      if (alreadyRefreshed && !manualClick) return;
      setRefreshing(true);
      if (!refreshable) {
        if (manualClick) notification.success({
          message: 'Refreshed!',
          description: 'The claim has been refreshed!',
        });
        setRefreshing(false);
        setAlreadyRefreshed(true);
        return;
      }

      const approvalsIdsToFetch: AmountTrackerIdDetails<bigint>[] = [{
        collectionId,
        amountTrackerId: approval.amountTrackerId,
        approvalLevel: approvalLevel,
        approvedAddress: "",
        approverAddress: convertToCosmosAddress(approverAddress ?? '') ?? '',
        trackerType: "overall",
      }];
      if (approvalCriteria?.maxNumTransfers?.perInitiatedByAddressMaxNumTransfers ?? 0n > 0n) {
        approvalsIdsToFetch.push({
          collectionId,
          amountTrackerId: approval.amountTrackerId,
          approvalLevel: approvalLevel,
          approvedAddress: chain.cosmosAddress,
          approverAddress: convertToCosmosAddress(approverAddress ?? '') ?? '',
          trackerType: "initiatedBy",
        });
      }

      await fetchCollectionsWithOptions([{
        collectionId,
        viewsToFetch: [],
        challengeTrackersToFetch: [{
          collectionId,
          challengeId: challengeTrackerId ?? '',
          challengeLevel: approvalLevel,
          approverAddress: convertToCosmosAddress(approverAddress ?? '') ?? '',
        }],
        approvalTrackersToFetch: approvalsIdsToFetch,
        handleAllAndAppendDefaults: true,
        forcefulFetchTrackers: true,
      }]);

      if (manualClick) {
        notification.success({
          message: 'Refreshed!',
          description: 'The claim has been refreshed!',
          duration: 5,
        });
      }

      setRefreshing(false);
      setAlreadyRefreshed(true);
    } catch (e) {
      console.log(e);
      setRefreshing(false);
    }
  }, [collectionId, approval, approvalLevel, approverAddress, approvalCriteria, chain.cosmosAddress, challengeTrackerId, refreshable, alreadyRefreshed]);

  const router = useRouter();
  const query = router.query;

  const [populated, setPopulated] = useState(false);

  //Auto scroll to page upon claim ID query in URL
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set claim auto');
    if (populated) return;
    if (!editable && !onDelete && !hideActions && !disapproved) {
      if (query.approvalId && typeof query.approvalId === 'string') {
        if (query.approvalId === approval.approvalId && !hideActions && !disapproved) {
          setTransferIsVisible(true)
          notification.info({
            message: 'Code / Password',
            description: `Code / password was found in the URL. We have automatically inserted it into the input field for you.`,
          });
          setPopulated(true);
        }
      }
    }
  }, [query.approvalId, approval.approvalId, hideActions, disapproved, populated, editable, onDelete]);

  //Only show rows that have at least one address (after filtration)
  if ((toAddresses.length == 0 && approval.toList.whitelist) || (initiatedByAddresses.length == 0 && approval.initiatedByList.whitelist) || (fromAddresses.length == 0 && approval.fromList.whitelist)) {
    return null;
  }

  if (badgeId) {
    const [, found] = searchUintRangesForId(badgeId, approval.badgeIds);
    if (!found) return null;
  }

  if (isIncomingDisplay || isOutgoingDisplay) {
    hideActions = true;
  }

  const isMint = approval.fromListId === 'Mint'

  const OnRestoreValue = onRestore && <td>
    {!disapproved &&
      <div className='flex-center'>

        <IconButton
          secondary
          src={<UndoOutlined />}
          onClick={() => onRestore(approval.approvalId)}
          text='Restore'
          size={40}
          disabled={approval.approvalId === 'self-initiated-outgoing' || approval.approvalId === 'self-initiated-incoming'}
        />
      </div>}
  </td>

  const isExisting = startingApprovals?.find(x => x.approvalId === approval.approvalId);
  const isReserved = approval.approvalId === 'self-initiated-outgoing' || approval.approvalId === 'self-initiated-incoming';
  const EditableValue = editable && <td>


    {!disapproved && !isExisting &&
      <div className='flex-center' onClick={(e) => { e.stopPropagation(); }}>
        <IconButton
          secondary
          src={editIsVisible ? <MinusOutlined /> : <EditOutlined />}
          onClick={async () => {
            if (!hideActions) await refreshTrackers();
            setEditIsVisible(!editIsVisible);
            setShowMoreIsVisible(false);
          }}
          text={editIsVisible ? 'Cancel Edit' : 'Edit'}
          size={40}
          disabled={approval.approvalId === 'self-initiated-outgoing' || approval.approvalId === 'self-initiated-incoming'}
        />
      </div>}

  </td>

  const OnDeleteValue = onDelete && <td>
    {!disapproved &&
      <div className='flex-center' onClick={(e) => { e.stopPropagation(); }}>

        <IconButton
          secondary
          src={<DeleteOutlined />}
          onClick={() => onDelete(approval.approvalId)}
          size={40}
          text='Delete'
          disabled={approval.approvalId === 'self-initiated-outgoing' || approval.approvalId === 'self-initiated-incoming'}
        />

      </div>}

  </td>

  if (!approval.details && compareObjects(transferableApproval, approval)) {
    approval.details = {
      name: 'Transferable',
      description: 'Excluding transfers from the Mint address, this approval allows any address to transfer any badge to any address.',
      challengeDetails: {
        leavesDetails: {
          leaves: [],
          isHashed: false,
        }
      },
    }
  }

  const isPasswordClaim = approval.approvalCriteria?.merkleChallenge?.root && approvalCriteriaUsesPredeterminedBalances(approval.approvalCriteria) && approval.details?.hasPassword;
  const isCodeClaim = approval.approvalCriteria?.merkleChallenge?.root && approvalCriteriaUsesPredeterminedBalances(approval.approvalCriteria) && !approval.details?.hasPassword;

  let isCurrentlyValid = isPasswordClaim || isCodeClaim;
  if (chain.cosmosAddress && !isInAddressList(approval.initiatedByList, chain.cosmosAddress)) {
    isCurrentlyValid = false;
  }
  const [_, found] = searchUintRangesForId(BigInt(Date.now()), approval.transferTimes);
  if (!found) {
    isCurrentlyValid = false;
  }

  return <>
    <div style={{ textAlign: 'center' }}>
      {collection && <>
        <>
          <br />
          <div className='flex-center flex-wrap'>

            <InformationDisplayCard noPadding title={approval.details?.name ?? ''} md={24} xs={24} sm={24} >
              <TransferabilityInfoDisplay
                approval={approval}
                filterFromMint={filterFromMint}
                grayedOut={grayedOut}
                onDelete={onDelete}
                startingApprovals={startingApprovals}
                disapproved={disapproved}
                editable={editable}
                allApprovals={allApprovals}
              />

              {showMoreIsVisible && !disapproved && <>
                {approval.details?.description && <><Divider /><div className='flex-center'><MarkdownDisplay markdown={approval.details?.description ?? ''} /></div> <br /></>}

                <div className='flex-center flex-wrap full-width' style={{ alignItems: 'normal', fontSize: 16 }}>
                  <DetailsCard isEdit={!!onDelete || editable}
                    approval={approval} allApprovals={allApprovals} isIncomingDisplay={isIncomingDisplay} isOutgoingDisplay={isOutgoingDisplay} collectionId={collectionId} address={address} setAddress={setAddress} />

                  <ApprovalBalancesCard collectionId={collectionId} approval={approval} address={address ?? ''} setAddress={setAddress} />
                </div>
              </>}
              {!disapproved && <>
                <br />
                <div className="flex-center flex-wrap">

                  {!onDelete && currentManager && currentManager === chain.cosmosAddress && approval.approvalCriteria?.merkleChallenge?.root && !approval.approvalCriteria.merkleChallenge.useCreatorAddressAsLeaf && <div>

                    <IconButton
                      secondary
                      src={<DatabaseOutlined size={40} />}
                      onClick={() => setFetchCodesModalIsVisible(true)}
                      text={approval.details?.hasPassword ? 'Password' : 'Codes'}
                      tooltipMessage={'Since you are the manager of this collection, you can view the codes / password for this claim.'}
                      size={40}
                    />

                    <FetchCodesModal
                      visible={fetchCodesModalIsVisible}
                      setVisible={setFetchCodesModalIsVisible}
                      collectionId={collectionId}
                      approvalId={approval.approvalId}
                    />
                  </div>}
                  {collectionId !== NEW_COLLECTION_ID && showMoreIsVisible && refreshable &&
                    <IconButton
                      secondary
                      src={
                        refreshing ? <Spin /> :
                          <CloudSyncOutlined size={40} />}
                      onClick={() => refreshTrackers(true)}
                      text={'Refresh'}
                      tooltipMessage={'Refresh'}
                      disabled={refreshing}

                      size={40}
                    />}
                  {!disapproved &&
                    <IconButton

                      secondary
                      src={
                        refreshing ? <Spin /> :
                          showMoreIsVisible ? <MenuFoldOutlined size={40} /> : <MenuUnfoldOutlined size={40} />}
                      onClick={async () => {
                        if (!hideActions) await refreshTrackers();

                        setShowMoreIsVisible(!showMoreIsVisible)
                        setEditIsVisible(false);
                      }}
                      disabled={editIsVisible || refreshing}
                      text={showMoreIsVisible ? 'Hide Details' : 'Details'}
                      tooltipMessage={showMoreIsVisible ? 'Hide Details' : 'Details'}
                      size={40}
                    />}
                  {!disapproved && collectionId !== NEW_COLLECTION_ID &&
                    <IconButton

                      secondary
                      src={<BookOutlined />}
                      onClick={async () => {
                        window.open(`https://docs.bitbadges.io/overview/how-it-works/transferability`, '_blank');
                      }}
                      text={'Docs'}
                      tooltipMessage={'Visit the docs to learn more about how transferability and approvals work.'}
                      size={40}
                    />}
                  {!editable && !onDelete && !hideActions && !disapproved &&
                    <IconButton
                      src={
                        refreshing ? <Spin /> :
                          isPasswordClaim || isCodeClaim ? <GiftOutlined /> :

                            <SwapOutlined size={40} />}
                      onClick={async () => {
                        if (!hideActions) await refreshTrackers();
                        setTransferIsVisible(!transferIsVisible)
                      }}
                      disabled={refreshing || !isCurrentlyValid}
                      text={isPasswordClaim || isCodeClaim ? 'Claim' : 'Transfer'}
                      tooltipMessage={
                        isPasswordClaim ? 'Claim by entering the password for this approval.' :
                          isCodeClaim ? 'Claim by entering a valid code for this approval.' : 'Transfer badges to another address via use of this approval.'
                      }
                      size={40}
                    />}
                  {EditableValue}
                  {OnRestoreValue}
                  {OnDeleteValue}
                </div>

                {
                  editable && !disapproved && showMoreIsVisible && !isReserved && <>
                    <br />
                    <div className='flex-center'>
                      <div>
                        This approval is  <span style={{ alignItems: 'center', marginLeft: 8, height: '100%' }}>
                          {isExisting ? <Tag
                            style={{ backgroundColor: '#1890ff' }}
                            color='#1890ff'
                            className='primary-text'
                          >Existing</Tag> :
                            <Tag
                              style={{ backgroundColor: '#52c41a' }}
                              color='#52c41a'
                              className='primary-text'
                            >New</Tag>}
                          meaning, if applicable, any trackers (amounts, number of transfers, which codes are used, which addresses have claimed, etc.)
                          {isExisting ? ' will continue adding on to the existing tally.' : ' will start from scratch.'}

                        </span>
                      </div>
                    </div>
                    <br />
                  </>
                }

                {
                  approval && isMint && hasPredetermined &&
                  <CreateTxMsgClaimBadgeModal
                    collectionId={collectionId}
                    visible={transferIsVisible}
                    setVisible={setTransferIsVisible}
                    approval={approval}
                  />
                }
                {
                  approval && !(isMint && hasPredetermined) &&
                  <CreateTxMsgTransferBadgesModal
                    collectionId={collectionId}
                    visible={transferIsVisible}
                    setVisible={setTransferIsVisible}
                    defaultAddress={'Mint'}
                    approval={approval}
                    fromTransferabilityDisplay
                  />
                }


              </>}

              {editIsVisible && collection && approval && setAllApprovals &&

                <tr style={{ paddingBottom: 10, borderBottom: noBorder ? undefined : '1px solid gray' }} className="transferability-row-more">
                  {
                    <td colSpan={1000} style={{ alignItems: 'center' }}>
                      <div className='flex-center'>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 24 }}>
                          Editing Approval
                        </Typography.Text>

                      </div>
                      <ApprovalSelectWrapper
                        collection={collection}
                        defaultApproval={approval}
                        approvalLevel={approvalLevel}
                        approvals={allApprovals}
                        approverAddress={approverAddress ?? ''}
                        setApprovals={setAllApprovals}
                        startingApprovals={startingApprovals ?? []}
                        approvalPermissions={approvalPermissions ?? []}
                        setVisible={setEditIsVisible}
                        mintingOnly={!filterFromMint}
                      />
                    </td>
                  }
                </tr>
              }
            </InformationDisplayCard >
          </div>
        </></>}
    </div >
  </>
}

