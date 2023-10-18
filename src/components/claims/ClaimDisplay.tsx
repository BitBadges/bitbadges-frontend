import { ClockCircleOutlined, CloudSyncOutlined, GiftOutlined, InfoCircleOutlined, SwapOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Divider, Input, Row, Typography, notification } from "antd";
import { AmountTrackerIdDetails, deepCopy } from "bitbadgesjs-proto";
import { ApprovalCriteriaWithDetails, CollectionApprovalWithDetails, removeUintRangeFromUintRange, searchUintRangesForId, subtractBalances } from "bitbadgesjs-utils";
import { SHA256 } from "crypto-js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useAccountsContext } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { getTimeRangesElement, getTimeRangesString } from "../../utils/dates";
import { AddressDisplay } from "../address/AddressDisplay";
import { AddressDisplayList } from "../address/AddressDisplayList";
import { AddressSelect } from "../address/AddressSelect";
import { BalanceDisplay } from "../badges/balances/BalanceDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import IconButton from "../display/IconButton";
import { NumberInput } from "../inputs/NumberInput";
import { CodesDisplay } from "./CodesPasswordsDisplay";
import { TransferabilityRow } from "../collection-page/TransferabilityRow";

//TODO: Will need to change when we allow approvalCriteria len > 0
//TODO: per to/from/initiatedBy
//TODO: max num transfers
//TODO: Increment badge IDs logic
//TODO: Manual Balances
//TODO: Abstract to all approved transfers. not just "Mint" and ones with merkle challenges
//TODO: Support multiple challenges per claim
export function ClaimDisplay({
  approval,
  approvalCriteria,
  approvals,
  collectionId,
  openModal,
  isCodeDisplay,
  codes,
  claimPassword,
  code,
  setCode,
  recipient,
  setRecipient,
  noBorder
}: {
  approval: CollectionApprovalWithDetails<bigint>,
  approvalCriteria: ApprovalCriteriaWithDetails<bigint>,
  approvals: CollectionApprovalWithDetails<bigint>[],
  collectionId: bigint,
  openModal?: (code?: string, leafIndex?: number, recipient?: string) => void,
  isCodeDisplay?: boolean
  codes?: string[]
  claimPassword?: string
  code?: string
  setCode?: (code: string) => void
  recipient?: string
  setRecipient?: (recipient: string) => void
  noBorder?: boolean
}) {
  const chain = useChainContext();
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]
  const accounts = useAccountsContext();

  const claim = approval.approvalCriteria && approvalCriteria.merkleChallenge?.root ?
    approvalCriteria.merkleChallenge : undefined;
  const claimId = approval.challengeTrackerId;

  const query = router.query;
  const codeQuery = query.code as string;
  const passwordQuery = query.password as string;

  const [showClaimDisplay, setShowClaimDisplay] = useState(!isCodeDisplay);
  const [showAllUnclaimed, setShowAllUnclaimed] = useState<boolean>(false);
  const [browseIdx, setBrowseIdx] = useState(1);
  const [giftClaim, setGiftClaim] = useState(false);
  const [whitelistIsVisible, setWhitelistIsVisible] = useState(false);

  useEffect(() => {
    const approvalTracker = collection?.approvalsTrackers.find(x => x.amountTrackerId === approval.amountTrackerId && x.approvedAddress === '');
    const calculationMethod = approvalCriteria.predeterminedBalances?.orderCalculationMethod;
    let leafIndex: number = (calculationMethod?.useMerkleChallengeLeafIndex ?
      claim?.useCreatorAddressAsLeaf ?
        approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
        : approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
      : -1) ?? -1;

    const numIncrements = calculationMethod?.useMerkleChallengeLeafIndex ?
      leafIndex >= 0 ? leafIndex : 0 : approvalTracker?.numTransfers ?? 0n;

    setBrowseIdx(Number(numIncrements));
  }, [code])


  //auto populate if URL query
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display query');
    if (codeQuery) {
      if (setCode) setCode(codeQuery as string);
    } else if (passwordQuery) {
      if (setCode) setCode(passwordQuery as string);
    }
  }, [codeQuery, passwordQuery, setCode]);

  useEffect(() => {
    //fetch accounts as needed if we iterate through whitelist
    if (claim?.useCreatorAddressAsLeaf && approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[browseIdx]) {
      accounts.fetchAccounts([approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[browseIdx] ?? '']);
    }
  }, [browseIdx, claim]);

  async function refreshTrackers() {
    const approvalsIdsToFetch: AmountTrackerIdDetails<bigint>[] = [{
      collectionId,
      amountTrackerId: approval.amountTrackerId,
      approvalLevel: "collection",
      approvedAddress: "",
      approverAddress: "",
      trackerType: "overall",
    }];
    if (approvalCriteria.maxNumTransfers?.perInitiatedByAddressMaxNumTransfers ?? 0n > 0n) {
      approvalsIdsToFetch.push({
        collectionId,
        amountTrackerId: approval.amountTrackerId,
        approvalLevel: "collection",
        approvedAddress: chain.cosmosAddress,
        approverAddress: "",
        trackerType: "initiatedBy",
      });
    }

    await collections.fetchCollectionsWithOptions([{
      collectionId,
      viewsToFetch: [],
      merkleChallengeIdsToFetch: [{
        collectionId,
        challengeId: claimId ?? '',
        challengeLevel: "collection",
        approverAddress: "",
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
    if (collectionId > 0) {
      async function fetchTrackers() {
        const approvalsIdsToFetch: AmountTrackerIdDetails<bigint>[] = [{
          collectionId,
          amountTrackerId: approval.amountTrackerId,
          approvalLevel: "collection",
          approvedAddress: "",
          approverAddress: "",
          trackerType: "overall",
        }];
        if (approvalCriteria.maxNumTransfers?.perInitiatedByAddressMaxNumTransfers ?? 0n > 0n) {
          approvalsIdsToFetch.push({
            collectionId,
            amountTrackerId: approval.amountTrackerId,
            approvalLevel: "collection",
            approvedAddress: chain.cosmosAddress,
            approverAddress: "",
            trackerType: "initiatedBy",
          });
        }

        collections.fetchCollectionsWithOptions([{
          collectionId,
          viewsToFetch: [],
          merkleChallengeIdsToFetch: [{
            collectionId,
            challengeId: claimId ?? '',
            challengeLevel: "collection",
            approverAddress: "",
          }],
          approvalsTrackerIdsToFetch: approvalsIdsToFetch,
          handleAllAndAppendDefaults: true,
        }]);
      }

      fetchTrackers();
    }
  }, [collectionId, approval, claimId, chain]);

  //TODO: Will need to change with more supported features
  const approvalTracker = collection?.approvalsTrackers.find(x => x.amountTrackerId === approval.amountTrackerId && x.approvedAddress === '');
  const initiatedByTracker = collection?.approvalsTrackers.find(x => x.amountTrackerId === approval.amountTrackerId && x.approvedAddress === chain.cosmosAddress);

  const calculationMethod = approvalCriteria.predeterminedBalances?.orderCalculationMethod;
  let leafIndex: number = (calculationMethod?.useMerkleChallengeLeafIndex ? claim?.useCreatorAddressAsLeaf ?
    approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
    : approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
    : -1) ?? -1;

  const numIncrements = calculationMethod?.useMerkleChallengeLeafIndex ? leafIndex ?? 0 : approvalTracker?.numTransfers ?? 0n;

  let [, isActive] = searchUintRangesForId(BigInt(Date.now()), approval.transferTimes);


  let timeStr = '';
  if (!isActive) {
    timeStr = 'This claim is not currently active. ';
  }
  timeStr += getTimeRangesString(approval.transferTimes, '', true);

  //Filter out all balances not in the approval details
  let unmintedBalances = collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances ?? [];
  unmintedBalances = unmintedBalances.map(x => {
    const [_, removedBadges] = removeUintRangeFromUintRange(approval.badgeIds, x.badgeIds);
    const [__, removedOwnershipTimes] = removeUintRangeFromUintRange(approval.ownershipTimes, x.ownershipTimes);

    return {
      ...x,
      badgeIds: removedBadges,
      ownershipTimes: removedOwnershipTimes
    }
  }).filter(x => x.badgeIds.length > 0 && x.ownershipTimes.length > 0);
  const undistributedBalances = subtractBalances(approvalTracker?.amounts ?? [], unmintedBalances);

  const numClaimsPerAddress = approvalCriteria.maxNumTransfers?.perInitiatedByAddressMaxNumTransfers ?? 0n;
  const currInitiatedByCount = initiatedByTracker?.numTransfers ?? 0n;



  if (approval.fromMappingId !== "Mint") return <></>;


  //There are many different cases that can happen here as to why a user can not claim
  //1. Not connected to wallet
  //2. Not logged in to wallet and password claim (requires login)
  //3. Only one claim per address and user has already claimed
  //4. Only one claim per code and code has been used
  //5. Could not fetch claim data when it was created (most likely due to not being created through BitBadges website and being incompatible)
  const [, validTime] = searchUintRangesForId(BigInt(Date.now()), approval.transferTimes);

  let errorMessage = '';
  let cantClaim = false;
  let notConnected = false;

  //Cases 1-5
  if (!chain.connected) {
    cantClaim = true;
    notConnected = true;
    errorMessage = 'Please connect your wallet to claim!';
  } else if (claim && claim.details?.hasPassword && !chain.loggedIn) {
    cantClaim = true;
    notConnected = true;
    errorMessage = 'Please sign in with your wallet!';
  } else if (numClaimsPerAddress > 0n && currInitiatedByCount >= numClaimsPerAddress) {
    cantClaim = true;
    errorMessage = 'You have exceeded the maximum number of times you can claim!';
  }  // else if (claim.usedLeaves && claim.usedLeaves[0]?.find(x => x === SHA256(code).toString())) {
  //   cantClaim = true;
  //   errorMessage = 'This code has already been used!';
  // } 
  else if (claim && !claim.details && approvalCriteria.merkleChallenge?.root) {
    cantClaim = true;
    errorMessage = 'The details for this claim were not found. This is usually the case when a badge collection is not created through the BitBadges website and incompatible.';
  } else if (!approvalCriteria.predeterminedBalances ||
    approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.length == 0 ||
    (!approvalCriteria.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers &&
      !approvalCriteria.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex)) {
    cantClaim = true;
    errorMessage = 'This claim was custom created by the creator with a custom order calculation method. This is incompatible with the BitBadges website.';
  } else if (!validTime) {
    cantClaim = true;
    errorMessage = 'This claim is not currently active!';
  } else if (claim && claim.root && claim.useCreatorAddressAsLeaf && !claim.details?.challengeDetails.leavesDetails.leaves.find(y => y.includes(chain.cosmosAddress))) {
    cantClaim = true;
    errorMessage = 'You are not on the whitelist for this claim!';
  }


  const currentClaimAmounts = deepCopy(approvalCriteria.predeterminedBalances?.incrementedBalances.startBalances ?? []);
  const incrementIdsBy = approvalCriteria.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy ?? 0n;
  const incrementOwnershipTimesBy = approvalCriteria.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy ?? 0n;

  for (let i = 0; i < numIncrements; i++) {
    for (const balance of currentClaimAmounts) {
      for (const badgeIdRange of balance.badgeIds) {
        badgeIdRange.start += incrementIdsBy;
        badgeIdRange.end += incrementIdsBy;
      }

      for (const ownershipTimeRange of balance.ownershipTimes) {
        ownershipTimeRange.start += incrementOwnershipTimesBy;
        ownershipTimeRange.end += incrementOwnershipTimesBy;
      }
    }
  }

  const browseClaimAmounts = deepCopy(approvalCriteria.predeterminedBalances?.incrementedBalances.startBalances ?? []);
  for (let i = 0; i < browseIdx; i++) {
    for (const balance of browseClaimAmounts) {
      for (const badgeIdRange of balance.badgeIds) {
        badgeIdRange.start += incrementIdsBy;
        badgeIdRange.end += incrementIdsBy;
      }

      for (const ownershipTimeRange of balance.ownershipTimes) {
        ownershipTimeRange.start += incrementOwnershipTimesBy;
        ownershipTimeRange.end += incrementOwnershipTimesBy;
      }
    }
  }

  return <div className='flex-center flex-column'>
    {/* <Divider /> */}
    <div>
      {isCodeDisplay && <Row>
        <div className="full-width">
          <Button className='styled-button inherit-bg' onClick={() => setShowClaimDisplay(!showClaimDisplay)}>{showClaimDisplay ? 'Show Codes/Passwords' : 'Show Claim Details'}</Button>
          <br />
          <br />
        </div>
      </Row>}

    </div>
    {showClaimDisplay && <Card
      className="primary-text gradient-bg"
      style={{
        maxWidth: 500,
        minWidth: 250,
        // margin: 8,
        border: noBorder ? 'none' : undefined,
        textAlign: 'center',
        borderRadius: 8,
      }}

    >
      <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >
        <Row className='flex-center' >
          <Typography.Text strong style={{ fontSize: 30 }} className='primary-text'>{`${claim?.details?.name ? claim?.details?.name : ''}`}</Typography.Text>
        </Row>

        {<>

          <div>
            <Row className='flex-center' >
              <Typography.Text strong className='primary-text'> <ClockCircleOutlined /> {isActive ? getTimeRangesElement(approval.transferTimes, '', true)
                : timeStr}</Typography.Text>
            </Row>


            <br />
            {claim?.details?.description &&
              <Row className='flex-center' >
                <div className='primary-text'>{claim.details?.description}</div>
              </Row>}
            <br />
            <div className="flex-center flex-wrap">

              <IconButton
                src={<SwapOutlined size={40} />}
                onClick={() => setShowAllUnclaimed(!showAllUnclaimed)}
                text={'Switch View'}
                tooltipMessage={showAllUnclaimed ? 'Show Each Claim' : 'Show All Unclaimed'}
                size={40}
              />
              <IconButton
                src={<CloudSyncOutlined size={40} />}
                onClick={() => refreshTrackers()}
                text={'Refresh'}
                tooltipMessage={'Refresh'}
                size={40}
              />

            </div>
            <br />
            {(showAllUnclaimed || undistributedBalances.length == 0) && <>  <div className="flex-center flex-column" style={{ position: 'relative' }}>

              <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>Unclaimed</Typography.Text>
              <BalanceDisplay
                // messageSize={20}
                hideMessage
                message={'Unclaimed Badges Left'}
                collectionId={collectionId}
                balances={undistributedBalances}
              />

            </div>
            </>}
            {<>

              <div>
                {!(showAllUnclaimed || undistributedBalances.length == 0) && <>
                  {calculationMethod?.useMerkleChallengeLeafIndex && <>
                    <div className="flex-center flex-column" style={{ position: 'relative' }}>
                      <>
                        <>
                          <div className="flex-center">
                            <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                              {claim?.useCreatorAddressAsLeaf ? "Claim" : "Code"} #</Typography.Text><NumberInput
                              value={browseIdx + 1}
                              setValue={(val) => {
                                setBrowseIdx(val - 1);
                              }}
                              // onChange={(e: any) => {
                              //   setBrowseIdx(e.target.value);
                              // }}
                              min={1}
                              max={approvalCriteria.maxNumTransfers?.overallMaxNumTransfers ?? 0n > 0n ? Number(approvalCriteria.maxNumTransfers?.overallMaxNumTransfers ?? 0n) : undefined}

                            />
                          </div>
                          {claim?.useCreatorAddressAsLeaf && <>
                            <AddressDisplay
                              addressOrUsername={approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[browseIdx] ?? ''}
                            // size={20}
                            />
                            <br />
                          </>
                          }
                          <BalanceDisplay
                            message={'Current Claim'}
                            hideMessage
                            collectionId={collectionId}
                            balances={browseClaimAmounts}
                          /></>
                      </>


                      <br />
                      {claim && claim.root && claim.useCreatorAddressAsLeaf &&
                        <>
                          <Button className="styled-button" onClick={() => setWhitelistIsVisible(!whitelistIsVisible)}>{whitelistIsVisible ? 'Hide Whitelist' : 'Show Full Whitelist'}</Button>
                          <br />
                          {whitelistIsVisible && <>

                            <AddressDisplayList
                              users={approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves ?? []}
                              allExcept={false}
                            />
                            <br />
                          </>}
                        </>}
                    </div>
                  </>}
                  {calculationMethod?.useOverallNumTransfers && <>
                    <div className="flex-center flex-column" style={{ position: 'relative' }}>


                      <BalanceDisplay
                        message={<div>
                          <div className='flex-center flex-wrap'>
                            Claimable Badges - Claim #<NumberInput
                              value={browseIdx + 1}
                              setValue={(val) => {
                                setBrowseIdx(val - 1);
                              }}
                              min={1}
                              max={approvalCriteria.maxNumTransfers?.overallMaxNumTransfers ?? 0n > 0n ? Number(approvalCriteria.maxNumTransfers?.overallMaxNumTransfers ?? 0n) : undefined}

                            />
                          </div>
                          <Typography.Text className="secondary-text" style={{ fontSize: 14 }}>
                            {`Current Claim - #${BigInt(numIncrements) + 1n}`}
                          </Typography.Text>
                        </div>}
                        // hideMessage
                        collectionId={collectionId}
                        balances={browseClaimAmounts}
                      />
                    </div>

                    {(incrementIdsBy > 0 || incrementOwnershipTimesBy > 0) && !errorMessage &&
                      <div>
                        <br />
                        <Row className='flex-center' >
                          <p className='primary-text'>
                            <WarningOutlined style={{ color: 'orange' }} /> Each time a claim is processed, the claim number increments which increments the claimable badge IDs by {`${incrementIdsBy}`}.
                          </p>
                        </Row>
                        <br />
                      </div>}

                    {claim && claim.root && claim.useCreatorAddressAsLeaf &&
                      <>
                        <Button className="styled-button" onClick={() => setWhitelistIsVisible(!whitelistIsVisible)}>{whitelistIsVisible ? 'Hide Whitelist' : 'Show Full Whitelist'}</Button>
                        <br />
                        <br />
                        {whitelistIsVisible && <>

                          <AddressDisplayList
                            users={approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves ?? []}
                            allExcept={false}
                          />
                          <br />
                        </>}
                      </>}
                  </>}


                  <div style={{ alignItems: 'center', justifyContent: 'center', overflow: 'auto' }} >

                    {errorMessage && <>
                      <br />
                      <InfoCircleOutlined style={{ color: 'orange', marginRight: 4 }} />
                      {errorMessage}

                    </>}
                    {notConnected ? <>
                      <br />
                      <Divider />
                      <div>
                        <BlockinDisplay hideLogo hideLogin />
                      </div>
                    </> : <>
                      {claim && claim.root && !claim.useCreatorAddressAsLeaf && !errorMessage && setCode &&
                        <>
                          <br />
                          <br />
                          <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> Enter {claim.details?.hasPassword ? 'Password' : 'Code'} to Claim</Typography.Text>
                          <Input
                            placeholder={`Enter ${claim.details?.hasPassword ? 'Password' : 'Code'}`}
                            value={code}
                            onInput={(e: any) => {
                              if (setCode) setCode(e.target.value);
                            }}
                            className="primary-text inherit-bg"
                            style={{
                              textAlign: 'center'
                            }}
                          />
                        </>
                      }

                      {claim?.useCreatorAddressAsLeaf || !calculationMethod?.useMerkleChallengeLeafIndex || !code ? <></> : <>
                        {/* <hr /> */}
                        <br />
                        <br />
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>Claim for Entered Code</Typography.Text>
                        <BalanceDisplay
                          message={'Current Claim'}
                          hideMessage
                          collectionId={collectionId}
                          balances={leafIndex >= 0 ? currentClaimAmounts : []}
                        /></>
                      }

                      {claim && claim.root && claim.useCreatorAddressAsLeaf &&
                        <>
                          <br />
                          {!claim.details?.challengeDetails.leavesDetails.leaves.find(y => y.includes(chain.cosmosAddress))
                            ? <></> :
                            <div>
                              {chain.connected && <div>
                                <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> You have been whitelisted!</Typography.Text>
                              </div>}
                            </div>}
                        </>
                      }
                    </>}
                    {openModal && !errorMessage && <div className="full-width">
                      <br />
                      <br />

                      {!approvalCriteria.requireToEqualsInitiatedBy && giftClaim && <>
                        <Checkbox
                          checked={giftClaim}
                          onChange={(e) => {
                            setGiftClaim(e.target.checked);
                          }}
                        >
                          <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>

                            Gift Claim
                            <GiftOutlined style={{ marginLeft: 4 }} />
                          </Typography.Text>
                        </Checkbox>
                        <br />
                        <br />
                        <b>Recipient</b>

                        <AddressSelect defaultValue={chain.address} onUserSelect={(val) => {
                          if (setRecipient) setRecipient(val);
                        }} />
                        <AddressDisplay
                          addressOrUsername={recipient ?? ''}
                        />
                        {recipient != chain.cosmosAddress && recipient != chain.address && !approvalCriteria.overridesToIncomingApprovals && <>
                          <InfoCircleOutlined style={{ marginRight: 4 }} />
                          {"If selecting an address other than your own, you must obey their incoming approvals."}
                        </>}
                        <br />
                        <br />
                      </>}
                      <button disabled={cantClaim} onClick={() => { if (openModal) openModal(code, leafIndex, recipient) }} className='landing-button full-width flex-center' style={{
                        textAlign: 'center', width: '100%'
                      }}>
                        Claim
                      </button>

                      {numClaimsPerAddress > 0 && <div className='secondary-text' style={{ textAlign: 'center' }}>
                        <p>*Only {numClaimsPerAddress.toString()} claim(s) allowed per account</p>
                      </div>}
                    </div>}
                  </div>
                </>}
              </div>
            </>}
          </div>
        </>}
      </div>
    </Card>
    }

    {
      !showClaimDisplay && <CodesDisplay
        approval={approval}
        collectionId={collectionId}
        codes={codes}
        claimPassword={claimPassword}
      />
    }
  </div >
}