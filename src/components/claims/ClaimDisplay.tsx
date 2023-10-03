import { ClockCircleOutlined, GiftOutlined, InfoCircleOutlined, SwapOutlined, WarningOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Checkbox, Divider, Input, Row, Tooltip, Typography } from "antd";
import { ApprovalTrackerIdDetails, deepCopy } from "bitbadgesjs-proto";
import { ApprovalDetailsWithDetails, CollectionApprovedTransferWithDetails, removeUintRangeFromUintRange, searchUintRangesForId, subtractBalances } from "bitbadgesjs-utils";
import { SHA256 } from "crypto-js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { getTimeRangesElement, getTimeRangesString } from "../../utils/dates";
import { AddressDisplay } from "../address/AddressDisplay";
import { AddressDisplayList } from "../address/AddressDisplayList";
import { AddressSelect } from "../address/AddressSelect";
import { BalanceDisplay } from "../badges/balances/BalanceDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { NumberInput } from "../inputs/NumberInput";
import { CodesDisplay } from "./CodesPasswordsDisplay";

//TODO: Will need to change when we allow approvalDetails len > 0
//TODO: per to/from/initiatedBy
//TODO: max num transfers
//TODO: Increment badge IDs logic
//TODO: Manual Balances
//TODO: Abstract to all approved transfers. not just "Mint" and ones with merkle challenges
//TODO: Support multiple challenges per claim
export function ClaimDisplay({
  approvedTransfer,
  approvalDetails,
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
  approvedTransfer: CollectionApprovedTransferWithDetails<bigint>,
  approvalDetails: ApprovalDetailsWithDetails<bigint>,
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

  const claim = approvedTransfer.approvalDetails && approvalDetails.merkleChallenge.root ?
    approvalDetails.merkleChallenge : undefined;
  const claimId = approvedTransfer.challengeTrackerId;

  const query = router.query;
  const codeQuery = query.code as string;
  const passwordQuery = query.password as string;

  const [showClaimDisplay, setShowClaimDisplay] = useState(!isCodeDisplay);
  const [showAllUnclaimed, setShowAllUnclaimed] = useState<boolean>(false);
  const [browseIdx, setBrowseIdx] = useState(1);
  const [giftClaim, setGiftClaim] = useState(false);
  const [whitelistIsVisible, setWhitelistIsVisible] = useState(false);

  useEffect(() => {
    const approvalTracker = collection?.approvalsTrackers.find(x => x.approvalTrackerId === approvedTransfer.approvalTrackerId && x.approvedAddress === '');
    const calculationMethod = approvalDetails.predeterminedBalances.orderCalculationMethod;
    let leafIndex: number = (calculationMethod.useMerkleChallengeLeafIndex ?
      claim?.useCreatorAddressAsLeaf ?
        approvalDetails.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
        : approvalDetails.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
      : -1) ?? -1;

    const numIncrements = calculationMethod.useMerkleChallengeLeafIndex ?
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
    if (claim?.useCreatorAddressAsLeaf && approvalDetails.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[browseIdx]) {
      accounts.fetchAccounts([approvalDetails.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[browseIdx] ?? '']);
    }
  }, [browseIdx, claim]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display');
    if (collectionId > 0) {
      async function fetchTrackers() {
        const approvalsIdsToFetch: ApprovalTrackerIdDetails<bigint>[] = [{
          collectionId,
          approvalTrackerId: approvedTransfer.approvalTrackerId,
          approvalLevel: "collection",
          approvedAddress: "",
          approverAddress: "",
          trackerType: "overall",
        }];
        if (approvalDetails.maxNumTransfers.perInitiatedByAddressMaxNumTransfers > 0n) {
          approvalsIdsToFetch.push({
            collectionId,
            approvalTrackerId: approvedTransfer.approvalTrackerId,
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
  }, [collectionId, approvedTransfer, claimId, chain]);

  //TODO: Will need to change with more supported features
  const approvalTracker = collection?.approvalsTrackers.find(x => x.approvalTrackerId === approvedTransfer.approvalTrackerId && x.approvedAddress === '');
  const initiatedByTracker = collection?.approvalsTrackers.find(x => x.approvalTrackerId === approvedTransfer.approvalTrackerId && x.approvedAddress === chain.cosmosAddress);

  const calculationMethod = approvalDetails.predeterminedBalances.orderCalculationMethod;
  let leafIndex: number = (calculationMethod.useMerkleChallengeLeafIndex ? claim?.useCreatorAddressAsLeaf ?
    approvalDetails.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
    : approvalDetails.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
    : -1) ?? -1;

  const numIncrements = calculationMethod.useMerkleChallengeLeafIndex ? leafIndex ?? 0 : approvalTracker?.numTransfers ?? 0n;

  let [, isActive] = searchUintRangesForId(BigInt(Date.now()), approvedTransfer.transferTimes);


  let timeStr = '';
  if (!isActive) {
    timeStr = 'This claim is not currently active. ';
  }
  timeStr += getTimeRangesString(approvedTransfer.transferTimes, '', true);

  //Filter out all balances not in the approvedTransfer details
  let unmintedBalances = collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances ?? [];
  unmintedBalances = unmintedBalances.map(x => {
    const [_, removedBadges] = removeUintRangeFromUintRange(approvedTransfer.badgeIds, x.badgeIds);
    const [__, removedOwnershipTimes] = removeUintRangeFromUintRange(approvedTransfer.ownershipTimes, x.ownershipTimes);

    return {
      ...x,
      badgeIds: removedBadges,
      ownershipTimes: removedOwnershipTimes
    }
  }).filter(x => x.badgeIds.length > 0 && x.ownershipTimes.length > 0);
  const undistributedBalances = subtractBalances(approvalTracker?.amounts ?? [], unmintedBalances);

  const numClaimsPerAddress = approvalDetails.maxNumTransfers.perInitiatedByAddressMaxNumTransfers ?? 0n;
  const currInitiatedByCount = initiatedByTracker?.numTransfers ?? 0n;



  if (approvedTransfer.fromMappingId !== "Mint") return <></>;


  //There are many different cases that can happen here as to why a user can not claim
  //1. Not connected to wallet
  //2. Not logged in to wallet and password claim (requires login)
  //3. Only one claim per address and user has already claimed
  //4. Only one claim per code and code has been used
  //5. Could not fetch claim data when it was created (most likely due to not being created through BitBadges website and being incompatible)
  const [, validTime] = searchUintRangesForId(BigInt(Date.now()), approvedTransfer.transferTimes);

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
  else if (claim && !claim.details && approvalDetails.merkleChallenge.root) {
    cantClaim = true;
    errorMessage = 'The details for this claim were not found. This is usually the case when a badge collection is not created through the BitBadges website and incompatible.';
  } else if (!approvalDetails.predeterminedBalances ||
    approvalDetails.predeterminedBalances.incrementedBalances.startBalances.length == 0 ||
    (!approvalDetails.predeterminedBalances.orderCalculationMethod.useOverallNumTransfers &&
      !approvalDetails.predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex)) {
    cantClaim = true;
    errorMessage = 'This claim was custom created by the creator with a custom order calculation method. This is incompatible with the BitBadges website.';
  } else if (!validTime) {
    cantClaim = true;
    errorMessage = 'This claim is not currently active!';
  } else if (claim && claim.root && claim.useCreatorAddressAsLeaf && !claim.details?.challengeDetails.leavesDetails.leaves.find(y => y.includes(chain.cosmosAddress))) {
    cantClaim = true;
    errorMessage = 'You are not on the whitelist for this claim!';
  }


  const currentClaimAmounts = deepCopy(approvalDetails.predeterminedBalances.incrementedBalances.startBalances);
  const incrementIdsBy = approvalDetails.predeterminedBalances.incrementedBalances.incrementBadgeIdsBy;
  const incrementOwnershipTimesBy = approvalDetails.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy;

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

  const browseClaimAmounts = deepCopy(approvalDetails.predeterminedBalances.incrementedBalances.startBalances);
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

  const switchViewIcon = <Tooltip title={showAllUnclaimed ? 'Show Current Claim' : 'Show All Unclaimed'} placement='bottom'>

    <Avatar className="styled-button"
      onClick={() => setShowAllUnclaimed(!showAllUnclaimed)}
      src={<SwapOutlined />
      }
      style={{ cursor: 'pointer', marginRight: 8 }}
    />

  </Tooltip>

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
              <Typography.Text strong className='primary-text'> <ClockCircleOutlined /> {isActive ? getTimeRangesElement(approvedTransfer.transferTimes, '', true)
                : timeStr}</Typography.Text>
            </Row>


            <br />
            {claim?.details?.description &&
              <Row className='flex-center' >
                <div className='primary-text'>{claim.details?.description}</div>
              </Row>}
            <br />

            {(showAllUnclaimed || undistributedBalances.length == 0) && <>  <div className="flex-center flex-column" style={{ position: 'relative' }}>
              {undistributedBalances.length != 0 && <>
                <div style={{ position: 'absolute', top: 0, right: -20 }}>
                  {switchViewIcon}
                </div>
              </>}
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
                  {calculationMethod.useMerkleChallengeLeafIndex && <>
                    <div className="flex-center flex-column" style={{ position: 'relative' }}>
                      <>
                        <>
                          <div style={{ position: 'absolute', top: 0, right: -20 }}>
                            {switchViewIcon}
                          </div>

                          {/* <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                            Claim #{browseIdx + 1}

                          </Typography.Text> */}

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
                              max={approvalDetails.maxNumTransfers.overallMaxNumTransfers > 0n ? Number(approvalDetails.maxNumTransfers.overallMaxNumTransfers) : undefined}

                            />
                          </div>
                          {claim?.useCreatorAddressAsLeaf && <>
                            <AddressDisplay
                              addressOrUsername={approvalDetails.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves[browseIdx] ?? ''}
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
                              users={approvalDetails.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves ?? []}
                              allExcept={false}
                            />
                            <br />
                          </>}
                        </>}
                    </div>
                  </>}
                  {calculationMethod.useOverallNumTransfers && <>
                    <div className="flex-center flex-column" style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, right: -20 }}>
                        {switchViewIcon}
                      </div>
                      {/* <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>Current Claim</Typography.Text> */}
                      <div className="flex-center">
                        <Typography.Text strong className='primary-text' style={{ fontSize: 20 }}>
                          Claim #</Typography.Text><NumberInput
                          value={browseIdx + 1}
                          setValue={(val) => {
                            setBrowseIdx(val - 1);
                          }}
                          // onChange={(e: any) => {
                          //   setBrowseIdx(e.target.value);
                          // }}
                          min={1}
                          max={approvalDetails.maxNumTransfers.overallMaxNumTransfers > 0n ? Number(approvalDetails.maxNumTransfers.overallMaxNumTransfers) : undefined}

                        />
                      </div>
                      {/* <br /> */}
                      <Typography.Text strong className='primary-text' style={{ fontSize: 20, marginLeft: 8 }}>
                        {browseIdx == numIncrements && <>{"Current Claim"}<br /><br /></>}</Typography.Text>

                      <BalanceDisplay
                        message={'Current Claim'}
                        hideMessage
                        collectionId={collectionId}
                        balances={browseClaimAmounts}
                      />
                    </div>

                    {incrementIdsBy > 0 &&

                      <div>
                        <br />
                        <Row className='flex-center' >
                          <p className='primary-text'>
                            <WarningOutlined style={{ color: 'orange' }} /> Each time a user claims, the claim number increments which increments the claimable badge IDs by {`${incrementIdsBy}`}. {"So if other claims are processed before yours, you will receive different badge IDs than the ones displayed."}
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
                            users={approvalDetails.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves ?? []}
                            allExcept={false}
                          />
                          <br />
                        </>}
                      </>}
                  </>}


                  <div style={{ alignItems: 'center', justifyContent: 'center', overflow: 'auto' }} >

                    {errorMessage && <>
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

                      {claim?.useCreatorAddressAsLeaf || !calculationMethod.useMerkleChallengeLeafIndex || !code ? <></> : <>
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

                      {!approvalDetails.requireToEqualsInitiatedBy && giftClaim && <>
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
                        <b>Select Recipient</b>

                        <AddressSelect defaultValue={chain.address} onUserSelect={(val) => {
                          if (setRecipient) setRecipient(val);
                        }} />
                        <AddressDisplay
                          addressOrUsername={recipient ?? ''}
                        />
                        {recipient != chain.cosmosAddress && recipient != chain.address && !approvalDetails.overridesToApprovedIncomingTransfers && <>
                          <InfoCircleOutlined style={{ marginRight: 4 }} />
                          {"If selecting an address other than your own, you must obey their incoming approvals."}
                        </>}
                        <br />
                        <br />
                      </>}
                      <Button disabled={cantClaim} type='primary' onClick={() => { if (openModal) openModal(code, leafIndex, recipient) }} className='full-width flex-center' style={{ textAlign: 'center' }}>
                        Claim
                      </Button>

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
        approvedTransfer={approvedTransfer}
        collectionId={collectionId}
        codes={codes}
        claimPassword={claimPassword}
      />}
  </div >
}