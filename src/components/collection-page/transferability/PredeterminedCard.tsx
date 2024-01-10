import { WarningOutlined, MinusOutlined, SwapOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { Typography, InputNumber } from "antd";
import { deepCopy } from "bitbadgesjs-proto";
import { CollectionApprovalWithDetails, filterZeroBalances, getBalancesForIds } from "bitbadgesjs-utils";
import { useState, useEffect } from "react";
import { fetchAccounts } from "../../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../../constants";
import { AddressDisplay } from "../../address/AddressDisplay";
import { AddressSelect } from "../../address/AddressSelect";
import { BalanceDisplay } from "../../balances/BalanceDisplay";
import IconButton from "../../display/IconButton";

export const PredeterminedCard = ({ transfer, collectionId, address, setAddress }: {
  address?: string,
  setAddress: (address: string) => void,
  collectionId: bigint, transfer: CollectionApprovalWithDetails<bigint>,
}) => {
  const [orderNumber, setOrderNumber] = useState(0);
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

  const approvalTracker = collection?.approvalTrackers.find(x => x.amountTrackerId === approval.amountTrackerId && x.approvedAddress === ''
    && x.trackerType === trackerType);

  useEffect(() => {
    //fetch accounts as needed if we iterate through allowlist
    if (claim?.useCreatorAddressAsLeaf && approval.details?.challengeDetails?.leavesDetails.leaves[orderNumber]) {
      fetchAccounts([approvalCriteria?.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[orderNumber] ?? '']);
    }
  }, [orderNumber, claim, approval, approvalCriteria]);


  const numIncrements = approvalTracker?.numTransfers ?? 0n;

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: set claim number');
    if (numIncrements > 0n) setOrderNumber(Number(numIncrements));
  }, [numIncrements, setOrderNumber]);

  const incrementedBalances = deepCopy(transfer.approvalCriteria?.predeterminedBalances?.incrementedBalances.startBalances ?? []).map(x => {
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
                <>{`Specific claim numbers are reserved for specific ${transfer.approvalCriteria?.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex && transfer.approvalCriteria?.merkleChallenge?.useCreatorAddressAsLeaf ? 'allowlisted addresses' : 'claim codes'}.`}</>
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
