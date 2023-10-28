import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Divider, Input, Row, Typography } from "antd";
import { CollectionApprovalWithDetails, isInAddressMapping, searchUintRangesForId } from "bitbadgesjs-utils";
import { SHA256 } from "crypto-js";
import MerkleTree from "merkletreejs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useChainContext } from "../../bitbadges-api/contexts/ChainContext";
import { useAccountsContext } from "../../bitbadges-api/contexts/accounts/AccountsContext";
import { useCollectionsContext } from "../../bitbadges-api/contexts/collections/CollectionsContext";
import { approvalCriteriaUsesPredeterminedBalances } from "../../bitbadges-api/utils/claims";
import { INFINITE_LOOP_MODE } from "../../constants";
import { AddressSelect } from "../address/AddressSelect";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { TransferabilityRow } from "../collection-page/TransferabilityRow";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { CreateTxMsgClaimBadgeModal } from "../tx-modals/CreateTxMsgClaimBadge";
import { CreateTxMsgTransferBadgesModal } from "../tx-modals/CreateTxMsgTransferBadges";
import { CodesDisplay } from "./CodesPasswordsDisplay";

//TODO: Abstract to support all approved transfers criteria (incoming, outgoing, must own, everything)

export function ClaimDisplay({
  approval,
  approvals,
  collectionId,
  isCodeDisplay,
  codes,
  claimPassword,
  onlyActions
}: {
  approval: CollectionApprovalWithDetails<bigint>,
  approvals: CollectionApprovalWithDetails<bigint>[],
  collectionId: bigint,
  isCodeDisplay?: boolean
  codes?: string[]
  claimPassword?: string
  onlyActions?: boolean
}) {
  const chain = useChainContext();
  const router = useRouter();
  const accounts = useAccountsContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId)

  const approvalCriteria = approval.approvalCriteria;
  const details = approval.details;
  const merkleChallenge = approval.approvalCriteria && approvalCriteria?.merkleChallenge?.root ? approvalCriteria?.merkleChallenge : undefined;
  const claim = merkleChallenge
  const leavesDetails = approval?.details?.challengeDetails?.leavesDetails;
  const treeOptions = approval?.details?.challengeDetails?.treeOptions;


  const query = router.query;
  const codeQuery = query.code as string;
  const passwordQuery = query.password as string;

  const [showClaimDisplay, setShowClaimDisplay] = useState(!isCodeDisplay);
  const [address, setAddress] = useState<string>(chain.address);
  const [transferModalVisible, setTransferModalVisible] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [whitelistIndex, setWhitelistIndex] = useState<number>();
  const [recipient, setRecipient] = useState<string>(chain.address);
  const recipientAccount = accounts.getAccount(recipient);

  const openModal = (leafIndex?: number) => {
    setWhitelistIndex(leafIndex);
    setModalVisible(true);
  }

  const [tree, setTree] = useState<MerkleTree | null>(merkleChallenge ?
    new MerkleTree(leavesDetails?.leaves.map(x => leavesDetails?.isHashed ? x : SHA256(x)) ?? [], SHA256, treeOptions) : null);

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect:  tree');
    if (merkleChallenge) {
      const tree = new MerkleTree(approval.details?.challengeDetails?.leavesDetails?.leaves.map(x => {
        return approval.details?.challengeDetails?.leavesDetails?.isHashed ? x : SHA256(x);
      }) ?? [], SHA256, approval.details?.challengeDetails?.treeOptions);
      setTree(tree);
    }
  }, [merkleChallenge]);


  //auto populate if navigated to page with a URL query (e.g. QR code)
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display query');
    if (codeQuery) {
      if (setCode) setCode(codeQuery as string);
    } else if (passwordQuery) {
      if (setCode) setCode(passwordQuery as string);
    }
  }, [codeQuery, passwordQuery, setCode]);

  const calculationMethod = approvalCriteria?.predeterminedBalances?.orderCalculationMethod;

  const leafIndex: number = (calculationMethod?.useMerkleChallengeLeafIndex ? claim?.useCreatorAddressAsLeaf ?
    approval.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
    : approval.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(code ?? '').toString())
    : -1) ?? -1;

  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === approval.challengeTrackerId);
  const hasPredetermined = approvalCriteriaUsesPredeterminedBalances(approvalCriteria);



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
  } else if (!details && approvalCriteria?.merkleChallenge?.root) {
    cantClaim = true;
    errorMessage = 'The details for this claim were not found. This is usually the case when a badge collection is not created through the BitBadges website and incompatible.';
  } else if ((approvalCriteria?.predeterminedBalances?.manualBalances ?? []).length > 0) {
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
  } else if (approval && !(isInAddressMapping(approval.initiatedByMapping, chain.cosmosAddress) || isInAddressMapping(approval.initiatedByMapping, chain.address))) {
    cantClaim = true;
    errorMessage = 'You are excluded from the list of approved addresses.';
  } else if (approval && !(isInAddressMapping(approval.toMapping, recipientAccount?.cosmosAddress ?? '') || isInAddressMapping(approval.toMapping, recipientAccount?.cosmosAddress ?? ''))) {
    cantClaim = true;
    errorMessage = 'The recipient is excluded from the list of addresses that can receive.';
  }

  const isMint = approval.fromMappingId === 'Mint'

  return <>
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
      {!onlyActions &&
        <TransferabilityRow
          address={address}
          setAddress={setAddress}
          allTransfers={approvals}
          transfer={approval}
          collectionId={collectionId}
          expandedSingleView
          noBorder
        />}

      <div className="flex-center full-width">
        <InformationDisplayCard title='Transfer' md={22} xs={24} sm={24} style={{ padding: '0', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }} subtitle='Meet the criteria? Go ahead and initiate a transfer!'>

          <div style={{ alignItems: 'center', justifyContent: 'center' }} >
            <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>
              {notConnected ? <>

                <div>
                  <BlockinDisplay hideLogo hideLogin={!(claim && claim.root && details?.hasPassword)} />
                </div>
              </> : <>
                {isMint && claim && claim.root && !claim.useCreatorAddressAsLeaf && setCode ?
                  <InformationDisplayCard md={12} xs={24} sm={24} title='' noBorder inheritBg>
                    {
                      <>
                        <Typography.Text strong className='dark:text-white' style={{ fontSize: 18 }}> Enter {details?.hasPassword ? 'Password' : 'Code'}</Typography.Text>
                        <br />< br />
                        <Input
                          placeholder={`Enter ${details?.hasPassword ? 'Password' : 'Code'}`}
                          value={code}
                          onInput={(e: any) => {
                            if (setCode) setCode(e.target.value);
                          }}
                          className="dark:text-white inherit-bg"
                          style={{
                            textAlign: 'center'
                          }}
                        />
                      </>
                    }

                    {claim?.useCreatorAddressAsLeaf || !calculationMethod?.useMerkleChallengeLeafIndex || !code || !(leafIndex >= 0) ? <></> : <>
                      <br />
                      <br />
                      <Typography.Text strong className='dark:text-white' style={{ fontSize: 16 }}>This is code #{leafIndex + 1} which corresponds to claim #{leafIndex + 1}</Typography.Text>
                    </>
                    }

                  </InformationDisplayCard> : <></>}
              </>}

              {isMint && hasPredetermined && chain.connected && <InformationDisplayCard md={12} xs={24} sm={24} title='' noBorder inheritBg>


                {<>
                  <Typography.Text strong className='dark:text-white' style={{ fontSize: 18 }}> Recipient</Typography.Text>

                  <AddressSelect switchable defaultValue={chain.address} onUserSelect={(val) => {
                    if (setRecipient) setRecipient(val);
                  }}
                    disabled={approvalCriteria?.requireToEqualsInitiatedBy}
                  />
                  <br />
                </>}
                {claim?.useCreatorAddressAsLeaf && calculationMethod?.useMerkleChallengeLeafIndex && (leafIndex >= 0) ? <>
                  <Typography.Text strong className='dark:text-white' style={{ fontSize: 16 }}>
                    This address has been reserved claim #{leafIndex + 1}.
                  </Typography.Text>

                </> : <></>}
              </InformationDisplayCard>}
            </div>

            {/* If it is predetermined balances, we use claim modal */}
            {isMint && hasPredetermined && chain.connected && <div className="full-width">
              <button disabled={cantClaim || !!errorMessage} onClick={() => { if (openModal) openModal(leafIndex) }} className='landing-button full-width flex-center' style={{
                textAlign: 'center', width: '100%'
              }}>
                Claim
              </button>
            </div>}

            {/* If it is not predetermined balances, we use transfer modal */}
            {(!hasPredetermined || !isMint) && chain.connected && <div className="full-width">
              <br />
              <br />
              <button disabled={cantClaim || !!errorMessage}
                onClick={() => { setTransferModalVisible(true) }} className='landing-button full-width flex-center' style={{
                  textAlign: 'center', width: '100%'
                }}>
                Transfer
              </button>
              <CreateTxMsgTransferBadgesModal
                collectionId={collectionId}
                visible={transferModalVisible}
                setVisible={setTransferModalVisible}
                defaultAddress={'Mint'}
                approval={approval}
                tree={tree}
                fromTransferabilityRow
              />
            </div>}

            {errorMessage && <>
              <br />
              <InfoCircleOutlined style={{ color: 'orange', marginRight: 4 }} />
              {errorMessage}
            </>}

          </div>
        </InformationDisplayCard>

      </div>  <Divider />
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

    {
      approval &&
      <CreateTxMsgClaimBadgeModal
        collectionId={collectionId}
        visible={modalVisible}
        setVisible={setModalVisible}
        code={code}
        approval={approval}
        whitelistIndex={whitelistIndex}
        recipient={recipient}
      />
    }
  </ >
}