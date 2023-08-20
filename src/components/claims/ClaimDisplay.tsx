import { ClockCircleOutlined, GiftOutlined, InfoCircleOutlined, SwapOutlined, WarningOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Checkbox, Divider, Empty, Input, Pagination, Row, Tooltip, Typography } from "antd";
import { ApprovalTrackerIdDetails, deepCopy } from "bitbadgesjs-proto";
import { CollectionApprovedTransferWithDetails, removeUintRangeFromUintRange, searchUintRangesForId, subtractBalances } from "bitbadgesjs-utils";
import { SHA256 } from "crypto-js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { QRCode } from 'react-qrcode-logo';
import { useAccountsContext } from "../../bitbadges-api/contexts/AccountsContext";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { INFINITE_LOOP_MODE, WEBSITE_HOSTNAME } from "../../constants";
import { getTimeRangesElement, getTimeRangesString } from "../../utils/dates";
import { downloadJson, downloadTxt } from "../../utils/downloadJson";
import { AddressDisplay } from "../address/AddressDisplay";
import { AddressDisplayList } from "../address/AddressDisplayList";
import { AddressSelect } from "../address/AddressSelect";
import { BalanceDisplay } from "../badges/balances/BalanceDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { NumberInput } from "../display/NumberInput";
import { ToolIcon, tools } from "../display/ToolIcon";


//TODO: Will need to change when we allow approvalDetails len > 0
//TODO: per to/from/initiatedBy
//TODO: max num transfers
//TODO: Increment badge IDs logic
//TODO: Manual Balances
//TODO: Abstract to all approved transfers. not just "Mint" and ones with merkle challenges
export function ClaimDisplay({
  approvedTransfer,
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

  const claim = approvedTransfer.approvalDetails.length > 0 && approvedTransfer.approvalDetails[0].merkleChallenges.length > 0 ?
    approvedTransfer.approvalDetails[0].merkleChallenges[0] : undefined; //TODO: Support multiple challenges per claim

  const claimId = claim?.challengeId;

  const query = router.query;
  const codeQuery = query.code as string;
  const passwordQuery = query.password as string;


  const [codePage, setCodePage] = useState(1);

  const [showClaimDisplay, setShowClaimDisplay] = useState(!isCodeDisplay);
  const [showAllUnclaimed, setShowAllUnclaimed] = useState<boolean>(false);
  const [browseIdx, setBrowseIdx] = useState(1);
  const [giftClaim, setGiftClaim] = useState(false);

  const [whitelistIsVisible, setWhitelistIsVisible] = useState(false);


  useEffect(() => {
    const approvalTracker = collection?.approvalsTrackers.find(x => x.approvalId === approvedTransfer.approvalDetails[0].approvalId && x.approvedAddress === '');
    const calculationMethod = approvedTransfer.approvalDetails[0].predeterminedBalances.orderCalculationMethod;
    let leafIndex: number = (calculationMethod.useMerkleChallengeLeafIndex ?
      claim?.useCreatorAddressAsLeaf ?
        approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
        : approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
      : -1) ?? -1;

    const numIncrements =
      calculationMethod.useMerkleChallengeLeafIndex ?
        leafIndex >= 0 ? leafIndex : 0 :
        approvalTracker?.numTransfers ?? 0n;

    setBrowseIdx(Number(numIncrements));
  }, [])

  useEffect(() => {
    const approvalTracker = collection?.approvalsTrackers.find(x => x.approvalId === approvedTransfer.approvalDetails[0].approvalId && x.approvedAddress === '');
    const calculationMethod = approvedTransfer.approvalDetails[0].predeterminedBalances.orderCalculationMethod;
    let leafIndex: number = (calculationMethod.useMerkleChallengeLeafIndex ?
      claim?.useCreatorAddressAsLeaf ?
        approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
        : approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
      : -1) ?? -1;

    const numIncrements =
      calculationMethod.useMerkleChallengeLeafIndex ?
        leafIndex >= 0 ? leafIndex : 0 :
        approvalTracker?.numTransfers ?? 0n;

    setBrowseIdx(Number(numIncrements));
  }, [code])


  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display query');
    if (codeQuery) {
      if (setCode) setCode(codeQuery as string);
    } else if (passwordQuery) {
      if (setCode) setCode(passwordQuery as string);
    }
  }, []);

  useEffect(() => {
    if (
      claim?.useCreatorAddressAsLeaf &&
      approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves[browseIdx]) {
      accounts.fetchAccounts([approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves[browseIdx] ?? '']);
    }
  }, [browseIdx, claim]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display query');
    if (codeQuery) {
      if (setCode) setCode(codeQuery as string);
    } else if (passwordQuery) {
      if (setCode) setCode(passwordQuery as string);
    }
  }, [codeQuery, passwordQuery]);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display');
    if (collectionId > 0) {
      async function fetchTrackers() {
        const approvalsIdsToFetch: ApprovalTrackerIdDetails<bigint>[] = [{
          collectionId,
          approvalId: approvedTransfer.approvalDetails[0].approvalId,
          approvalLevel: "collection",
          approvedAddress: "",
          approverAddress: "",
          trackerType: "overall",
        }];
        if (approvedTransfer.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers > 0n) {
          approvalsIdsToFetch.push({
            collectionId,
            approvalId: approvedTransfer.approvalDetails[0].approvalId,
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
  const approvalTracker = collection?.approvalsTrackers.find(x => x.approvalId === approvedTransfer.approvalDetails[0].approvalId && x.approvedAddress === '');
  const initiatedByTracker = collection?.approvalsTrackers.find(x => x.approvalId === approvedTransfer.approvalDetails[0].approvalId && x.approvedAddress === chain.cosmosAddress);
  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === claimId);
  const calculationMethod = approvedTransfer.approvalDetails[0].predeterminedBalances.orderCalculationMethod;
  let leafIndex: number = (calculationMethod.useMerkleChallengeLeafIndex ?
    claim?.useCreatorAddressAsLeaf ?
      approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
      : approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
    : -1) ?? -1;

  const numIncrements =
    calculationMethod.useMerkleChallengeLeafIndex ?
      leafIndex ?? 0 :
      approvalTracker?.numTransfers ?? 0n;


  let [, isActive] = searchUintRangesForId(BigInt(Date.now()), approvedTransfer.transferTimes);


  let timeStr = '';
  if (!isActive) {
    timeStr = 'This claim is not currently active. ';
  }
  timeStr += getTimeRangesString(approvedTransfer.transferTimes, '', true);

  let currentMintBalances = collection?.owners.find(x => x.cosmosAddress === 'Mint')?.balances ?? [];

  //Filter out all balances not in the approvedTransfer details
  currentMintBalances = currentMintBalances.map(x => {
    const [_, removedBadges] = removeUintRangeFromUintRange(approvedTransfer.badgeIds, x.badgeIds);
    const [__, removedOwnershipTimes] = removeUintRangeFromUintRange(approvedTransfer.ownershipTimes, x.ownershipTimes);

    return {
      ...x,
      badgeIds: removedBadges,
      ownershipTimes: removedOwnershipTimes
    }
  }).filter(x => x.badgeIds.length > 0 && x.ownershipTimes.length > 0);

  const undistributedBalances = subtractBalances(approvalTracker?.amounts ?? [], currentMintBalances);

  const numClaimsPerAddress = approvedTransfer.approvalDetails[0].maxNumTransfers.perInitiatedByAddressMaxNumTransfers ?? 0n;
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
  }
  // else if (claim.usedLeaves && claim.usedLeaves[0]?.find(x => x === SHA256(code).toString())) {
  //   cantClaim = true;
  //   errorMessage = 'This code has already been used!';
  // } 
  else if (claim && !claim.details && approvedTransfer.approvalDetails[0].merkleChallenges && approvedTransfer.approvalDetails[0].merkleChallenges.length > 0) {
    cantClaim = true;
    errorMessage = 'The details for this claim were not found. This is usually the case when a badge collection is not created through the BitBadges website and incompatible.';
  } else if (approvedTransfer.approvalDetails[0].merkleChallenges && approvedTransfer.approvalDetails[0].merkleChallenges.length > 1) {
    //TODO: Support multiple challenges
    cantClaim = true;
    errorMessage = 'This claim was custom created by the creator with multiple challenges. This is incompatible with the BitBadges website.';
  } else if (!approvedTransfer.approvalDetails[0].predeterminedBalances ||
    approvedTransfer.approvalDetails[0].predeterminedBalances.incrementedBalances.startBalances.length == 0 ||
    (!approvedTransfer.approvalDetails[0].predeterminedBalances.orderCalculationMethod.useOverallNumTransfers &&
      !approvedTransfer.approvalDetails[0].predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex)) {
    cantClaim = true;
    errorMessage = 'This claim was custom created by the creator with a custom order calculation method. This is incompatible with the BitBadges website.';
  } else if (!validTime) {
    cantClaim = true;
    errorMessage = 'This claim is not currently active!';
  } else if (claim && claim.root && claim.useCreatorAddressAsLeaf && !claim.details?.challengeDetails.leavesDetails.leaves.find(y => y.includes(chain.cosmosAddress))) {
    cantClaim = true;
    errorMessage = 'You are not on the whitelist for this claim!';
  }


  const currentClaimAmounts = deepCopy(approvedTransfer.approvalDetails[0].predeterminedBalances.incrementedBalances.startBalances);
  const incrementIdsBy = approvedTransfer.approvalDetails[0].predeterminedBalances.incrementedBalances.incrementBadgeIdsBy;
  const incrementOwnershipTimesBy = approvedTransfer.approvalDetails[0].predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy;

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

  const browseClaimAmounts = deepCopy(approvedTransfer.approvalDetails[0].predeterminedBalances.incrementedBalances.startBalances);
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



  const printStr = claim?.details?.hasPassword ? 'password' : 'code';
  const urlSuffix = claim?.details?.hasPassword ? `password=${claimPassword}` : codes ? `code=${codes[codePage - 1]}` : '';

  const switchViewIcon = <Tooltip title={showAllUnclaimed ? 'Show Current Claim' : 'Show All Unclaimed'} placement='bottom'>

    <Avatar className="screen-button"
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
          <Button className='screen-button primary-blue-bg' onClick={() => setShowClaimDisplay(!showClaimDisplay)}>{showClaimDisplay ? 'Show Codes/Passwords' : 'Show Claim Details'}</Button>
          <br />
          <br />
        </div>
      </Row>}

    </div>
    {showClaimDisplay && <Card
      className="primary-text primary-blue-bg"
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
                              Claim for {claim?.useCreatorAddressAsLeaf ? "Address" : "Code"} #</Typography.Text><NumberInput
                              value={browseIdx + 1}
                              setValue={(val) => {
                                setBrowseIdx(val - 1);
                              }}
                              // onChange={(e: any) => {
                              //   setBrowseIdx(e.target.value);
                              // }}
                              min={1}
                              max={approvedTransfer.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers > 0n ? Number(approvedTransfer.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers) : undefined}

                            />
                          </div>
                          {claim?.useCreatorAddressAsLeaf && <>
                            <AddressDisplay
                              addressOrUsername={approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves[browseIdx] ?? ''}
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
                          <Button className="screen-button" onClick={() => setWhitelistIsVisible(!whitelistIsVisible)}>{whitelistIsVisible ? 'Hide Whitelist' : 'Show Full Whitelist'}</Button>
                          <br />
                          {whitelistIsVisible && <>

                            <AddressDisplayList
                              users={approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves ?? []}
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
                          max={approvedTransfer.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers > 0n ? Number(approvedTransfer.approvalDetails[0].maxNumTransfers.overallMaxNumTransfers) : undefined}

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
                        <Button className="screen-button" onClick={() => setWhitelistIsVisible(!whitelistIsVisible)}>{whitelistIsVisible ? 'Hide Whitelist' : 'Show Full Whitelist'}</Button>
                        <br />
                        <br />
                        {whitelistIsVisible && <>

                          <AddressDisplayList
                            users={approvedTransfer.approvalDetails[0].merkleChallenges[0]?.details?.challengeDetails?.leavesDetails.leaves ?? []}
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
                            className="primary-text primary-blue-bg"
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
                              {/* <div>
                                <TransferDisplay
                                  // hideBalances

                                  collectionId={collectionId}
                                  transfers={[
                                    {
                                      from: 'Mint',
                                      toAddresses: [chain.address],
                                      balances: currentClaimAmounts,
                                      merkleProofs: [],
                                      memo: '',
                                      precalculationDetails: {
                                        approvalId: approvedTransfer.approvalDetails[0].approvalId,
                                        approvalLevel: 'collection',
                                        approverAddress: '',
                                      },
                                    }
                                  ]}
                                  setTransfers={() => { }}
                                />
                              </div> */}
                            </div>}
                        </>
                      }
                    </>}
                    {openModal && !errorMessage && <div className="full-width">
                      <br />
                      <br />

                      {!approvedTransfer.approvalDetails[0].requireToEqualsInitiatedBy && giftClaim && <>
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
                        {recipient != chain.cosmosAddress && recipient != chain.address && !approvedTransfer.approvalDetails[0].overridesToApprovedIncomingTransfers && <>
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
      !showClaimDisplay &&
      <Card
        className="primary-text primary-blue-bg"
        style={{
          // margin: 8,
          textAlign: 'center',
          border: 'none',
        }}

      >

        {/* // Show authenticated manager information (passwords, codes, distribution methods, etc...) */}
        <div>
          <Row className='flex-center flex-column' style={{ textAlign: 'center' }}>
            <div>
              <div>
                {"There are multiple ways to distribute. Select the option that best suits your needs. Keep these codes safe and secure!"}
              </div>
              <br />


              {!claim?.details?.hasPassword && codes && codes.length > 0 && <>
                <div>
                  <Typography.Text strong className='primary-text' style={{ fontSize: 22 }}>Step 1: Fetch Codes</Typography.Text>
                  <br />
                  <br />
                  <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Option 1: Copy / Download Codes</Typography.Text>
                  <br />
                  <div style={{ textAlign: 'center' }}>
                    <div>
                      Download a{' '}
                      <button
                        style={{
                          backgroundColor: 'inherit',
                        }}
                        onClick={() => {
                          alert('We will now download the codes to a file.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                          const today = new Date();

                          const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                          const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                          downloadJson({
                            prefixUrl: WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=ADD_CODE_HERE',
                            codes,
                            codeUrls: codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=' + x)
                          }, `codes-${collection?.cachedCollectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.json`);
                        }}
                        className="opacity link-button primary-text"
                      >
                        JSON file
                      </button>
                      {' '}or a text file of the{' '}
                      <button
                        style={{
                          backgroundColor: 'inherit',
                        }}
                        onClick={() => {
                          alert('We will now download the codes to a file.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                          const today = new Date();

                          const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                          const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                          downloadTxt(codes.join('\n'), `codes-${collection?.cachedCollectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.txt`);
                        }}
                        className="opacity link-button primary-text"
                      >
                        codes
                      </button>
                      {' or '}
                      <button
                        style={{
                          backgroundColor: 'inherit',
                        }}
                        onClick={() => {
                          alert('We will now download the codes to a file.\n\nWARNING: Your badges can be redeemed by anyone who has these codes. Please keep these codes in safe hands and only give them to trusted parties (including tools)!');
                          const today = new Date();

                          const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                          const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                          downloadTxt(codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=' + x).join('\n'), `code-urls-${collection?.cachedCollectionMetadata?.name}-claimId=${claimId}-${dateString}-${timeString}.txt`);
                        }}
                        className="opacity link-button primary-text"
                      >
                        URLs
                      </button>
                    </div>
                    <div>
                      <div>
                        Click here
                        <Typography.Text copyable={{ text: codes.join('\n') }} className='primary-text' style={{ fontSize: 16 }}>
                          {" "}
                        </Typography.Text>
                        {" "}
                        to copy the codes to your clipboard.
                      </div>
                      <div>
                        Click here
                        <Typography.Text copyable={{
                          text: codes.map(x => WEBSITE_HOSTNAME + '/collections/' + collectionId + '?claimId=' + claimId + '&code=' + x).join('\n')
                        }} className='primary-text' style={{ fontSize: 16 }}>
                          {" "}
                        </Typography.Text>
                        {" "}
                        to copy the URLs to your clipboard.
                      </div>

                    </div>
                    <div>
                      Use a service like <a href="https://qrexplore.com/generate/" target="_blank" rel="noopener noreferrer">this QR code generator</a> to generate QR codes in batch for each unique URL.
                    </div>
                  </div>
                  <Divider />
                </div>

                <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}>Option 2: Fetch Individual Codes</Typography.Text>

                <br />
              </>
              }
              {claimPassword && <div>
                <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> Password: {claimPassword}</Typography.Text>
              </div>}
              <br />
              <Pagination
                className='primary-text'
                current={codePage}
                total={codes?.length}
                pageSize={1}
                onChange={(page) => {
                  setCodePage(page);
                }}
                // size='small'
                showSizeChanger={false}
              />
              <br />
              {claim && !claim.details?.hasPassword && claim.maxOneUsePerLeaf && codes && <Typography.Text strong className='secondary-text'>
                <InfoCircleOutlined /> Note that this code can only be used once.
                <br />
                Current Status: {
                  challengeTracker && (challengeTracker.usedLeafIndices?.find(x => x == BigInt(codePage - 1)) ?? -1) >= 0 ? <span style={{ color: 'red' }}>USED</span> : <span style={{ color: 'green' }}>UNUSED</span>
                }
              </Typography.Text>}

              <br />
              <br />
              <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> Manual</Typography.Text>
              <br />
              <Typography.Text strong copyable className='primary-text' style={{ fontSize: 16 }}>
                {claim && claim.details?.hasPassword ? claimPassword : codes ? codes[codePage - 1] : ''}
              </Typography.Text>
              <br />
              <Typography.Text className='secondary-text'>
                Users can directly enter this {printStr} on the claim page.
              </Typography.Text>
              <br />
              <br />
              <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> URL</Typography.Text>
              <br />
              <Typography.Link strong copyable style={{ fontSize: 14 }}>
                {`${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}`}
              </Typography.Link>
              <br />

              <Typography.Text className='secondary-text'>
                When a user navigates to the above URL, the {printStr} will be automatically inputted.
              </Typography.Text>
              <br />
              <br />
              <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> QR Code</Typography.Text>
              <br />
              <QRCode value={`${WEBSITE_HOSTNAME}/collections/${collectionId}?claimId=${claimId}&${urlSuffix}`} />
              <br />

              <Typography.Text className='secondary-text'>
                When a user scans this QR code, it will take them to the claim page with the {printStr} automatically inputted.
              </Typography.Text>
            </div>
          </Row>
          <div>
            <Divider />
            <Typography.Text strong className='primary-text' style={{ fontSize: 22 }}>Step 2: Distribute</Typography.Text>
            <br />
            <br />
            <div>
              {"Once you have the codes downloaded and ready to distribute, you can distribute them according to your preferred method. You may find some of the tools below helpful."}
            </div>
            <div>
              <WarningOutlined style={{ color: 'orange', marginRight: 4 }} />
              {"Some of these are third-party tools. Use at your own risk."}
            </div>
            <br />
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {tools.map((tool, idx) => {
                if (tool.toolType !== "Distribution" || tool.native) return <></>

                return <div style={{
                  margin: 8, display: 'flex'
                }} key={idx}>
                  <ToolIcon
                    name={tool.name
                    }
                  />
                </div>
              })}
            </div>
          </div>
          {claim && !claim.details?.hasPassword && (!codes || codes.length === 0) &&
            <Empty
              description={<span className='primary-text'>There are no {printStr}s for this claim.</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className='primary-text'
            />}
        </div>
      </Card >
    }

  </div >
}