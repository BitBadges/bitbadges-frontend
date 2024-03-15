import {
  CloudSyncOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  GiftOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MinusOutlined,
  SwapOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { Col, Spin, Tag, Tooltip, Typography, notification } from 'antd';
import {
  AmountTrackerIdDetails,
  CollectionApprovalPermissionWithDetails,
  CollectionApprovalWithDetails,
  convertToCosmosAddress,
  getCurrentValueForTimeline
} from 'bitbadgesjs-sdk';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';

import InfiniteScroll from 'react-infinite-scroll-component';
import { BitBadgesApi } from '../../../bitbadges-api/api';
import { fetchCollectionsWithOptions, updateCollection, useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalCriteriaHasNoAmountRestrictions, approvalCriteriaUsesPredeterminedBalances } from '../../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../../constants';
import { MarkdownDisplay } from '../../../pages/account/[addressOrUsername]/settings';
import { AddressDisplay } from '../../address/AddressDisplay';
import { AddressSelect } from '../../address/AddressSelect';
import { BalanceDisplay } from '../../balances/BalanceDisplay';
import { Divider } from '../../display/Divider';
import IconButton from '../../display/IconButton';
import { InformationDisplayCard } from '../../display/InformationDisplayCard';
import { RadioGroup } from '../../inputs/Selects';
import { Tabs } from '../../navigation/Tabs';
import { CreateTxMsgClaimBadgeModal } from '../../tx-modals/CreateTxMsgClaimBadge';
import { CreateTxMsgTransferBadgesModal } from '../../tx-modals/CreateTxMsgTransferBadges';
import { FetchCodesModal } from '../../tx-modals/FetchCodesModal';
import { ScrollLoader } from '../ClaimAlertsTab';
import { ApprovalBalancesCard } from './ApprovalBalancesCard';
import { ApprovalSelectWrapper } from './ApprovalsDisplay';
import { ApprovalAmountsComponent, DetailsCard, MaxNumTransfersComponent } from './DetailsCard';
import { TransferabilityInfoDisplay } from './TransferabilityInfoDisplay';

export function TransferabilityDisplay({
  address,
  setAddress,
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
  defaultShowDetails,
  forceMobile
}: {
  approval: CollectionApprovalWithDetails<bigint>;
  allApprovals: Array<CollectionApprovalWithDetails<bigint>>;
  setAllApprovals?: (allApprovals: Array<CollectionApprovalWithDetails<bigint>>) => void;
  startingApprovals?: Array<CollectionApprovalWithDetails<bigint>>;
  approverAddress?: string;
  badgeId?: bigint;
  hideActions?: boolean;
  collectionId: bigint;
  filterFromMint?: boolean;
  noBorder?: boolean;
  disapproved?: boolean;
  isIncomingDisplay?: boolean;
  isOutgoingDisplay?: boolean;
  address?: string;
  setAddress: (address: string) => void;
  onDelete?: (approvalId: string) => void;
  editable?: boolean;
  onRestore?: (approvalId: string) => void;
  grayedOut?: boolean;
  approvalPermissions?: Array<CollectionApprovalPermissionWithDetails<bigint>>;
  defaultShowDetails?: boolean;
  forceMobile?: boolean;
}) {
  const collection = useCollection(collectionId);
  const chain = useChainContext();

  const [showMoreIsVisible, setShowMoreIsVisible] = useState(defaultShowDetails ?? false);
  const [editIsVisible, setEditIsVisible] = useState(false);
  const [transferIsVisible, setTransferIsVisible] = useState(false);
  const [fetchCodesModalIsVisible, setFetchCodesModalIsVisible] = useState<boolean>(false);

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? '';

  //Doesn't make sense to transfer to mint or have mint intiate so we remove these
  const toAddresses = useMemo(() => {
    return approval.toList.addresses.filter((x) => x !== 'Mint');
  }, [approval.toList.addresses]);

  const initiatedByAddresses = useMemo(() => {
    return approval.initiatedByList.addresses.filter((x) => x !== 'Mint');
  }, [approval.initiatedByList.addresses]);

  const fromAddresses = useMemo(() => {
    return filterFromMint ? approval.fromList.addresses.filter((x) => x !== 'Mint') : approval.fromList.addresses;
  }, [approval.fromList.addresses, filterFromMint]);

  const approvalCriteria = approval.approvalCriteria;
  const challengeTrackerId = approval.challengeTrackerId;
  const approvalLevel = isIncomingDisplay ? 'incoming' : isOutgoingDisplay ? 'outgoing' : 'collection';

  const refreshable = !(approvalCriteriaHasNoAmountRestrictions(approvalCriteria) && !approvalCriteria?.merkleChallenge?.root);

  const [refreshing, setRefreshing] = useState(false);
  const [alreadyRefreshed, setAlreadyRefreshed] = useState(false);

  const refreshTrackers = useCallback(
    async (manualClick?: boolean) => {
      try {
        if (alreadyRefreshed && !manualClick) return;
        setRefreshing(true);
        if (!refreshable) {
          if (manualClick)
            notification.success({
              message: 'Refreshed!',
              description: 'The claim has been refreshed!'
            });
          setRefreshing(false);
          setAlreadyRefreshed(true);
          return;
        }

        const approvalsIdsToFetch: Array<AmountTrackerIdDetails<bigint>> = [
          new AmountTrackerIdDetails<bigint>({
            collectionId,
            amountTrackerId: approval.amountTrackerId,
            approvalLevel: approvalLevel,
            approvedAddress: '',
            approverAddress: convertToCosmosAddress(approverAddress ?? '') ?? '',
            trackerType: 'overall'
          })
        ];
        if (approvalCriteria?.maxNumTransfers?.perInitiatedByAddressMaxNumTransfers ?? 0n > 0n) {
          approvalsIdsToFetch.push(
            new AmountTrackerIdDetails<bigint>({
              collectionId,
              amountTrackerId: approval.amountTrackerId,
              approvalLevel: approvalLevel,
              approvedAddress: chain.cosmosAddress,
              approverAddress: convertToCosmosAddress(approverAddress ?? '') ?? '',
              trackerType: 'initiatedBy'
            })
          );
        }

        await fetchCollectionsWithOptions([
          {
            collectionId,
            viewsToFetch: [],
            challengeTrackersToFetch: [
              {
                collectionId,
                challengeId: challengeTrackerId ?? '',
                challengeLevel: approvalLevel,
                approverAddress: convertToCosmosAddress(approverAddress ?? '') ?? ''
              }
            ],
            approvalTrackersToFetch: approvalsIdsToFetch,
            handleAllAndAppendDefaults: true,
            forcefulFetchTrackers: true
          }
        ]);

        if (manualClick) {
          notification.success({
            message: 'Refreshed!',
            description: 'The claim has been refreshed!',
            duration: 5
          });
        }

        setRefreshing(false);
        setAlreadyRefreshed(true);
      } catch (e) {
        console.log(e);
        setRefreshing(false);
      }
    },
    [collectionId, approval, approvalLevel, approverAddress, approvalCriteria, chain.cosmosAddress, challengeTrackerId, refreshable, alreadyRefreshed]
  );

  const router = useRouter();
  const query = router.query;

  const [populated, setPopulated] = useState(false);
  const [tab, setTab] = useState('criteria');
  const [statusTab, setStatusTab] = useState('scroll');

  const [numDisplayed, setNumDisplayed] = useState(25);
  useEffect(() => {
    if (statusTab !== 'scroll') {
      setNumDisplayed(25);
    }
  }, [statusTab]);

  //Auto scroll to page upon claim ID query in URL
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set claim auto');
    if (populated) return;
    if (!editable && !onDelete && !hideActions && !disapproved) {
      if (query.approvalId && typeof query.approvalId === 'string') {
        if (query.approvalId === approval.approvalId && !hideActions && !disapproved) {
          setTransferIsVisible(true);
          notification.info({
            message: 'Code / Password',
            description: `Code / password was found in the URL. We have automatically inserted it into the input field for you.`
          });
          setPopulated(true);
        }
      }
    }
  }, [query.approvalId, approval.approvalId, hideActions, disapproved, populated, editable, onDelete]);

  //Only show rows that have at least one address (after filtration)
  if (
    (toAddresses.length == 0 && approval.toList.whitelist) ||
    (initiatedByAddresses.length == 0 && approval.initiatedByList.whitelist) ||
    (fromAddresses.length == 0 && approval.fromList.whitelist)
  ) {
    return null;
  }

  if (badgeId) {
    if (!approval.badgeIds.searchIfExists(badgeId)) return null;
  }

  if (isIncomingDisplay || isOutgoingDisplay) {
    hideActions = true;
  }

  const isMint = approval.fromListId === 'Mint';

  const OnRestoreValue = onRestore && (
    <td>
      {!disapproved && (
        <div className="flex-center">
          <IconButton
            secondary
            src={<UndoOutlined />}
            onClick={() => {
              onRestore(approval.approvalId);
            }}
            text="Restore"
            size={40}
            disabled={approval.approvalId === 'self-initiated-outgoing' || approval.approvalId === 'self-initiated-incoming'}
          />
        </div>
      )}
    </td>
  );

  const isExisting = startingApprovals?.find((x) => x.approvalId === approval.approvalId);
  const isReserved = approval.approvalId === 'self-initiated-outgoing' || approval.approvalId === 'self-initiated-incoming';
  const EditableValue = editable && (
    <td>
      {!disapproved && !isExisting && (
        <div
          className="flex-center"
          onClick={(e) => {
            e.stopPropagation();
          }}>
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
        </div>
      )}
    </td>
  );

  const OnDeleteValue = onDelete && (
    <td>
      {!disapproved && (
        <div
          className="flex-center"
          onClick={(e) => {
            e.stopPropagation();
          }}>
          <IconButton
            secondary
            src={<DeleteOutlined />}
            onClick={() => {
              onDelete(approval.approvalId);
            }}
            size={40}
            text="Delete"
            disabled={approval.approvalId === 'self-initiated-outgoing' || approval.approvalId === 'self-initiated-incoming'}
          />
        </div>
      )}
    </td>
  );
  const isClaim =
    (approval.details?.offChainClaims && approval.details?.offChainClaims?.length > 0) ||
    approval.approvalCriteria?.merkleChallenge?.root ||
    approvalCriteriaUsesPredeterminedBalances(approvalCriteria);

  let isCurrentlyValid = true;
  if (chain.cosmosAddress && !approval.initiatedByList.checkAddress(chain.cosmosAddress)) {
    isCurrentlyValid = false;
  }

  if (!approval.transferTimes.searchIfExists(BigInt(Date.now()))) {
    isCurrentlyValid = false;
  }

  const AddressStatus = ({ address }: { address: string }) => {
    return (
      <>
        {address && (
          <>
            <b style={{ fontSize: 16, marginTop: 24 }}>As Recipient</b>
            <div className="flex flex-wrap" style={{ width: '100%' }}>
              <Col md={12} sm={24} xs={24} style={{ padding: 6 }}>
                <MaxNumTransfersComponent approval={approval} collectionId={collectionId} address={address} type="to" componentType="card" />
              </Col>
              <Col md={12} sm={24} xs={24} style={{ padding: 6 }}>
                <ApprovalAmountsComponent approval={approval} collectionId={collectionId} address={address} type="to" componentType="card" />
              </Col>
            </div>
            <b style={{ fontSize: 16, marginTop: 24 }}>As Sender</b>
            <div className="flex flex-wrap" style={{ width: '100%' }}>
              <Col md={12} sm={24} xs={24} style={{ padding: 6 }}>
                <MaxNumTransfersComponent approval={approval} collectionId={collectionId} address={address} type="from" componentType="card" />
              </Col>
              <Col md={12} sm={24} xs={24} style={{ padding: 6 }}>
                <ApprovalAmountsComponent approval={approval} collectionId={collectionId} address={address} type="from" componentType="card" />
              </Col>
            </div>
            <b style={{ fontSize: 16, marginTop: 24 }}>As Initiator</b>
            <div className="flex flex-wrap" style={{ width: '100%' }}>
              <Col md={12} sm={24} xs={24} style={{ padding: 6 }}>
                <MaxNumTransfersComponent approval={approval} collectionId={collectionId} address={address} type="initiatedBy" componentType="card" />
              </Col>
              <Col md={12} sm={24} xs={24} style={{ padding: 6 }}>
                <ApprovalAmountsComponent approval={approval} collectionId={collectionId} address={address} type="initiatedBy" componentType="card" />
              </Col>
            </div>
          </>
        )}
      </>
    );
  };

  const collectionClone = collection?.clone();
  const approvalTrackers = collectionClone?.approvalTrackers.sort((a, b) => {
    return a.amountTrackerId.localeCompare(b.amountTrackerId);
  });

  return (
    <>
      <div style={{ textAlign: 'center' }}>
        {collection && (
          <>
            <>
              <br />
              <div className="flex-center flex-wrap">
                <InformationDisplayCard noPadding title={approval.details?.name ?? ''} md={24} xs={24} sm={24}>
                  <TransferabilityInfoDisplay
                    collectionId={collectionId}
                    approval={approval}
                    filterFromMint={filterFromMint}
                    grayedOut={grayedOut}
                    onDelete={onDelete}
                    startingApprovals={startingApprovals}
                    disapproved={disapproved}
                    editable={editable}
                    allApprovals={allApprovals}
                    forceMobile={forceMobile}
                  />

                  {showMoreIsVisible && !disapproved && (
                    <>
                      {approval.details?.description && (
                        <>
                          <Divider />
                          <div className="flex-center">
                            <MarkdownDisplay markdown={approval.details?.description ?? ''} />
                          </div>{' '}
                        </>
                      )}
                      <div>
                        <br />
                        <Tabs
                          tab={tab}
                          tabInfo={[
                            { key: 'criteria', content: 'Criteria' },
                            { key: 'statuses', content: 'Status' },
                            { key: 'balances', content: 'Balances' }
                          ]}
                          setTab={setTab}
                          fullWidth
                          type="underline"
                        />
                      </div>
                      <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal', fontSize: 16 }}>
                        {tab === 'criteria' && (
                          <DetailsCard
                            isEdit={!!onDelete || editable}
                            approval={approval}
                            allApprovals={allApprovals}
                            isIncomingDisplay={isIncomingDisplay}
                            isOutgoingDisplay={isOutgoingDisplay}
                            collectionId={collectionId}
                            address={address}
                          />
                        )}
                        {tab === 'statuses' && (
                          <>
                            <div className="flex-center flex-column full-width">
                              <div className="flex-center flex-column full-width">
                                <div className="flex-center">
                                  <RadioGroup
                                    value={statusTab}
                                    onChange={(val) => {
                                      setStatusTab(val);
                                    }}
                                    options={[
                                      { value: 'scroll', label: 'Feed' },
                                      { value: 'search', label: 'Search' }
                                    ]}
                                  />
                                </div>
                              </div>

                              {statusTab == 'search' && (
                                <>
                                  <b style={{ fontSize: 16, marginTop: 24 }}>All Addresses (Cumulative)</b>
                                  <div className="flex flex-wrap" style={{ width: '100%' }}>
                                    <Col md={12} sm={24} xs={24} style={{ padding: 6 }}>
                                      <MaxNumTransfersComponent
                                        approval={approval}
                                        collectionId={collectionId}
                                        address={address}
                                        type="overall"
                                        componentType="card"
                                      />
                                    </Col>
                                    <Col md={12} sm={24} xs={24} style={{ padding: 6 }}>
                                      <ApprovalAmountsComponent
                                        approval={approval}
                                        collectionId={collectionId}
                                        address={address}
                                        type="overall"
                                        componentType="card"
                                      />
                                    </Col>
                                  </div>
                                  <div className="flex-center flex-column full-width">
                                    <AddressSelect addressOrUsername={address} onUserSelect={setAddress} />

                                    {!address && <div className="flex-center secondary-text">Select an address to view its remaining status.</div>}
                                    {address && <AddressStatus address={address} />}
                                  </div>
                                </>
                              )}
                              {statusTab == 'scroll' && (
                                <>
                                  <div className="flex-center mt-2">
                                    <InfiniteScroll
                                      dataLength={numDisplayed}
                                      next={async () => {
                                        const collectionClone = collection.clone();
                                        await collectionClone.fetchNextForView(BitBadgesApi, 'amountTrackers', 'amountTrackers');
                                        updateCollection(collectionClone);
                                        setNumDisplayed(numDisplayed + 25);
                                      }}
                                      hasMore={collection.viewHasMore('amountTrackers')}
                                      loader={<ScrollLoader />}
                                      scrollThreshold={'300px'}
                                      endMessage={<></>}
                                      initialScrollY={0}
                                      className="flex flex-column"
                                      style={{ overflow: 'hidden' }}>
                                      {approvalTrackers?.map((x) => {
                                        if (x.numTransfers <= 0) return null;

                                        const transferLimit =
                                          x.trackerType === 'overall'
                                            ? approval.approvalCriteria?.maxNumTransfers?.overallMaxNumTransfers
                                            : x.trackerType === 'initiatedBy'
                                              ? approval.approvalCriteria?.maxNumTransfers?.perInitiatedByAddressMaxNumTransfers
                                              : x.trackerType === 'to'
                                                ? approval.approvalCriteria?.maxNumTransfers?.perToAddressMaxNumTransfers
                                                : approval.approvalCriteria?.maxNumTransfers?.perFromAddressMaxNumTransfers;

                                        const approvalAmountsLimit =
                                          x.trackerType === 'overall'
                                            ? approval.approvalCriteria?.approvalAmounts?.overallApprovalAmount
                                            : x.trackerType === 'initiatedBy'
                                              ? approval.approvalCriteria?.approvalAmounts?.perInitiatedByAddressApprovalAmount
                                              : x.trackerType === 'to'
                                                ? approval.approvalCriteria?.approvalAmounts?.perToAddressApprovalAmount
                                                : approval.approvalCriteria?.approvalAmounts?.perFromAddressApprovalAmount;

                                        return (
                                          <>
                                            <div className="flex-center flex-wrap">
                                              <div className="pr-1">
                                                {x.approvedAddress === '' && <AddressDisplay addressOrUsername="All" />}
                                                {x.approvedAddress !== '' && <AddressDisplay addressOrUsername={x.approvedAddress} />}
                                              </div>{' '}
                                              is at {x.numTransfers.toString()}{' '}
                                              {transferLimit !== undefined && transferLimit > 0 && `/ ${transferLimit.toString()} `}
                                              transfers used{' '}
                                              {x.trackerType === 'overall'
                                                ? 'overall'
                                                : x.trackerType === 'initiatedBy'
                                                  ? 'as initiator'
                                                  : x.trackerType === 'to'
                                                    ? 'as recipient'
                                                    : 'as sender'}{' '}
                                              {x.amounts.length > 0 && 'with the following balances used'}
                                              {approvalAmountsLimit !== undefined &&
                                                approvalAmountsLimit > 0 &&
                                                ` (x${approvalAmountsLimit.toString()} Limit)`}
                                            </div>
                                            {x.amounts.length > 0 && (
                                              <BalanceDisplay message={<></>} hideBadges balances={x.amounts} collectionId={collectionId} />
                                            )}{' '}
                                          </>
                                        );
                                      })}
                                    </InfiniteScroll>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        )}
                        {tab === 'balances' && <ApprovalBalancesCard collectionId={collectionId} approval={approval} />}
                      </div>
                    </>
                  )}
                  {!disapproved && (
                    <>
                      <br />
                      <div className="flex-center flex-wrap">
                        {!onDelete &&
                          currentManager &&
                          currentManager === chain.cosmosAddress &&
                          approval.approvalCriteria?.merkleChallenge?.root &&
                          !approval.approvalCriteria.merkleChallenge.useCreatorAddressAsLeaf && (
                            <>
                              {approval.details?.offChainClaims && approval.details?.offChainClaims?.length > 0 ? (
                                <>
                                  {approval.details.offChainClaims[0].plugins.find((x) => x.id === 'codes') && (
                                    <div>
                                      <IconButton
                                        secondary
                                        src={<DatabaseOutlined size={40} />}
                                        onClick={() => {
                                          setFetchCodesModalIsVisible(true);
                                        }}
                                        text={'Codes'}
                                        tooltipMessage={
                                          'Since you are the manager of this collection, you can view the codes / password for this claim.'
                                        }
                                        size={40}
                                      />

                                      <FetchCodesModal
                                        visible={fetchCodesModalIsVisible}
                                        setVisible={setFetchCodesModalIsVisible}
                                        collectionId={collectionId}
                                        approvalId={approval.approvalId}
                                      />
                                    </div>
                                  )}
                                  {approval.details.offChainClaims[0].plugins.find((x) => x.id === 'password') && (
                                    <div>
                                      <IconButton
                                        secondary
                                        src={<DatabaseOutlined size={40} />}
                                        onClick={() => {
                                          setFetchCodesModalIsVisible(true);
                                        }}
                                        text={'Password'}
                                        tooltipMessage={
                                          'Since you are the manager of this collection, you can view the codes / password for this claim.'
                                        }
                                        size={40}
                                      />

                                      <FetchCodesModal
                                        visible={fetchCodesModalIsVisible}
                                        setVisible={setFetchCodesModalIsVisible}
                                        collectionId={collectionId}
                                        approvalId={approval.approvalId}
                                        passwordModal
                                      />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <></>
                              )}
                            </>
                          )}
                        {collectionId !== NEW_COLLECTION_ID && showMoreIsVisible && refreshable && (
                          <IconButton
                            secondary
                            src={refreshing ? <Spin /> : <CloudSyncOutlined size={40} />}
                            onClick={async () => {
                              await refreshTrackers(true);
                            }}
                            text={'Refresh'}
                            tooltipMessage={'Refresh'}
                            disabled={refreshing}
                            size={40}
                          />
                        )}
                        {!disapproved && (
                          <IconButton
                            secondary
                            src={refreshing ? <Spin /> : showMoreIsVisible ? <MenuFoldOutlined size={40} /> : <MenuUnfoldOutlined size={40} />}
                            onClick={async () => {
                              if (!hideActions) await refreshTrackers();

                              setShowMoreIsVisible(!showMoreIsVisible);
                              setEditIsVisible(false);
                            }}
                            disabled={editIsVisible || refreshing}
                            text={showMoreIsVisible ? 'Hide Details' : 'Details'}
                            tooltipMessage={showMoreIsVisible ? 'Hide Details' : 'Details'}
                            size={40}
                          />
                        )}
                        {!editable && !onDelete && !hideActions && !disapproved && approval.transferTimes.searchIfExists(BigInt(Date.now())) && (
                          <IconButton
                            secondary
                            src={refreshing ? <Spin /> : isClaim ? <GiftOutlined /> : <SwapOutlined size={40} />}
                            onClick={async () => {
                              if (!hideActions) await refreshTrackers();
                              setTransferIsVisible(!transferIsVisible);
                            }}
                            disabled={refreshing || !isCurrentlyValid}
                            text={isClaim ? 'Claim' : 'Transfer'}
                            tooltipMessage={
                              isClaim
                                ? 'Claim by satisfying the criteria for this approval.'
                                : 'Transfer badges to another address via use of this approval.'
                            }
                            size={40}
                          />
                        )}
                        {EditableValue}
                        {OnRestoreValue}
                        {OnDeleteValue}
                      </div>
                      <div className="secondary-text" style={{ textAlign: 'center', fontSize: 10 }}>
                        Approval ID:{' '}
                        <Tooltip title={approval.approvalId}>
                          <span>{approval.approvalId.length > 25 ? approval.approvalId.substring(0, 25) + '...' : approval.approvalId}</span>
                        </Tooltip>
                        {approval.amountTrackerId !== approval.approvalId && (
                          <>
                            <br />
                            Tracker ID:{' '}
                            <Tooltip title={approval.amountTrackerId}>
                              <span>
                                {approval.amountTrackerId.length > 25 ? approval.amountTrackerId.substring(0, 25) + '...' : approval.amountTrackerId}
                              </span>
                            </Tooltip>
                          </>
                        )}
                        {approval.challengeTrackerId !== approval.approvalId && (
                          <>
                            <br />
                            Challenge ID:{' '}
                            <Tooltip title={approval.challengeTrackerId}>
                              <span>
                                {approval.challengeTrackerId.length > 25
                                  ? approval.challengeTrackerId.substring(0, 25) + '...'
                                  : approval.challengeTrackerId}
                              </span>
                            </Tooltip>
                          </>
                        )}
                      </div>

                      {editable && !disapproved && showMoreIsVisible && !isReserved && (
                        <>
                          <br />
                          <div className="flex-center">
                            <div>
                              This approval is{' '}
                              <span style={{ alignItems: 'center', marginLeft: 8, height: '100%' }}>
                                {isExisting ? (
                                  <Tag style={{ backgroundColor: '#1890ff' }} color="#1890ff" className="primary-text">
                                    Existing
                                  </Tag>
                                ) : (
                                  <Tag style={{ backgroundColor: '#52c41a' }} color="#52c41a" className="primary-text">
                                    New
                                  </Tag>
                                )}
                                meaning, if applicable, any trackers (amounts, number of transfers, which codes are used, which addresses have
                                claimed, etc.)
                                {isExisting ? ' will continue adding on to the existing tally.' : ' will start from scratch.'}
                              </span>
                            </div>
                          </div>
                          <br />
                        </>
                      )}

                      {approval && isMint && isClaim && (
                        <CreateTxMsgClaimBadgeModal
                          collectionId={collectionId}
                          visible={transferIsVisible}
                          setVisible={setTransferIsVisible}
                          approval={approval}
                        />
                      )}
                      {approval && !(isMint && isClaim) && (
                        <CreateTxMsgTransferBadgesModal
                          collectionId={collectionId}
                          visible={transferIsVisible}
                          setVisible={setTransferIsVisible}
                          defaultAddress={'Mint'}
                          approval={approval}
                          fromTransferabilityDisplay
                        />
                      )}
                    </>
                  )}

                  {editIsVisible && collection && approval && setAllApprovals && (
                    <tr
                      style={{
                        paddingBottom: 10,
                        borderBottom: noBorder ? undefined : '1px solid gray'
                      }}
                      className="transferability-row-more">
                      {
                        <td colSpan={1000} style={{ alignItems: 'center' }}>
                          <div className="flex-center">
                            <Typography.Text strong className="primary-text" style={{ fontSize: 24 }}>
                              Editing Approval
                            </Typography.Text>
                          </div>
                          <ApprovalSelectWrapper
                            collectionId={collectionId}
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
                  )}
                </InformationDisplayCard>
              </div>
            </>
          </>
        )}
      </div>
    </>
  );
}
