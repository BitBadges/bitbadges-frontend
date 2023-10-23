import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Divider, Input, Row, Typography } from "antd";
import { deepCopy } from "bitbadgesjs-proto";
import { ApprovalCriteriaWithDetails, CollectionApprovalWithDetails, searchUintRangesForId } from "bitbadgesjs-utils";
import { SHA256 } from "crypto-js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useAccountsContext } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressDisplay } from "../address/AddressDisplay";
import { AddressSelect } from "../address/AddressSelect";
import { BalanceDisplay } from "../badges/balances/BalanceDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { TransferabilityRow, getTableHeader } from "../collection-page/TransferabilityRow";
import { CodesDisplay } from "./CodesPasswordsDisplay";

//TODO: Abstract to support all approved transfers criteria (incoming, outgoing, must own, everything)
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
  const collection = collections.getCollection(collectionId)
  

  const claim = approval.approvalCriteria && approvalCriteria.merkleChallenge?.root ?
    approvalCriteria.merkleChallenge : undefined;

  const query = router.query;
  const codeQuery = query.code as string;
  const passwordQuery = query.password as string;

  const [showClaimDisplay, setShowClaimDisplay] = useState(!isCodeDisplay);
  const [address, setAddress] = useState<string>(chain.address);

  //auto populate if URL query
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display query');
    if (codeQuery) {
      if (setCode) setCode(codeQuery as string);
    } else if (passwordQuery) {
      if (setCode) setCode(passwordQuery as string);
    }
  }, [codeQuery, passwordQuery, setCode]);

  //TODO: Will need to change with more supported features
  const approvalTracker = collection?.approvalsTrackers.find(x => x.amountTrackerId === approval.amountTrackerId && x.approvedAddress === '');
  const initiatedByTracker = collection?.approvalsTrackers.find(x => x.amountTrackerId === approval.amountTrackerId && x.approvedAddress === chain.cosmosAddress);

  const calculationMethod = approvalCriteria.predeterminedBalances?.orderCalculationMethod;
  let leafIndex: number = (calculationMethod?.useMerkleChallengeLeafIndex ? claim?.useCreatorAddressAsLeaf ?
    approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
    : approvalCriteria.merkleChallenge?.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
    : -1) ?? -1;

  const numIncrements = calculationMethod?.useMerkleChallengeLeafIndex ? leafIndex ?? 0 : approvalTracker?.numTransfers ?? 0n;
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
    {showClaimDisplay && <>
      <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >

        {<>

          <div>
            {<>

              <div>
                {<>
                  <div className="">
                    <table>
                      {getTableHeader()}
                      <TransferabilityRow
                        address={address}
                        setAddress={setAddress}
                        allTransfers={approvals}
                        transfer={approval}
                        collectionId={collectionId}
                        expandedSingleView
                      />
                    </table>





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

                        {!approvalCriteria.requireToEqualsInitiatedBy && <>
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
                      </div>}
                    </div>
                  </div>
                </>}
              </div>
            </>}
          </div>
        </>}
      </div>
    </>
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