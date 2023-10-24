import { CloudSyncOutlined, DatabaseOutlined, DeleteOutlined, EditOutlined, InfoCircleOutlined, MinusOutlined, StopFilled, SwapOutlined, UndoOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, InputNumber, Progress, Radio, Tag, Tooltip, Typography, notification } from 'antd';
import { AmountTrackerIdDetails } from 'bitbadgesjs-proto';
import { CollectionApprovalWithDetails, convertToCosmosAddress, filterZeroBalances, getBalancesForIds, getCurrentValueForTimeline, removeUintRangeFromUintRange, searchUintRangesForId } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useAccountsContext } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { getTotalNumberOfBadges } from '../../bitbadges-api/utils/badges';
import { approvalCriteriaHasNoAmountRestrictions, approvalHasApprovalAmounts, approvalHasMaxNumTransfers } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getBadgeIdsString } from '../../utils/badgeIds';
import { GO_MAX_UINT_64, getTimeRangesElement } from '../../utils/dates';
import { AddressDisplay } from '../address/AddressDisplay';
import { AddressDisplayList } from '../address/AddressDisplayList';
import { AddressSelect } from '../address/AddressSelect';
import { BadgeAvatarDisplay } from '../badges/BadgeAvatarDisplay';
import { BalanceDisplay } from '../badges/balances/BalanceDisplay';
import IconButton from '../display/IconButton';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { FetchCodesModal } from '../tx-modals/FetchCodesModal';
import { CreateClaims } from '../tx-timelines/form-items/CreateClaims';
import { BalanceOverview } from './BalancesInfo';

export const getTableHeader = (expandedSingleView: boolean) => {
  return <tr >
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      From
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      To
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      Initiated By <Tooltip title="The address that can initiate the transfer transaction.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      Transfer Times
      <Tooltip title="The times at which the transfer can take place.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      Badge IDs
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 70 }}><b>
      Ownership Times
      <Tooltip title="The ownership times for the badges that are allowed to be transferred.">
        <InfoCircleOutlined style={{ marginLeft: 4 }} />
      </Tooltip>
    </b></td>
    <td style={{ verticalAlign: 'top', minWidth: 40 }}><b>
      Tags
    </b></td>
    {!expandedSingleView && <>
      <td style={{ verticalAlign: 'top', minWidth: 40 }}><b>

      </b></td>
      <td style={{ verticalAlign: 'top' }}></td>

      <td style={{ verticalAlign: 'top' }}></td>
    </>}
  </tr>
}

export const DetailsCard = ({ allTransfers, transfer, isOutgoingDisplay, isIncomingDisplay, collectionId, address, setAddress }: {
  allTransfers: CollectionApprovalWithDetails<bigint>[],
  transfer: CollectionApprovalWithDetails<bigint>, isOutgoingDisplay?: boolean, isIncomingDisplay?: boolean
  collectionId: bigint, address?: string,
  setAddress: (address: string) => void

}) => {

  const [whitelistIsVisible, setWhitelistIsVisible] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasApprovalAmounts = approvalHasApprovalAmounts(transfer.approvalCriteria?.approvalAmounts);

  const hasMaxNumTransfers = approvalHasMaxNumTransfers(transfer.approvalCriteria?.maxNumTransfers);

  const hasSameTrackerId = allTransfers.find(x => x.amountTrackerId === transfer.amountTrackerId && x.approvalId !== transfer.approvalId
    && (hasApprovalAmounts || hasMaxNumTransfers) && (approvalHasApprovalAmounts(x.approvalCriteria?.approvalAmounts) || approvalHasMaxNumTransfers(x.approvalCriteria?.maxNumTransfers))
  );

  const hasSameChallengeTrackerId = allTransfers.find(x => x.challengeTrackerId === transfer.challengeTrackerId && x.approvalId !== transfer.approvalId
    && x.approvalCriteria?.merkleChallenge?.root && transfer.approvalCriteria?.merkleChallenge?.root
    && x.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf && transfer.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf
  );
  return <InformationDisplayCard title='Restrictions' md={11} xs={24} sm={24}>
    <ul style={{ textAlign: 'left' }}>
      {transfer.approvalCriteria?.requireFromDoesNotEqualInitiatedBy && !isOutgoingDisplay && (
        <li>{"From address must NOT equal initiator's address"}</li>
      )}
      {transfer.approvalCriteria?.requireFromEqualsInitiatedBy && !isOutgoingDisplay && (
        <li>{"From address must equal initiator's address"}</li>
      )}
      {transfer.approvalCriteria?.requireToDoesNotEqualInitiatedBy && !isIncomingDisplay && (
        <li>{"To address must NOT equal initiator's address"}</li>
      )}
      {transfer.approvalCriteria?.requireToEqualsInitiatedBy && !isIncomingDisplay && (
        <li>{"To address must equal initiator's address"}</li>
      )}
      {!isOutgoingDisplay && <>
        {transfer.fromMappingId !== "Mint" && transfer.approvalCriteria?.overridesFromOutgoingApprovals ? (
          <li>
            <WarningOutlined style={{ color: 'orange', marginRight: 4 }} />
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
          <li><WarningOutlined style={{ color: 'orange', marginRight: 4 }} />{"Does not check the recipient's incoming approvals"}</li>
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
              <li>{transfer.details?.challengeDetails.leavesDetails.leaves.length.toString()} {`valid ${transfer.details ? transfer.details?.challengeDetails.hasPassword
                ? 'password' : 'code' : 'password / code'}(s)`}</li>
            )}
            {/* <li>{transfer.approvalCriteria.merkleChallenge.maxUsesPerLeaf ? `Max ${transfer.approvalCriteria.merkleChallenge.maxUsesPerLeaf.toString()} use(s) per code / password` : "No limit on claims per code / password"}</li> */}
          </>}
        </>
      )}
      {
        transfer.approvalCriteria?.predeterminedBalances && (transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
          transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.manualBalances.length > 0) &&
        (
          <li>{"Predetermined balances for each transfer"}</li>
        )
      }


      <MaxNumTransfersComponent transfer={transfer} collectionId={collectionId} address={address} type="overall" componentType="list" setAddress={setAddress} />
      <MaxNumTransfersComponent transfer={transfer} collectionId={collectionId} address={address} type="to" componentType="list" setAddress={setAddress} />
      <MaxNumTransfersComponent transfer={transfer} collectionId={collectionId} address={address} type="from" componentType="list" setAddress={setAddress} />
      <MaxNumTransfersComponent transfer={transfer} collectionId={collectionId} address={address} type="initiatedBy" componentType="list" setAddress={setAddress} />
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
      <button className='styled-button' style={{ width: 200, cursor: 'pointer', background: 'inherit !important' }} onClick={() => setShowAdvanced(!showAdvanced)}>{showAdvanced ? 'Hide' : 'Show'} Advanced</button>
    </div>
    {
      showAdvanced && <>
        <br />
        <ul style={{ textAlign: 'start' }}>
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
          <WarningOutlined style={{ color: 'orange', marginRight: 4 }} /> There are multiple approvals using the same amount tracker ID.
          The tally of badges transferred and the number of transfers are linked and will increment whenever either approval is used.
        </>
      )}
      {hasSameChallengeTrackerId && (
        <>
          <WarningOutlined style={{ color: 'orange', marginRight: 4 }} /> There are multiple approvals using the same challenge tracker ID.
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
  collectionId: bigint, transfer: CollectionApprovalWithDetails<bigint>, orderNumber: number, setOrderNumber: (orderNumber: number) => void
}) => {

  const claim = transfer.approvalCriteria?.merkleChallenge
  const approval = transfer;
  const collections = useCollectionsContext();
  const accounts = useAccountsContext();
  const collection = collections.getCollection(collectionId);

  const approvalCriteria = transfer.approvalCriteria;
  const calculationMethod = transfer.approvalCriteria?.predeterminedBalances?.orderCalculationMethod;
  let trackerType = '';
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
      accounts.fetchAccounts([approvalCriteria?.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[orderNumber] ?? '']);
    }
  }, [orderNumber, claim]);


  const numIncrements = approvalTracker?.numTransfers ?? 0n;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set claim number');
    if (numIncrements > 0n) setOrderNumber(Number(numIncrements));
  }, [numIncrements]);

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
        <ul style={{ textAlign: 'left' }}>
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
                      <>{"Claim number starts at 1 for each unique initiator (initiated by address) and increments by 1 every transfer initiated by that address."}</>
                      : <>{'Unknown'}</>
            }
              {!calculationMethod?.usePerInitiatedByAddressNumTransfers && !calculationMethod?.useMerkleChallengeLeafIndex && <>

                <WarningOutlined style={{ color: 'orange', margin: 4 }} /> The claim number is calculated at processing time. Below is the next claim number to be processed, but it is subject to change if others are processed before your claim.

              </>}
            </li>
            {calculationMethod?.useMerkleChallengeLeafIndex ? <></> : <div className='flex-center flex-column'><br />


              {!calculationMethod?.useOverallNumTransfers &&
                <>
                  <div className='flex-center flex primary-text'>
                    <AddressDisplay addressOrUsername={address ?? ''} fontSize={14} />

                    {!calculationMethod?.usePerInitiatedByAddressNumTransfers && <IconButton src={showSelect ? <MinusOutlined /> : <SwapOutlined />} style={{ marginLeft: 4 }} text='Switch' onClick={() => setShowSelect(!showSelect)} />}
                  </div>
                  {showSelect && !calculationMethod?.usePerInitiatedByAddressNumTransfers && <><AddressSelect defaultValue={address} onUserSelect={(address) => setAddress?.(address)} /><br /></>}

                </>
              }

              <Typography.Text className="primary-text" style={{ fontSize: 18 }} strong>
                {`Current - Claim #${BigInt(numIncrements) + 1n}`}
              </Typography.Text>

              <br />
            </div>}

            {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy > 0 && (<li>
              Each claim number increments the badge IDs by {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy.toString()}

            </li>)}


            {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy > 0 && (<li>
              Each claim number increments the ownership times by {transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy.toString()}
            </li>)}
          </>}
        </ul>
        <div className='flex-center inherit-bg primary-text'>
          <div>
            {hasIncrements ? <>

              <br />
              <Typography.Text strong style={{ fontSize: 16 }} className='primary-text'>
                Claim #
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
              <br />
            </> : <></>}
            {!hasIncrements ? <>
              {transfer.approvalCriteria && transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 && (<>
                <BalanceDisplay
                  message={hasIncrements ? `Balances for Claim #${orderNumber + 1}` : 'Balances - All or Nothing'}
                  balances={hasOverlap ? incrementedBalances : []}
                  collectionId={collectionId}
                />
              </>
              )}
            </> : !hasOverlap || exceedsMaxNumTransfers ? <div className='primary-text'>
              <br />
              <WarningOutlined style={{ color: 'orange', marginRight: 4 }} /> This claim number is not possible because
              {exceedsMaxNumTransfers && <> it exceeds the max cumulative uses for this approval.</>}
              {!hasOverlap && !exceedsMaxNumTransfers && <> the badge IDs are no longer in range.</>}
            </div> : <>
              {transfer.approvalCriteria && transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 && (<>
                <BalanceDisplay
                  message={hasIncrements ? `Balances for Claim #${orderNumber + 1}` : 'Balances - All or Nothing'}
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
      </>
    )}

  </>
}

const MaxNumTransfersComponent = ({ transfer, type, componentType, showUntracked,
  address,
  setAddress,
  collectionId
}: {
  transfer: CollectionApprovalWithDetails<bigint>,
  address?: string,
  setAddress: (address: string) => void,
  collectionId: bigint,
  showUntracked?: boolean, type: "overall" | "to" | "from" | "initiatedBy", componentType: 'list' | 'card'
}) => {
  const collections = useCollectionsContext();
  const accounts = useAccountsContext();
  const collection = collections.getCollection(collectionId);


  if (!transfer.approvalCriteria || !transfer.approvalCriteria?.maxNumTransfers) return null;

  const maxNumTransfersKey = type === "overall" ? "overallMaxNumTransfers" : type === "to" ? "perToAddressMaxNumTransfers" : type === "from" ? "perFromAddressMaxNumTransfers" : "perInitiatedByAddressMaxNumTransfers";
  const message = type === "overall" ?
    `All users cumulatively can transfer x${transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times` :
    type === "to" ?
      `Each unique to address can transfer x${transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times` :
      type === "from" ?
        `Each unique from address can transfer x${transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times` :
        `Each unique initiated by address can transfer x${transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey].toString()} times`;
  const untrackedMessage = type === "overall" ?
    `The cumulative number of transfers for all users is not tracked` :
    type === "to" ?
      `The number of transfers for each unique to address is not tracked` :
      type === "from" ?
        `The number of transfers for each unique from address is not tracked` :
        `The number of transfers for each unique initiated by address is not tracked`;



  if (!(transfer.approvalCriteria?.maxNumTransfers && transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] > 0)) return null;

  const numUsed = collection?.approvalsTrackers.find(y => y.amountTrackerId === transfer.amountTrackerId && y.trackerType === type
    && y.approvedAddress === (type === "overall" ? "" : accounts.getAccount(address ?? '')?.cosmosAddress ?? ''))?.numTransfers ?? 0n;
  const percent = (Number(numUsed) / Number(transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey])) * 100;
  return <>
    {componentType === 'list' && <>
      {transfer.approvalCriteria?.maxNumTransfers && transfer.approvalCriteria?.maxNumTransfers[maxNumTransfersKey] > 0 ? (
        <li>{message}</li>
      ) : showUntracked && (
        <li>{untrackedMessage}</li>
      )}
    </>}


    <div className='flex-center flex-column primary-text' style={{ textAlign: 'center' }}>
      <br />
      {(<>{type === "overall" ? <b>All Users</b> : <>
        <AddressSelect defaultValue={address} onUserSelect={(address) => setAddress(address)} switchable />
      </>
      }
      </>)}

      {transfer.approvalCriteria?.maxNumTransfers &&
        <Progress percent={percent} type='line' className='primary-text' format={() => {
          if (!(transfer.approvalCriteria?.maxNumTransfers)) return null;
          return <div className='flex-center flex-column primary-text'>
            {`${numUsed.toString()} / ${transfer.approvalCriteria.maxNumTransfers[maxNumTransfersKey].toString()}`}
          </div>
        }} />
      }
    </div >
  </>
}


const ApprovalAmountsComponent = ({
  transfer,
  address,
  setAddress,
  collectionId,
  showUntracked, type, componentType }: {
    transfer: CollectionApprovalWithDetails<bigint>,
    address?: string,
    setAddress: (address: string) => void,
    collectionId: bigint,
    showUntracked?: boolean, type: "overall" | "to" | "from" | "initiatedBy", componentType?: 'list' | 'card'
  }) => {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);
  const accounts = useAccountsContext();

  if (!transfer.approvalCriteria || !transfer.approvalCriteria?.approvalAmounts) return null;

  const approvalAmountsKey = type === "overall" ? "overallApprovalAmount" : type === "to" ? "perToAddressApprovalAmount" : type === "from" ? "perFromAddressApprovalAmount" : "perInitiatedByAddressApprovalAmount";
  const title = type === "overall" ? "Overall" : type === "to" ? "Per To Address" : type === "from" ? "Per From Address" : "Per Initiated By Address";
  const message = type === "overall" ?
    `All users cumulatively can transfer x${transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges` :
    type === "to" ?
      `Each unique to address can transfer x${transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges` :
      type === "from" ?
        `Each unique from address can transfer x${transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges` :
        `Each unique initiated by address can transfer x${transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString()} of the badges`;

  const untrackedMessage = type === "overall" ?
    `The cumulative badges transferred for all users is not tracked` :
    type === "to" ?
      `The badges transferred for each unique to address is not tracked` :
      type === "from" ?
        `The badges transferred for each unique from address is not tracked` :
        `The badges transferred for each unique initiated by address is not tracked`;



  if (!(transfer.approvalCriteria?.approvalAmounts && transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey] > 0)) return null;

  const approvedAmounts = collection?.approvalsTrackers.find(y => y.amountTrackerId === transfer.amountTrackerId && y.trackerType === type
    && y.approvedAddress === (type === "overall" ? "" : accounts.getAccount(address ?? '')?.cosmosAddress ?? ''))?.amounts ?? [{
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
    <div className='flex-center flex-column primary-text'>

      {(
        <>
          <BalanceDisplay
            message={<>
              {title + ' - Transferred (Max x' + transfer.approvalCriteria?.approvalAmounts[approvalAmountsKey].toString() + ')'}
              <br />
              {(<>{type === "overall" ? <b>All Users</b> : <> <AddressSelect defaultValue={address} onUserSelect={(address) => setAddress?.(address)} />
              </>
              }
              </>)}
            </>}
            balances={approvedAmounts}
            collectionId={collectionId}
          />
        </>
      )}
    </div>
  </>
}

export function TransferabilityRow({
  address, setAddress,
  allTransfers,
  startingApprovals,
  onRestore,
  grayedOut,
  onDelete,
  expandedSingleView,
  onEdit,
  transfer,
  badgeId,
  collectionId,
  filterFromMint,
  noBorder, ignoreRow, disapproved, isIncomingDisplay, isOutgoingDisplay, approverAddress }: {
    transfer: CollectionApprovalWithDetails<bigint>,
    allTransfers: CollectionApprovalWithDetails<bigint>[],
    startingApprovals?: CollectionApprovalWithDetails<bigint>[],
    approverAddress?: string,
    badgeId?: bigint,

    collectionId: bigint,
    filterFromMint?: boolean,
    noBorder?: boolean,
    ignoreRow?: boolean,
    disapproved?: boolean,
    isIncomingDisplay?: boolean,
    isOutgoingDisplay?: boolean,
    address?: string,
    setAddress: (address: string) => void,
    onDelete?: (approvalId: string) => void,
    onEdit?: (transfer: CollectionApprovalWithDetails<bigint>) => void,
    onRestore?: () => void,
    grayedOut?: boolean,
    expandedSingleView?: boolean,
  }) {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);
  const [showMoreIsVisible, setShowMoreIsVisible] = useState(expandedSingleView ? true : false);
  const [editIsVisible, setEditIsVisible] = useState(false);
  const [orderNumber, setOrderNumber] = useState(0);
  const chain = useChainContext();

  const [fetchCodesModalIsVisible, setFetchCodesModalIsVisible] = useState<boolean>(false);

  const currentManager = getCurrentValueForTimeline(collection?.managerTimeline ?? [])?.manager ?? "";


  const hasPredetermined = transfer.approvalCriteria?.predeterminedBalances && (transfer.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
    transfer.approvalCriteria?.predeterminedBalances && transfer.approvalCriteria?.predeterminedBalances.manualBalances.length > 0);

  const [balanceTab, setBalanceTab] = useState(hasPredetermined ? 'current' : 'remaining');

  //Doesn't make sense to transfer to mint or have mint intiate so we remove these
  const toAddresses = transfer.toMapping.addresses.filter(x => x !== 'Mint');
  const initiatedByAddresses = transfer.initiatedByMapping.addresses.filter(x => x !== 'Mint');
  const fromAddresses = filterFromMint ? transfer.fromMapping.addresses.filter(x => x !== 'Mint') : transfer.fromMapping.addresses;

  const editable = !!onDelete;

  const approval = transfer;
  const approvalCriteria = approval.approvalCriteria;
  const challengeTrackerId = approval.challengeTrackerId;

  const approvalLevel = isIncomingDisplay ? 'incoming' : isOutgoingDisplay ? 'outgoing' : 'collection';

  async function refreshTrackers() {
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

    await collections.fetchCollectionsWithOptions([{
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

    notification.success({
      message: 'Refreshed!',
      description: 'The claim has been refreshed!',
      duration: 5,
    });
  }
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display');
    if (collectionId > 0 && showMoreIsVisible) {
      async function fetchTrackers() {
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

        collections.fetchCollectionsWithOptions([{
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
        }]);
      }

      fetchTrackers();
    }
  }, [collectionId, challengeTrackerId, showMoreIsVisible]);


  //Only show rows that have at least one address (after filtration)
  if ((toAddresses.length == 0 && transfer.toMapping.includeAddresses) || (initiatedByAddresses.length == 0 && transfer.initiatedByMapping.includeAddresses) || (fromAddresses.length == 0 && transfer.fromMapping.includeAddresses)) {

    return null;
  }

  if (badgeId) {
    const [, found] = searchUintRangesForId(badgeId, transfer.badgeIds);
    if (!found) return null;

    transfer.badgeIds = [{ start: badgeId, end: badgeId }];
  }

  const hasApprovalAmounts = approvalHasApprovalAmounts(transfer.approvalCriteria?.approvalAmounts);

  const hasMaxNumTransfers = approvalHasMaxNumTransfers(transfer.approvalCriteria?.maxNumTransfers);

  const hasSameTrackerId = allTransfers.find(x => x.amountTrackerId === transfer.amountTrackerId && x.approvalId !== transfer.approvalId
    && (hasApprovalAmounts || hasMaxNumTransfers) && (approvalHasApprovalAmounts(x.approvalCriteria?.approvalAmounts) || approvalHasMaxNumTransfers(x.approvalCriteria?.maxNumTransfers))
  );

  const hasSameChallengeTrackerId = allTransfers.find(x => x.challengeTrackerId === transfer.challengeTrackerId && x.approvalId !== transfer.approvalId
    && x.approvalCriteria?.merkleChallenge?.root && transfer.approvalCriteria?.merkleChallenge?.root
    && x.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf && transfer.approvalCriteria?.merkleChallenge?.maxUsesPerLeaf
  );

  return <>


    <tr style={{ opacity: grayedOut ? 0.5 : undefined }}
      className=
      {!disapproved && !expandedSingleView ? 'transferability-row' : undefined}
      onClick={!disapproved && !expandedSingleView ? () => setShowMoreIsVisible(!showMoreIsVisible) : () => { }}>
      <td style={{ alignItems: 'center' }}>
        <AddressDisplayList
          users={transfer.fromMapping.addresses}
          allExcept={!transfer.fromMapping.includeAddresses}
          fontSize={16}
          filterMint={filterFromMint}
        />
      </td>
      <td style={{ alignItems: 'center' }}>
        <AddressDisplayList
          users={toAddresses}
          allExcept={!transfer.toMapping.includeAddresses}
          filterMint
          fontSize={16}
        />
      </td>
      <td style={{ alignItems: 'center' }}>
        <AddressDisplayList
          users={initiatedByAddresses}
          allExcept={!transfer.initiatedByMapping.includeAddresses}
          filterMint
          fontSize={16}
        />
      </td>

      <td style={{ alignItems: 'center' }}>
        {getTimeRangesElement(transfer.transferTimes, '', true)}
      </td>
      <td style={{ alignItems: 'center' }}>
        {getBadgeIdsString(transfer.badgeIds)}
      </td>
      <td style={{ alignItems: 'center' }}>
        {getTimeRangesElement(transfer.ownershipTimes, '', true)}
      </td>
      <td style={{ alignItems: 'center' }}>
        {!disapproved &&
          <div style={{ alignItems: 'center', marginLeft: 8, height: '100%', }} className='flex-center flex-wrap flex-column'>
            {onDelete && <>
              {startingApprovals?.find(x => x.approvalId === transfer.approvalId) ? <Tag
                style={{ margin: 4, backgroundColor: '#1890ff' }}
                color='#1890ff'
                className='primary-text'
              >Existing</Tag> :
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
            {transfer.approvalCriteria?.merkleChallenge?.root && !transfer.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf && <Tag
              style={{ margin: 4, backgroundColor: '#1890ff' }}
              color='#1890ff'
              className='primary-text'
            >Codes</Tag>}
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
      </td>
      {onRestore && <td>
        {!disapproved &&
          <div className='flex-center'>

            <IconButton
              src={<UndoOutlined />}
              onClick={() => onRestore()}
              text='Restore'
            />
          </div>}
      </td>}
      {onEdit && <td>


        {!disapproved &&
          <div className='flex-center' onClick={(e) => { e.stopPropagation(); }}>
            <IconButton
              style={{ backgroundColor: editIsVisible ? 'black' : undefined }}
              src={<EditOutlined />}
              onClick={() => {
                setEditIsVisible(!editIsVisible);
                setShowMoreIsVisible(false);
              }
              }
              text='Edit'
            />
          </div>}

      </td>}
      {onDelete && <td>
        {!disapproved &&
          <div className='flex-center' onClick={(e) => { e.stopPropagation(); }}>

            <IconButton
              src={<DeleteOutlined />}
              onClick={() => onDelete(transfer.approvalId)}
              text='Delete'
              disabled={transfer.approvalId === 'default-outgoing' || transfer.approvalId === 'default-incoming'}
            />

          </div>}

      </td>}
      {!disapproved && !expandedSingleView ? <td>

        {showMoreIsVisible ? <span style={{ fontSize: 20 }}>▲</span> : <span style={{ fontSize: 20 }}>▼</span>}

      </td> :
        expandedSingleView ? <></> :
          <td> <StopFilled style={{ fontSize: 20, color: 'red' }} /></td>}

    </tr >
    {editIsVisible && collection && transfer &&
      <tr style={{ borderBottom: noBorder ? undefined : '1px solid gray' }} className="transferability-row-more">
        {!ignoreRow &&
          <td colSpan={1000} style={{ alignItems: 'center' }}>
            <CreateClaims setVisible={setEditIsVisible} defaultApproval={transfer} nonMintApproval={filterFromMint} />
          </td>
        }
      </tr>}

    {showMoreIsVisible && collection &&
      <tr style={{ borderBottom: noBorder ? undefined : '1px solid gray' }} className="transferability-row-more">
        {!ignoreRow &&
          <td colSpan={1000} style={{ alignItems: 'center' }}>
            {editable && <>
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
            </>}
            <br />

            {transfer.details?.name && <Typography.Text strong style={{ fontSize: 18 }} className='primary-text'>{transfer.details?.name}</Typography.Text>}
            <br />
            {transfer.details?.description && <Typography.Text style={{ fontSize: 16 }} className='primary-text'>{transfer.details?.description}</Typography.Text>}
            <br />
            <div className="flex-center flex-wrap">

              {currentManager && currentManager === chain.cosmosAddress && transfer.approvalCriteria?.merkleChallenge?.root && !transfer.approvalCriteria.merkleChallenge.useCreatorAddressAsLeaf && <div>

                <IconButton
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
              {collectionId !== NEW_COLLECTION_ID &&
                <IconButton
                  src={<CloudSyncOutlined size={40} />}
                  onClick={() => refreshTrackers()}
                  text={'Refresh'}
                  tooltipMessage={'Refresh'}
                  size={40}
                />}



            </div>
            <div className='flex-center flex-wrap full-width' style={{ alignItems: 'normal' }}>
              <DetailsCard transfer={transfer} allTransfers={allTransfers} isIncomingDisplay={isIncomingDisplay} isOutgoingDisplay={isOutgoingDisplay} collectionId={collectionId} address={address} setAddress={setAddress} />

              <InformationDisplayCard title='Balances' md={11} xs={24} sm={24}>
                <Radio.Group
                  buttonStyle='solid'
                  onChange={(e) => {
                    setBalanceTab(e.target.value);
                  }}
                  value={balanceTab}
                  style={{ width: '100%' }}
                >
                  {hasPredetermined && <Radio.Button value='current'>Approved</Radio.Button>}
                  <Radio.Button value='remaining'>Sender Balances</Radio.Button>
                  <Radio.Button value="all">All Badges</Radio.Button>
                </Radio.Group>
                <br /><br />
                {balanceTab === 'all' && <>
                  <div className='flex-center'>
                    <BadgeAvatarDisplay
                      collectionId={collectionId}
                      badgeIds={removeUintRangeFromUintRange([{ start: getTotalNumberOfBadges(collection) + 1n, end: GO_MAX_UINT_64 }], transfer.badgeIds)[0] || []}
                      showIds
                    />

                  </div>
                </>}
                {balanceTab === 'remaining' && <>
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
            <br />
          </td >}

      </tr >
    }
  </>
}
