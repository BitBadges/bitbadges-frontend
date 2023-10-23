import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Divider, Input, Row, Typography } from "antd";
import { ApprovalCriteriaWithDetails, CollectionApprovalWithDetails, isInAddressMapping, searchUintRangesForId } from "bitbadgesjs-utils";
import { SHA256 } from "crypto-js";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressDisplay } from "../address/AddressDisplay";
import { AddressSelect } from "../address/AddressSelect";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { TransferabilityRow, getTableHeader } from "../collection-page/TransferabilityRow";
import { CreateTxMsgTransferBadgesModal } from "../tx-modals/CreateTxMsgTransferBadges";
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
  setRecipient
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
}) {
  const chain = useChainContext();
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId)

  const details = approval.details;
  const claim = approval.approvalCriteria && approvalCriteria.merkleChallenge?.root ?
    approvalCriteria.merkleChallenge : undefined;

  const query = router.query;
  const codeQuery = query.code as string;
  const passwordQuery = query.password as string;

  const [showClaimDisplay, setShowClaimDisplay] = useState(!isCodeDisplay);
  const [address, setAddress] = useState<string>(chain.address);
  const [transferModalVisible, setTransferModalVisible] = useState<boolean>(false);

  //auto populate if URL query
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display query');
    if (codeQuery) {
      if (setCode) setCode(codeQuery as string);
    } else if (passwordQuery) {
      if (setCode) setCode(passwordQuery as string);
    }
  }, [codeQuery, passwordQuery, setCode]);

  const calculationMethod = approvalCriteria.predeterminedBalances?.orderCalculationMethod;
  let leafIndex: number = (calculationMethod?.useMerkleChallengeLeafIndex ? claim?.useCreatorAddressAsLeaf ?
    approval.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
    : approval.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
    : -1) ?? -1;

  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === approval.challengeTrackerId);

  const hasPredetermined = approval.approvalCriteria?.predeterminedBalances && (approval.approvalCriteria?.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
    approval.approvalCriteria?.predeterminedBalances && approval.approvalCriteria?.predeterminedBalances.manualBalances.length > 0);

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
  } else if (claim && details?.hasPassword && !chain.loggedIn) {
    cantClaim = true;
    notConnected = true;
    errorMessage = 'Please sign in with your wallet!';
  } else if (!details && approvalCriteria.merkleChallenge?.root) {
    cantClaim = true;
    errorMessage = 'The details for this claim were not found. This is usually the case when a badge collection is not created through the BitBadges website and incompatible.';
  } else if ((approvalCriteria.predeterminedBalances?.manualBalances ?? []).length > 0) {
    cantClaim = true;
    errorMessage = 'This claim uses manual predetermined balances which is not currently supported.';
  } else if (!validTime) {
    cantClaim = true;
    errorMessage = 'This claim is not currently active! Invalid time.';
  } else if (claim && claim.root && claim.useCreatorAddressAsLeaf && !details?.challengeDetails.leavesDetails.leaves.find(y => y.includes(chain.cosmosAddress))) {
    cantClaim = true;
    errorMessage = 'You are not on the whitelist for this claim!';
  } else if (code && challengeTracker?.usedLeafIndices?.includes(BigInt(leafIndex))) {
    cantClaim = true;
    errorMessage = 'The entered code has already been used!';
  } else if (code && leafIndex < 0) {
    cantClaim = true;
    errorMessage = 'The entered code / password is invalid!';
  } else if (claim && claim.root && !claim.useCreatorAddressAsLeaf && !code) {
    cantClaim = true;
    errorMessage = 'No code / password has been entered.';
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


                      {notConnected ? <>
                        <br />
                        <Divider />
                        <div>
                          <BlockinDisplay hideLogo hideLogin={!(claim && claim.root && details?.hasPassword)} />
                        </div>
                      </> : <>
                        {claim && claim.root && !claim.useCreatorAddressAsLeaf && setCode &&
                          <>
                            <br />
                            <br />
                            <Typography.Text strong className='primary-text' style={{ fontSize: 18 }}> Enter {details?.hasPassword ? 'Password' : 'Code'}</Typography.Text>
                            <Input
                              placeholder={`Enter ${details?.hasPassword ? 'Password' : 'Code'}`}
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

                        {claim?.useCreatorAddressAsLeaf || !calculationMethod?.useMerkleChallengeLeafIndex || !code || !(leafIndex >= 0) ? <></> : <>
                          <br />
                          <br />
                          <Typography.Text strong className='primary-text' style={{ fontSize: 16 }}>This is code #{leafIndex + 1} which corresponds to order #{leafIndex + 1}</Typography.Text>
                        </>
                        }
                        {claim?.useCreatorAddressAsLeaf && calculationMethod?.useMerkleChallengeLeafIndex ? <>
                          Your address has been reserved order #{leafIndex + 1}.
                        </> : <></>}
                      </>}
                      {openModal && hasPredetermined && <div className="full-width">
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
                          <Divider />
                        </>}
                        <button disabled={cantClaim || !!errorMessage || (!isInAddressMapping(approval.initiatedByMapping, chain.cosmosAddress) && !isInAddressMapping(approval.initiatedByMapping, chain.address))} onClick={() => { if (openModal) openModal(code, leafIndex, recipient) }} className='landing-button full-width flex-center' style={{
                          textAlign: 'center', width: '100%'
                        }}>
                          Claim
                        </button>
                        {errorMessage && <>
                          <br />
                          <InfoCircleOutlined style={{ color: 'orange', marginRight: 4 }} />
                          {errorMessage}
                        </>}
                      </div>}

                      {!hasPredetermined && <div className="full-width">
                        <br />
                        <br />
                        <button disabled={cantClaim || !!errorMessage
                          || (!isInAddressMapping(approval.initiatedByMapping, chain.cosmosAddress) && !isInAddressMapping(approval.initiatedByMapping, chain.address))
                        } onClick={() => { setTransferModalVisible(true) }} className='landing-button full-width flex-center' style={{
                          textAlign: 'center', width: '100%'
                        }}>
                          Transfer
                        </button>
                        <CreateTxMsgTransferBadgesModal
                          collectionId={collectionId}
                          visible={transferModalVisible}
                          setVisible={setTransferModalVisible}
                          defaultAddress={'Mint'}
                        />
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