import { CheckCircleFilled, CloseCircleFilled, CloudSyncOutlined, DatabaseOutlined, DeleteOutlined, EditOutlined, InfoCircleOutlined, MenuFoldOutlined, MenuUnfoldOutlined, MinusOutlined, SwapOutlined, UndoOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Col, InputNumber, Radio, Statistic, Tag, Tooltip, Typography, notification } from 'antd';
import { AmountTrackerIdDetails } from 'bitbadgesjs-proto';
import { CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails, convertToCosmosAddress, filterZeroBalances, getBalancesForIds, getCurrentValueForTimeline, searchUintRangesForId } from 'bitbadgesjs-utils';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';


import { fetchAccounts, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollectionsWithOptions, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalCriteriaHasNoAmountRestrictions, approvalCriteriaUsesPredeterminedBalances, approvalHasApprovalAmounts, approvalHasMaxNumTransfers } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { compareObjects } from '../../utils/compare';
import { getTimeRangesElement } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressDisplayList } from '../address/AddressDisplayList';
import { AddressSelect } from '../address/AddressSelect';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { BalanceDisplay } from '../badges/BalanceDisplay';
import IconButton from '../display/IconButton';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TableRow } from '../display/TableRow';
import { CreateTxMsgClaimBadgeModal } from '../tx-modals/CreateTxMsgClaimBadge';
import { CreateTxMsgTransferBadgesModal } from '../tx-modals/CreateTxMsgTransferBadges';
import { FetchCodesModal } from '../tx-modals/FetchCodesModal';
import { transferableApproval } from '../tx-timelines/step-items/TransferabilitySelectStepItem';
import { ApprovalSelectWrapper } from './ApprovalsTab';
import { BalanceOverview } from './BalancesInfo';
import { MarkdownDisplay } from '../../pages/account/[addressOrUsername]/settings';

export const getTableHeader = () => {
  return <tr >
    {<>
      <th style={{ verticalAlign: 'top' }}></th>
    </>}

    <th style={{ verticalAlign: 'top' }}><b>
      From
    </b></th>
    <th style={{ verticalAlign: 'top' }}><b>
      To
    </b></th>
    <th style={{ verticalAlign: 'top' }}><b>
      Approved <Tooltip title="The address that can initiate the transfer transaction.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></th>
    <th style={{ verticalAlign: 'top' }}><b>
      Transfer Times
      <Tooltip title="The times at which the transfer can take place.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></th>
    <th style={{ verticalAlign: 'top' }}><b>
      Badge IDs
    </b></th>
    <th style={{ verticalAlign: 'top' }}><b>
      Ownership Times
      <Tooltip title="The ownership times for the badges that are allowed to be transferred.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></th>
    <th style={{ verticalAlign: 'top' }}><b>
      Tags
    </b></th>
  </tr>
}

export const DetailsCard = ({ allTransfers, transfer, isOutgoingDisplay, isIncomingDisplay, collectionId, address, setAddress, isEdit }: {
  allTransfers: CollectionApprovalWithDetails<bigint>[],
  transfer: CollectionApprovalWithDetails<bigint>, isOutgoingDisplay?: boolean, isIncomingDisplay?: boolean
  collectionId: bigint, address?: string,
  setAddress: (address: string) => void
  isEdit?: boolean

}) => {

  const [whitelistIsVisible, setWhitelistIsVisible] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasApprovalAmounts = approvalHasApprovalAmounts(transfer.approvalCriteria?.approvalAmounts);

  const hasMaxNumTransfers = approvalHasMaxNumTransfers(transfer.approvalCriteria?.maxNumTransfers);

  const hasSameTrackerId = allTransfers.find(x => x.amountTrackerId === transfer.amountTrackerId && x.approvalId !== transfer.approvalId
    &&
    ((isEdit) || ((hasApprovalAmounts || hasMaxNumTransfers) && (approvalHasApprovalAmounts(x.approvalCriteria?.approvalAmounts) || approvalHasMaxNumTransfers(x.approvalCriteria?.maxNumTransfers))))
  );

  const hasSameChallengeTrackerId = allTransfers.find(x => x.challengeTrackerId === transfer.challengeTrackerId && x.approvalId !== transfer.approvalId
    &&
    ((isEdit) || (
      x.approvalCriteria?.merkleChallenge?.root && transfer.approvalCriteria?.merkleChallenge?.root
      && x.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf && transfer.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf
    ))
  );

  return <InformationDisplayCard title='Restrictions' inheritBg noBorder md={12} xs={24} sm={24}>
    <ul className='list-disc px-8' style={{ textAlign: 'left' }}>
      {transfer.approvalCriteria?.requireFromDoesNotEqualInitiatedBy && !isOutgoingDisplay && (
        <li>{"From address must NOT equal approver's address"}</li>
      )}
      {transfer.approvalCriteria?.requireFromEqualsInitiatedBy && !isOutgoingDisplay && (
        <li>{"From address must equal approver's address"}</li>
      )}
      {transfer.approvalCriteria?.requireToDoesNotEqualInitiatedBy && !isIncomingDisplay && (
        <li>{"To address must NOT equal approver's address"}</li>
      )}
      {transfer.approvalCriteria?.requireToEqualsInitiatedBy && !isIncomingDisplay && (
        <li>{"To address must equal approver's address"}</li>
      )}
      {!isOutgoingDisplay && <>
        {transfer.fromMappingId !== "Mint" && transfer.approvalCriteria?.overridesFromOutgoingApprovals ? (
          <li>
            <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} />
            {"Does not check the sender's outgoing approvals"}</li>
        ) : (
          transfer.fromMappingId !== "Mint" && <li>{"Must satisfy the sender's outgoing approvals"}</li>
        )}</>}
      {transfer.fromMappingId === "Mint" && !transfer.approvalCriteria?.overridesFromOutgoingApprovals && (
        <>
          <li>
            {"Must satisfy outgoing approvals for Mint address (Not possible so this will never work)"}
          </li>
        </>
      )}
      {!isIncomingDisplay && <>
        {transfer.approvalCriteria?.overridesToIncomingApprovals ? (
          <li><WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} />{"Does not check the recipient's incoming approvals"}</li>
        ) : (
          <li>{"Must satisfy recipient's incoming approvals"}</li>
        )}
      </>}
      {transfer.approvalCriteria?.mustOwnBadges && transfer.approvalCriteria?.mustOwnBadges?.length > 0 && (<>
        <li>{"Must own specific badges to be approved"}</li>
        <br />
        <MustOwnBadgesCard transfer={transfer} />
      </>
      )}
      {transfer.approvalCriteria?.merkleChallenge?.root && (
        <>
          {transfer.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf ? (<>
            <li>{"Must be on whitelist"}</li>
            {transfer.approvalCriteria.merkleChallenge.maxUsesPerLeaf > 0n ? <li>{`Max ${transfer.approvalCriteria.merkleChallenge.maxUsesPerLeaf.toString()} use(s) per address`}</li> : <></>}
            {(transfer.details?.challengeDetails.leavesDetails.leaves.length ?? 0n) > 0n && <div className='flex-center flex-column'>
              <br />
              <Button className="styled-button" onClick={() => setWhitelistIsVisible(!whitelistIsVisible)}>{whitelistIsVisible ? 'Hide Whitelist' : 'Show Full Whitelist'}</Button>

              <br />
              {whitelistIsVisible && <>

                <AddressDisplayList
                  users={transfer.details?.challengeDetails?.leavesDetails.leaves ?? []}
                  allExcept={false}
                />
                <br />
              </>}
            </div>
            }
          </>) : <>

            <li>{`Must provide valid ${transfer.details ? transfer.details?.challengeDetails.hasPassword
              ? 'password' : 'code' : 'password / code'}`}</li>
            {(transfer.details?.challengeDetails.leavesDetails.leaves.length ?? 0n) > 0 && (
              <li>{transfer.details?.challengeDetails.leavesDetails.leaves.length.toString()}
                {`${transfer.details?.challengeDetails.hasPassword
                  ? ' password use' : ' valid code'}
                  ${(transfer.details?.challengeDetails.leavesDetails.leaves.length ?? 0n) > 1 ? 's' : ''} total`}</li>
            )}
            {/* <li>{transfer.approvalCriteria.merkleChallenge.maxUsesPerLeaf ? `Max ${transfer.approvalCriteria.merkleChallenge.maxUsesPerLeaf.toString()} use(s) per code / password` : "No limit on claims per code / password"}</li> */}
          </>}
        </>
      )}
      {
        transfer.approvalCriteria?.predeterminedBalances && (transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
          transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.manualBalances.length > 0) &&
        (
          <li>{"Predetermined balances for each transfer (see balances section)"}</li>
        )
      }


      <MaxNumTransfersComponent hideDisplay transfer={transfer} collectionId={collectionId} address={address} type="overall" componentType="list" setAddress={setAddress} />
      <MaxNumTransfersComponent hideDisplay transfer={transfer} collectionId={collectionId} address={address} type="to" componentType="list" setAddress={setAddress} />
      <MaxNumTransfersComponent hideDisplay transfer={transfer} collectionId={collectionId} address={address} type="from" componentType="list" setAddress={setAddress} />
      <MaxNumTransfersComponent hideDisplay transfer={transfer} collectionId={collectionId} address={address} type="initiatedBy" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent hideDisplay transfer={transfer} collectionId={collectionId} address={address} type="overall" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent hideDisplay transfer={transfer} collectionId={collectionId} address={address} type="to" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent hideDisplay transfer={transfer} collectionId={collectionId} address={address} type="from" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent hideDisplay transfer={transfer} collectionId={collectionId} address={address} type="initiatedBy" componentType="list" setAddress={setAddress} />

      <MaxNumTransfersComponent transfer={transfer} collectionId={collectionId} address={address} type="overall" componentType="card" setAddress={setAddress} />
      <MaxNumTransfersComponent transfer={transfer} collectionId={collectionId} address={address} type="to" componentType="card" setAddress={setAddress} />
      <MaxNumTransfersComponent transfer={transfer} collectionId={collectionId} address={address} type="from" componentType="card" setAddress={setAddress} />
      <MaxNumTransfersComponent transfer={transfer} collectionId={collectionId} address={address} type="initiatedBy" componentType="card" setAddress={setAddress} />

      <ApprovalAmountsComponent transfer={transfer} collectionId={collectionId} address={address} type="overall" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent transfer={transfer} collectionId={collectionId} address={address} type="to" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent transfer={transfer} collectionId={collectionId} address={address} type="from" componentType="list" setAddress={setAddress} />
      <ApprovalAmountsComponent transfer={transfer} collectionId={collectionId} address={address} type="initiatedBy" componentType="list" setAddress={setAddress} />


      {
        approvalCriteriaHasNoAmountRestrictions(transfer.approvalCriteria) && (
          <li>
            No amount restrictions
          </li>
        )
      }
    </ul >
    <br />
    <div className='flex-center'>
      <button className='styled-button-normal' style={{ width: 200, cursor: 'pointer', background: 'inherit !important' }} onClick={() => setShowAdvanced(!showAdvanced)}>{showAdvanced ? 'Hide' : 'Show'} Advanced</button>
    </div>
    {
      showAdvanced && <>
        <br />
        <ul className='list-disc px-8' style={{ textAlign: 'start' }}>
          <li><Typography.Text className='primary-text'>
            Approval ID: {transfer.approvalId.toString()}
          </Typography.Text>
          </li>
          <li>
            <Typography.Text className='primary-text'>
              Amount Tracker ID: {transfer.amountTrackerId.toString()}
            </Typography.Text>
          </li>
          <li>
            <Typography.Text className='primary-text'>
              Challenge Tracker ID: {transfer.challengeTrackerId.toString()}
            </Typography.Text>
          </li>
        </ul>
      </>
    }

    <div style={{ textAlign: 'start' }}>
      {hasSameTrackerId && (
        <>
          <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} /> There are multiple approvals using the same amount tracker ID.
          The tally of badges transferred and the number of transfers are linked and will increment whenever either approval is used.
          <br />
        </>
      )}
      {hasSameChallengeTrackerId && (
        <>
          <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} /> There are multiple approvals using the same challenge tracker ID.
          {transfer.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf ? ' The whitelists' : ' The codes / passwords'} of these approvals are linked and will be used up whenever either approval is used.
        </>
      )}
    </div>
  </InformationDisplayCard >
}

export const MustOwnBadgesCard = ({ transfer }: {
  transfer: CollectionApprovalWithDetails<bigint>
}) => {
  return <>
    {transfer.approvalCriteria?.mustOwnBadges && transfer.approvalCriteria?.mustOwnBadges?.length > 0 && (

      <>
        {transfer.approvalCriteria?.mustOwnBadges.map((mustOwnBadge, idx) => {
          const approvalCriteria = transfer.approvalCriteria;
          if (!approvalCriteria || !approvalCriteria.mustOwnBadges) return null;

          return <div className='flex-center flex-column primary-text' key={idx}>
            <BalanceDisplay
              message='Min Amounts'
              balances={[approvalCriteria?.mustOwnBadges[idx]].map(x => {
                return {
                  ...x,
                  amount: x.amountRange.start,
                }
              })}
              collectionId={mustOwnBadge.collectionId}
              isMustOwnBadgesInput={mustOwnBadge.overrideWithCurrentTime}
            />
            <br />
            <br />
            <BalanceDisplay
              message='Max Amounts'
              balances={[approvalCriteria.mustOwnBadges[idx]].map(x => {
                return {
                  ...x,
                  amount: x.amountRange.start,
                }
              })}
              collectionId={mustOwnBadge.collectionId}
              isMustOwnBadgesInput={mustOwnBadge.overrideWithCurrentTime}
            />
          </div>
        })}
      </>
    )}

  </>
}

export const PredeterminedCard = ({ transfer, orderNumber, setOrderNumber, collectionId, address, setAddress }: {
  address?: string,
  setAddress: (address: string) => void,
  collectionId: bigint, transfer: CollectionApprovalWithDetails<bigint>, orderNumber: number, setOrderNumber: (orderNumber: number) => void,
}) => {

  const claim = transfer.approvalCriteria?.merkleChallenge
  const approval = transfer;


  const collection = useCollection(collectionId);

  const approvalCriteria = transfer.approvalCriteria;
  const calculationMethod = transfer.approvalCriteria?.predeterminedBalances?.orderCalculationMethod;
  let trackerType: 'overall' | 'from' | 'to' | 'initiatedBy' = 'overall';
  if (calculationMethod?.useMerkleChallengeLeafIndex) { }
  else if (calculationMethod?.useOverallNumTransfers) trackerType = 'overall';
  else if (calculationMethod?.usePerFromAddressNumTransfers) trackerType = 'from';
  else if (calculationMethod?.usePerToAddressNumTransfers) trackerType = 'to';
  else if (calculationMethod?.usePerInitiatedByAddressNumTransfers) trackerType = 'initiatedBy';

  const approvalTracker = collection?.approvalsTrackers.find(x => x.amountTrackerId === approval.amountTrackerId && x.approvedAddress === ''
    && x.trackerType === trackerType);

  useEffect(() => {
    //fetch accounts as needed if we iterate through whitelist
    if (claim?.useCreatorAddressAsLeaf && approval.details?.challengeDetails?.leavesDetails.leaves[orderNumber]) {
      fetchAccounts([approvalCriteria?.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[orderNumber] ?? '']);
    }
  }, [orderNumber, claim, approval, approvalCriteria]);


  const numIncrements = approvalTracker?.numTransfers ?? 0n;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set claim number');
    if (numIncrements > 0n) setOrderNumber(Number(numIncrements));
  }, [numIncrements, setOrderNumber]);

  const incrementedBalances = transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.startBalances.map(x => {
    return {
      ...x,
      badgeIds: x.badgeIds.map(y => {
        return {
          ...y,
          start: y.start + (BigInt(orderNumber) * (transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy ?? 0n)),
          end: y.end + (BigInt(orderNumber) * (transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy ?? 0n)),
        }
      }),
      ownershipTimes: x.ownershipTimes.map(y => {
        return {
          ...y,
          start: y.start + (BigInt(orderNumber) * (transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy ?? 0n)),
          end: y.end + (BigInt(orderNumber) * (transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy ?? 0n)),
        }
      }),
    }
  }) ?? []
  const hasOverlap = incrementedBalances.length > 0 ?
    filterZeroBalances(
      getBalancesForIds(transfer.badgeIds, transfer.ownershipTimes, incrementedBalances)
    ).length > 0 : orderNumber >= (transfer.approvalCriteria?.predeterminedBalances?.manualBalances.length ?? 0n);
  const exceedsMaxNumTransfers = (transfer.approvalCriteria?.maxNumTransfers?.overallMaxNumTransfers ?? 0n) > 0n && orderNumber >= (transfer.approvalCriteria?.maxNumTransfers?.overallMaxNumTransfers ?? 0n);

  // const hasApprovalAmounts = approvalHasApprovalAmounts(transfer.approvalCriteria?.approvalAmounts);

  // const hasMaxNumTransfers = approvalHasMaxNumTransfers(transfer.approvalCriteria?.maxNumTransfers);

  const hasIncrements = !!(transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy || transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy);
  const [showSelect, setShowSelect] = useState(false);

  return <>{transfer.approvalCriteria?.predeterminedBalances && (transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
    transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.manualBalances.length > 0) &&
    (
      <>
        <ul className='list-disc px-8' style={{ textAlign: 'left' }}>
          {hasIncrements && <>

            <li>{Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0] === "useOverallNumTransfers" ?
              <>{"Claim number starts at 1 and increments by 1 every use by any user."}</>
              : Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0] === "useMerkleChallengeLeafIndex" ?
                <>{`Specific claim numbers are reserved for specific ${transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex && transfer.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf ? 'whitelisted addresses' : 'claim codes'}.`}</>
                : Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0] === "usePerFromAddressNumTransfers" ?
                  <>{"Claim number starts at 1 for each unique sender (from address) and increments by 1 every transfer from that address."}</>
                  : Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0] === "usePerToAddressNumTransfers" ?
                    <>{"Claim number starts at 1 for each unique recipient (to address) and increments by 1 every transfer to that address."}</>
                    : Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0] === "usePerInitiatedByAddressNumTransfers" ?
                      <>{"Claim number starts at 1 for each unique approver (approved address) and increments by 1 every transfer approver that address."}</>
                      : <>{'Unknown'}</>
            }
              {!calculationMethod?.usePerInitiatedByAddressNumTransfers && !calculationMethod?.useMerkleChallengeLeafIndex && <>

                <WarningOutlined style={{ color: '#FF5733', margin: 4 }} /> The claim number and badges to be received are calculated at processing time. They are subject to change according to the rules below if other claims are processed before your claim.

              </>}
            </li>
            {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy > 0 && (<li>
              Each claim number increments the badge IDs by {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString()}

            </li>)}
            {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy > 0 && (<li>
              Each claim number increments the ownership times by {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString()}
            </li>)}
            {calculationMethod?.useMerkleChallengeLeafIndex ? <></> : <div className='flex-center flex-column full-width'><br />


              {!calculationMethod?.useOverallNumTransfers &&
                <>
                  <div className='flex-center flex primary-text'>
                    <AddressDisplay addressOrUsername={address ?? ''} fontSize={14} />

                    {!calculationMethod?.usePerInitiatedByAddressNumTransfers && <IconButton src={showSelect ? <MinusOutlined /> : <SwapOutlined />} style={{ marginLeft: 4 }} text='Switch' onClick={() => setShowSelect(!showSelect)} />}
                  </div>
                  {showSelect && !calculationMethod?.usePerInitiatedByAddressNumTransfers && <><AddressSelect defaultValue={address} onUserSelect={(address) => setAddress?.(address)} /><br /></>}

                </>
              }
            </div>}




          </>}
        </ul>
        <div className='flex-center inherit-bg primary-text'>
          <div>
            {hasIncrements ? <>
              <Typography.Text strong style={{ fontSize: 16 }} className='primary-text'>
                Balances for Claim #
              </Typography.Text>



              <InputNumber
                style={{ width: 100 }}
                value={orderNumber + 1}
                onChange={(value) => {
                  if (!value) return;
                  setOrderNumber(value - 1 as number);
                }}
                className='primary-text inherit-bg'
              />
              {claim && claim.root && calculationMethod?.useMerkleChallengeLeafIndex && <><br />

                {claim?.useCreatorAddressAsLeaf ? <>
                  <AddressDisplay
                    addressOrUsername={approval.details?.challengeDetails?.leavesDetails.leaves[orderNumber] ?? ''}
                  // size={20}
                  />
                </> : <>
                  Code #{orderNumber + 1}
                </>}
              </>}
              <br />
            </> : <></>}

            {!hasIncrements ? <>
              {transfer.approvalCriteria && transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 && (<>
                {hasIncrements && <> <Typography.Text className="secondary-text" style={{ fontSize: 14 }} strong>
                  {`Current - Claim #${BigInt(numIncrements) + 1n}`}
                </Typography.Text>
                  <br /><br /></>}
                <BalanceDisplay
                  message={hasIncrements ? `` : 'Balances - All or Nothing'}
                  hideMessage={hasIncrements}
                  balances={hasOverlap ? incrementedBalances : []}
                  collectionId={collectionId}
                />
                {!hasIncrements && <>
                  <br />
                  <div className='secondary-text' style={{ fontSize: 14 }}>
                    <InfoCircleOutlined style={{ marginRight: 4 }} /> All or nothing means that all the specified badges must be transferred to be successful.
                  </div>
                </>}

              </>
              )}
            </> : !hasOverlap || exceedsMaxNumTransfers ? <div className='primary-text'>

              <br />
              <WarningOutlined style={{ color: '#FF5733', marginRight: 4 }} /> This claim number is not possible because
              {exceedsMaxNumTransfers && <> it exceeds the max cumulative uses for this approval.</>}
              {!hasOverlap && !exceedsMaxNumTransfers && <> the badge IDs are no longer in range.</>}
            </div> : <>
              {transfer.approvalCriteria && transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 && (<>
                <BalanceDisplay
                  message={hasIncrements ? `` : 'Balances - All or Nothing'}
                  hideMessage={hasIncrements}
                  balances={hasOverlap ? incrementedBalances : []}
                  collectionId={collectionId}
                />
              </>
              )}</>}

            {transfer.approvalCriteria && transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.manualBalances.length > 0 && (<>

              <BalanceDisplay
                hideMessage
                message='Predetermined Balances'
                balances={orderNumber < transfer.approvalCriteria?.predeterminedBalances.manualBalances.length ? transfer.approvalCriteria?.predeterminedBalances.manualBalances[orderNumber].balances : []}
                collectionId={collectionId}
              />
              <br />
              <b>Order Calculation: </b>{Object.entries(transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod).find(x => x[1])?.[0]}
            </>
            )}
          </div>
        </div>
        <div>
          {/* <MaxNumTransfersComponent trackedBehindTheScenes transfer={transfer} collectionId={collectionId} address={address} type={trackerType} componentType="card" setAddress={setAddress} /> */}

        </div>
      </>
    )}

  </>
}

const MaxNumTransfersComponent = ({ transfer, type, componentType, showUntracked,
  address,
  setAddress,
  collectionId,
  hideDisplay,
  trackedBehindTheScenes,
}: {
  transfer: CollectionApprovalWithDetails<bigint>,
  address?: string,
  hideDisplay?: boolean,
  setAddress: (address: string) => void,
  collectionId: bigint,
  showUntracked?: boolean, type: "overall" | "to" | "from" | "initiatedBy", componentType: 'list' | 'card', trackedBehindTheScenes?: boolean
}) => {

  const account = useAccount(address ?? '');
  const collection = useCollection(collectionId);

  if (!transfer.approvalCriteria || !transfer.approvalCriteria?.maxNumTransfers) return null;

  const maxNumTransfersKey = type === "overall" ? "overallMaxNumTransfers" : type === "to" ? "perToAddressMaxNumTransfers" : type === "from" ? "perFromAddressMaxNumTransfers" : "perInitiatedByAddressMaxNumTransfers";
  const message = type === "overall" ?
    `All approved users cumulatively can use this approval a max of x${transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times` :
    type === "to" ?
      `Each unique to address can use this approval a max of x${transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times` :
      type === "from" ?
        `Each unique from address can use this approval a max of x${transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times` :
        `Each unique approved address can use this approval a max of x${transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times`;
  const untrackedMessage = type === "overall" ?
    `The cumulative number of transfers for all approved users is not tracked` :
    type === "to" ?
      `The number of transfers for each unique to address is not tracked` :
      type === "from" ?
        `The number of transfers for each unique from address is not tracked` :
        `The number of transfers for each unique approved address is not tracked`;



  if (!(transfer.approvalCriteria?.maxNumTransfers && transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] > 0) && !trackedBehindTheScenes) return null;
  const limit = transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] ?? 0n;

  const numUsed = collection?.approvalsTrackers.find(y => y.amountTrackerId === transfer.amountTrackerId && y.trackerType === type
    && y.approvedAddress === (type === "overall" ? "" : account?.cosmosAddress ?? ''))?.numTransfers ?? 0n;

  return <>
    {componentType === 'list' && <>
      {transfer.approvalCriteria?.maxNumTransfers && transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] > 0 ? (
        <li>{message}</li>
      ) : showUntracked && (
        <li>{untrackedMessage}</li>
      )}
    </>}


    {!hideDisplay && <div className='flex flex-column primary-text' style={{ textAlign: 'center', alignItems: 'normal', margin: 16 }}>
      <br />

      {transfer.approvalCriteria?.maxNumTransfers &&
        <Statistic
          valueStyle={{ color: '#fff' }}
          value={`${numUsed.toString()} / ${!limit ? '?' : transfer.approvalCriteria.maxNumTransfers[maxNumTransfersKey].toString()}`}
          title={<>{type === "overall" ? <b className='primary-text'>Cumulative Uses - All Addresses</b> : <>
            <b className='primary-text'>Uses as {type === "to" ? 'To' : type === "from" ? 'From' : 'Approved'} Address</b>
            <AddressSelect defaultValue={address} onUserSelect={(address) => setAddress(address)} switchable fontSize={12} />
          </>
          }
          </>}
          className='primary-text'
          style={{ width: '100%', alignItems: 'normal', textAlign: 'center' }}
        />
      }

    </div >}

  </>
}


const ApprovalAmountsComponent = ({
  transfer,
  address,
  setAddress,
  collectionId,
  hideDisplay,
  showUntracked, type, componentType }: {
    transfer: CollectionApprovalWithDetails<bigint>,
    address?: string,
    setAddress: (address: string) => void,
    collectionId: bigint,
    hideDisplay?: boolean,
    showUntracked?: boolean, type: "overall" | "to" | "from" | "initiatedBy", componentType?: 'list' | 'card'
  }) => {

  const collection = useCollection(collectionId);
  const account = useAccount(address ?? '');

  if (!transfer.approvalCriteria || !transfer.approvalCriteria?.approvalAmounts) return null;

  const approvalAmountsKey = type === "overall" ? "overallApprovalAmount" : type === "to" ? "perToAddressApprovalAmount" : type === "from" ? "perFromAddressApprovalAmount" : "perInitiatedByAddressApprovalAmount";
  const message = type === "overall" ?
    `All approved users cumulatively can transfer x${transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges` :
    type === "to" ?
      `Each unique to address can transfer x${transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges` :
      type === "from" ?
        `Each unique from address can transfer x${transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges` :
        `Each unique approved address can transfer x${transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges`;

  const untrackedMessage = type === "overall" ?
    `The cumulative badges transferred for all approved users is not tracked` :
    type === "to" ?
      `The badges transferred for each unique to address is not tracked` :
      type === "from" ?
        `The badges transferred for each unique from address is not tracked` :
        `The badges transferred for each unique approved address is not tracked`;



  if (!(transfer.approvalCriteria?.approvalAmounts && transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey] > 0)) return null;

  const approvedAmounts = collection?.approvalsTrackers.find(y => y.amountTrackerId === transfer.amountTrackerId && y.trackerType === type
    && y.approvedAddress === (type === "overall" ? "" : account?.cosmosAddress ?? ''))?.amounts ?? [{
      amount: 0n,
      badgeIds: transfer.badgeIds,
      ownershipTimes: transfer.ownershipTimes,
    }];

  return <>
    {componentType === 'list' && <>
      <>
        {transfer.approvalCriteria?.approvalAmounts && transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey] > 0 ? (
          <li>{message}</li>
        ) : showUntracked && (
          <li>{untrackedMessage}</li>
        )}
      </>
    </>}
    {!hideDisplay &&
      <div className='flex-center flex-column primary-text'>
        <br />
        {(<>{type === "overall" ? <b>All Approved Users</b> : <>
          <AddressSelect defaultValue={address} onUserSelect={(address) => setAddress(address)} switchable />
        </>
        }
        </>)}

        {(
          <>
            <BalanceDisplay
              message={<>
              </>}
              hideBadges
              balances={approvedAmounts}
              collectionId={collectionId}
            />
          </>
        )}
      </div>}
  </>
}

export function TransferabilityRow({
  address, setAddress,
  allTransfers,
  setAllTransfers,
  startingApprovals,
  onRestore,
  grayedOut,
  onDelete,
  hideActions,
  editable,
  transfer,
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
  transfer: CollectionApprovalWithDetails<bigint>,
  allTransfers: CollectionApprovalWithDetails<bigint>[],
  setAllTransfers?: (allTransfers: CollectionApprovalWithDetails<bigint>[]) => void,
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
  const [orderNumber, setOrderNumber] = useState(0);
  const [transferIsVisible, setTransferIsVisible] = useState(false);
  const [fetchCodesModalIsVisible, setFetchCodesModalIsVisible] = useState<boolean>(false);

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? "";
  const hasPredetermined = approvalCriteriaUsesPredeterminedBalances(transfer.approvalCriteria);

  //Doesn't make sense to transfer to mint or have mint intiate so we remove these
  const toAddresses = transfer.toMapping.addresses.filter(x => x !== 'Mint');
  const initiatedByAddresses = transfer.initiatedByMapping.addresses.filter(x => x !== 'Mint');
  const fromAddresses = filterFromMint ? transfer.fromMapping.addresses.filter(x => x !== 'Mint') : transfer.fromMapping.addresses;


  const [balanceTab, setBalanceTab] = useState(hasPredetermined ? 'current' : 'remaining');

  const approval = transfer;
  const approvalCriteria = approval.approvalCriteria;
  const challengeTrackerId = approval.challengeTrackerId;

  const approvalLevel = isIncomingDisplay ? 'incoming' : isOutgoingDisplay ? 'outgoing' : 'collection';

  const refreshTrackers = useCallback(async (manualClick?: boolean) => {
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
      merkleChallengeIdsToFetch: [{
        collectionId,
        challengeId: challengeTrackerId ?? '',
        challengeLevel: approvalLevel,
        approverAddress: convertToCosmosAddress(approverAddress ?? '') ?? '',
      }],
      approvalsTrackerIdsToFetch: approvalsIdsToFetch,
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
  }, [collectionId, approval, approvalLevel, approverAddress, approvalCriteria, chain.cosmosAddress, challengeTrackerId]);


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display');
    if (collectionId != NEW_COLLECTION_ID && (showMoreIsVisible || transferIsVisible || editIsVisible)) {
      if (!hideActions) refreshTrackers();
    }
    //TODO: refreshTrackers here creates an infinite loop if 2+ details are open at once
  }, [collectionId, showMoreIsVisible, transferIsVisible, editIsVisible, hideActions]);

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
  if ((toAddresses.length == 0 && transfer.toMapping.includeAddresses) || (initiatedByAddresses.length == 0 && transfer.initiatedByMapping.includeAddresses) || (fromAddresses.length == 0 && transfer.fromMapping.includeAddresses)) {
    return null;
  }

  if (badgeId) {
    const [, found] = searchUintRangesForId(badgeId, transfer.badgeIds);
    if (!found) return null;
  }

  //Only show the duplicate warning on edit for edge cases
  const hasApprovalAmounts = approvalHasApprovalAmounts(transfer.approvalCriteria?.approvalAmounts);
  const hasMaxNumTransfers = approvalHasMaxNumTransfers(transfer.approvalCriteria?.maxNumTransfers);

  const hasSameTrackerId = allTransfers.find(x => x.amountTrackerId === transfer.amountTrackerId && x.approvalId !== transfer.approvalId
    &&
    ((onDelete || editable) || ((hasApprovalAmounts || hasMaxNumTransfers) && (approvalHasApprovalAmounts(x.approvalCriteria?.approvalAmounts) || approvalHasMaxNumTransfers(x.approvalCriteria?.maxNumTransfers))))
  );

  const hasSameChallengeTrackerId = allTransfers.find(x => x.challengeTrackerId === transfer.challengeTrackerId && x.approvalId !== transfer.approvalId
    &&
    ((onDelete || editable) || (
      x.approvalCriteria?.merkleChallenge?.root && transfer.approvalCriteria?.merkleChallenge?.root
      && x.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf && transfer.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf
    ))
  );

  const RowContentDetails = ({ mobile }: { mobile: boolean }) => {
    const FromValue = <AddressDisplayList
      users={transfer.fromMapping.addresses}
      allExcept={!transfer.fromMapping.includeAddresses}
      fontSize={16}
      filterMint={filterFromMint}
    />

    const ToValue = <AddressDisplayList
      users={toAddresses}
      allExcept={!transfer.toMapping.includeAddresses}
      filterMint
      fontSize={16}
    />

    const InitiatedByValue = <AddressDisplayList
      users={initiatedByAddresses}
      allExcept={!transfer.initiatedByMapping.includeAddresses}
      filterMint
      fontSize={16}
    />

    const BadgeIdsValue = <> {getBadgeIdsString(transfer.badgeIds)}</>
    const OwnershipTimesValue = <> {getTimeRangesElement(transfer.ownershipTimes, '', true)}</>
    const TransferTimesValue = <> {getTimeRangesElement(transfer.transferTimes, '', true)}</>

    const TagsValue = <> {!disapproved &&
      <div style={{ alignItems: 'center', marginLeft: 8, height: '100%', }} className='flex-center flex-wrap flex-column'>
        {onDelete && <>
          {startingApprovals?.find(x => x.approvalId === transfer.approvalId) ? <Tag
            style={{ margin: 4, backgroundColor: '#1890ff' }}
            color='#1890ff'
            className='primary-text'
          >
            Existing
          </Tag> :
            <Tag
              style={{ margin: 4, backgroundColor: '#52c41a' }}
              color='#52c41a'
              className='primary-text'
            >New</Tag>}
        </>}

        {grayedOut && <Tag
          style={{ margin: 4, backgroundColor: '#FF5733' }}
          color='#FF5733'
          className='primary-text'
        >Deleted</Tag>}

        {approvalCriteriaHasNoAmountRestrictions(transfer.approvalCriteria) && <Tag
          style={{ margin: 4, backgroundColor: '#1890ff' }}
          color='#1890ff'
          className='primary-text'
        >No Amount Restrictions</Tag>}
        {transfer.approvalCriteria?.merkleChallenge?.root && transfer.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf && <Tag
          style={{ margin: 4, backgroundColor: '#1890ff' }}
          color='#1890ff'
          className='primary-text'
        >Whitelist</Tag>}
        {transfer.approvalCriteria?.merkleChallenge?.root && !transfer.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf &&
          !transfer.details?.challengeDetails.hasPassword &&
          <Tag
            style={{ margin: 4, backgroundColor: '#1890ff' }}
            color='#1890ff'
            className='primary-text'
          >Codes</Tag>}

        {transfer.approvalCriteria?.merkleChallenge?.root && !transfer.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf &&
          transfer.details?.challengeDetails.hasPassword &&
          <Tag
            style={{ margin: 4, backgroundColor: '#df3372' }}
            color='#1890ff'
            className='primary-text'
          >Password</Tag>}
        {transfer.approvalCriteria?.overridesFromOutgoingApprovals && transfer.fromMappingId !== 'Mint' && <Tag
          style={{ margin: 4, backgroundColor: '#FF5733' }}
          color='#1890ff'
          className='primary-text'
        ><WarningOutlined /> Overrides Outgoing Approvals</Tag>}
        {transfer.approvalCriteria?.overridesToIncomingApprovals && <Tag
          style={{ margin: 4, backgroundColor: '#FF5733' }}
          color='#1890ff'
          className='primary-text'
        ><WarningOutlined /> Overrides Incoming Approvals</Tag>}
        {hasSameChallengeTrackerId && <Tag
          style={{ margin: 4, backgroundColor: '#FF5733' }}
          color='#1890ff'
          className='primary-text'
        ><WarningOutlined /> Duplicate Challenge Tracker</Tag>}
        {hasSameTrackerId && <Tag
          style={{ margin: 4, backgroundColor: '#FF5733' }}
          color='#1890ff'
          className='primary-text'
        ><WarningOutlined /> Duplicate Amount Tracker</Tag>}

        {(transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy ?? 0n) > 0n || (transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy ?? 0n) > 0n && <Tag
          style={{ margin: 4, backgroundColor: '#1890ff' }}
          color='#1890ff'
          className='primary-text'
        >Incrementing Badge IDs</Tag>}
      </div>
    }
      {!disapproved ? <td>
      </td> :

        <td className='flex-center'><Tag
          style={{ margin: 4, backgroundColor: 'red' }}
          color='#1890ff'
          className='primary-text'
        >Disapproved</Tag> </td>}
    </>




    if (mobile) {
      return <>
        <TableRow label={'From'} value={FromValue} />
        <TableRow label={'To'} value={ToValue} />
        <TableRow label={'Initiated By'} value={InitiatedByValue} />
        <TableRow label={'Badge IDs'} value={BadgeIdsValue} />
        <TableRow label={'Ownership Times'} value={OwnershipTimesValue} />
        <TableRow label={'Transfer Times'} value={TransferTimesValue} />
        <TableRow label={'Tags'} value={TagsValue} />
      </>
    }



    return <tr style={{ opacity: grayedOut ? 0.5 : undefined }}>


      {
        !disapproved ?
          <td style={{}}>

            {<span style={{ fontSize: 20, marginLeft: 4, marginRight: 24, color: 'green' }}><CheckCircleFilled /></span>}

          </td> :

          <td style={{}}>{<span style={{ fontSize: 20, marginLeft: 4, marginRight: 24, color: 'red' }}><CloseCircleFilled /></span>} </td>}

      <td style={{ alignItems: 'center' }}>
        {FromValue}
      </td>
      <td style={{ alignItems: 'center' }}>
        {ToValue}
      </td>
      <td style={{ alignItems: 'center' }}>
        {InitiatedByValue}
      </td>

      <td style={{ alignItems: 'center' }}>
        {TransferTimesValue}
      </td>
      <td style={{ alignItems: 'center' }}>
        {BadgeIdsValue}
      </td>
      <td style={{ alignItems: 'center' }}>
        {OwnershipTimesValue}
      </td>

      <td style={{ alignItems: 'center' }}>
        {TagsValue}
      </td>
    </tr >
  }


  if (isIncomingDisplay || isOutgoingDisplay) {
    hideActions = true;
  }

  const isMint = approval.fromMappingId === 'Mint'

  const WideViewContent = () => {
    return <div className='overflow-x-auto'>
      <table className="table-auto overflow-x-scroll w-full table-wrp">
        <thead className='sticky top-0 z-10' style={{ zIndex: 10 }}>
          {getTableHeader()}
        </thead>
        <tbody>
          {<RowContentDetails mobile={false} />}
        </tbody>
      </table>
    </div>
  }


  const InnerContent = () => {


    const OnRestoreValue = onRestore && <td>
      {!disapproved &&
        <div className='flex-center'>

          <IconButton
            secondary
            src={<UndoOutlined />}
            onClick={() => onRestore(transfer.approvalId)}
            text='Restore'
            size={40}
            disabled={transfer.approvalId === 'default-outgoing' || transfer.approvalId === 'default-incoming'}
          />
        </div>}
    </td>

    const isExisting = startingApprovals?.find(x => x.approvalId === transfer.approvalId);
    const EditableValue = editable && <td>


      {!disapproved && !isExisting &&
        <div className='flex-center' onClick={(e) => { e.stopPropagation(); }}>
          <IconButton
            secondary
            src={editIsVisible ? <MinusOutlined /> : <EditOutlined />}
            onClick={() => {
              setEditIsVisible(!editIsVisible);
              setShowMoreIsVisible(false);
            }}
            text={editIsVisible ? 'Cancel Edit' : 'Edit'}
            size={40}
            disabled={transfer.approvalId === 'default-outgoing' || transfer.approvalId === 'default-incoming'}
          />
        </div>}

    </td>

    const OnDeleteValue = onDelete && <td>
      {!disapproved &&
        <div className='flex-center' onClick={(e) => { e.stopPropagation(); }}>

          <IconButton
            secondary
            src={<DeleteOutlined />}
            onClick={() => onDelete(transfer.approvalId)}
            size={40}
            text='Delete'
            disabled={transfer.approvalId === 'default-outgoing' || transfer.approvalId === 'default-incoming'}
          />

        </div>}

    </td>

    if (!transfer.details && compareObjects(transferableApproval, transfer)) {
      transfer.details = {
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

    return <>
      <br />
      <div className='flex-center flex-wrap'>

        <InformationDisplayCard title={transfer.details?.name ?? ''} md={24} xs={24} sm={24} >

          {<><br />
            {
              <Col md={0} xs={24} sm={24}>
                <RowContentDetails mobile />
              </Col>
            }
            {
              <Col md={24} xs={0} sm={0}>
                {<WideViewContent />}
              </Col>
            }


          </>
          }

          {showMoreIsVisible && !disapproved && <>
            {transfer.details?.description && <> <MarkdownDisplay markdown={transfer.details?.description ?? ''} /><br /></>}

            <div className='flex-center flex-wrap full-width' style={{ alignItems: 'normal' }}>
              <DetailsCard
                isEdit={!!onDelete || editable}

                transfer={transfer} allTransfers={allTransfers} isIncomingDisplay={isIncomingDisplay} isOutgoingDisplay={isOutgoingDisplay} collectionId={collectionId} address={address} setAddress={setAddress} />

              <InformationDisplayCard inheritBg noBorder title='Balances' md={12} xs={24} sm={24}>
                <Radio.Group
                  buttonStyle='solid'
                  onChange={(e) => {
                    setBalanceTab(e.target.value);
                  }}
                  value={balanceTab}
                >
                  {hasPredetermined && <Radio.Button value='current'>
                    <div className='primary-text hover:text-gray-400'>
                      Badges to Receive
                    </div>
                  </Radio.Button>}
                  <Radio.Button value='remaining'><div className='primary-text hover:text-gray-400'>
                    Sender Balances
                  </div></Radio.Button>
                  <Radio.Button value="all"><div className='primary-text hover:text-gray-400'>
                    All Badges
                  </div></Radio.Button>
                </Radio.Group>
                <br /><br />
                {balanceTab === 'all' && collection && <>
                  <div className='flex-center'>
                    <BadgeAvatarDisplay
                      collectionId={collectionId}
                      badgeIds={transfer.badgeIds}
                      filterGreaterThanMax
                      showIds
                    />

                  </div>
                </>}
                {balanceTab === 'remaining' && <>
                  {transfer.fromMapping.addresses.length > 1 || !transfer.fromMapping.includeAddresses ? <>
                    <div className='secondary-text'>
                      <InfoCircleOutlined /> There are multiple addresses approved as senders.
                    </div>
                    <br />
                  </> : <></>}
                  <BalanceOverview
                    collectionId={collectionId}
                    hideSelect={transfer.fromMapping?.addresses.length === 1 && transfer.fromMapping.includeAddresses}
                    defaultAddress={transfer.fromMapping?.addresses.length >= 1 && transfer.fromMapping.includeAddresses ? transfer.fromMapping?.addresses[0] : undefined}

                  />
                </>}
                {balanceTab === 'current' && <>
                  {hasPredetermined && <>
                    <PredeterminedCard
                      transfer={transfer}
                      orderNumber={orderNumber}
                      setOrderNumber={setOrderNumber}
                      collectionId={collectionId}
                      address={address}
                      setAddress={setAddress}
                    />
                  </>}

                </>}

              </InformationDisplayCard>

            </div>
          </>}
          {!disapproved && <>
            <br />
            <div className="flex-center flex-wrap">

              {!onDelete && currentManager && currentManager === chain.cosmosAddress && transfer.approvalCriteria?.merkleChallenge?.root && !transfer.approvalCriteria.merkleChallenge.useCreatorAddressAsLeaf && <div>

                <IconButton
                  secondary
                  src={<DatabaseOutlined size={40} />}
                  onClick={() => setFetchCodesModalIsVisible(true)}
                  text={'Codes'}
                  tooltipMessage={'Since you are the manager of this collection, you can view the codes / password for this claim.'}
                  size={40}
                />

                <FetchCodesModal
                  visible={fetchCodesModalIsVisible}
                  setVisible={setFetchCodesModalIsVisible}
                  collectionId={collectionId}
                />
              </div>}
              {collectionId !== NEW_COLLECTION_ID && showMoreIsVisible &&
                <IconButton
                  secondary
                  src={<CloudSyncOutlined size={40} />}
                  onClick={() => refreshTrackers(true)}
                  text={'Refresh'}
                  tooltipMessage={'Refresh'}
                  size={40}
                />}
              {!disapproved &&
                <IconButton

                  secondary
                  src={showMoreIsVisible ? <MenuFoldOutlined size={40} /> : <MenuUnfoldOutlined size={40} />}
                  onClick={() => {
                    setShowMoreIsVisible(!showMoreIsVisible)
                    setEditIsVisible(false);
                  }}
                  disabled={editIsVisible}
                  text={showMoreIsVisible ? 'Hide Details' : 'Details'}
                  tooltipMessage={showMoreIsVisible ? 'Hide Details' : 'Details'}
                  size={40}
                />}
              {!editable && !onDelete && !hideActions && !disapproved &&
                <IconButton

                  secondary
                  src={<SwapOutlined />}
                  onClick={() => setTransferIsVisible(!transferIsVisible)}
                  text={"Transfer"}
                  tooltipMessage={"Transfer"}
                  size={40}
                />}
              {EditableValue}

              {OnRestoreValue}
              {OnDeleteValue}
            </div>

            {
              editable && !disapproved && showMoreIsVisible && <>
                <br />
                <div className='flex-center'>
                  <div>
                    This approval is  <span style={{ alignItems: 'center', marginLeft: 8, height: '100%' }}>
                      {startingApprovals?.find(x => x.approvalId === transfer.approvalId) ? <Tag
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
                      {startingApprovals?.find(x => x.approvalId === transfer.approvalId) ? ' will continue adding on to the existing tally.' : ' will start from scratch.'}

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
                fromTransferabilityRow
              />
            }


          </>}

          {editIsVisible && collection && transfer && setAllTransfers &&

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
                    defaultApproval={transfer}
                    approvalLevel={approvalLevel}
                    approvals={allTransfers}
                    approverAddress={approverAddress ?? ''}
                    setApprovals={setAllTransfers}
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


    </>
  }

  return <>
    <div style={{ textAlign: 'center' }}>
      {collection && <InnerContent />}
    </div >
  </>
}
