import { CheckCircleFilled } from '@ant-design/icons';
import { Input, Typography, notification } from 'antd';
import { CollectionApprovalWithDetails, MsgTransferBadges, applyIncrementsToBalances, convertToCosmosAddress } from 'bitbadgesjs-sdk';
import SHA256 from 'crypto-js/sha256';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, fetchAccountsWithOptions, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalCriteriaUsesPredeterminedBalances } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { ClaimInputs } from '../collection-page/transferability/OffChainTransferabilityTab';
import { PredeterminedCard } from '../collection-page/transferability/PredeterminedCard';
import { ErrDisplay } from '../common/ErrDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { getTreeForApproval } from './CreateTxMsgTransferBadges';
import { TxModal } from './TxModal';
import { checkAndCompleteClaim } from '../../bitbadges-api/api';

//Claim badge is exclusively used for predetermined balances
//For other standard tramsfers, use CreateTxMsgTransferBadgesModal
export function CreateTxMsgClaimBadgeModal({
  collectionId,
  visible,
  approval,
  setVisible,
  children
}: {
  collectionId: bigint;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  children?: React.ReactNode;
  approval: CollectionApprovalWithDetails<bigint>;
}) {
  const chain = useChainContext();
  const router = useRouter();
  const collection = useCollection(collectionId);

  const approvalId = approval.approvalId;
  const approvalCriteria = approval?.approvalCriteria;
  const hasPredetermined = approvalCriteriaUsesPredeterminedBalances(approvalCriteria);
  const precalculationId = hasPredetermined ? approvalId : '';
  const claimItem = approval.approvalCriteria?.merkleChallenge?.root ? approval.approvalCriteria?.merkleChallenge : undefined;
  const challengeTracker = collection?.merkleChallenges.find((x) => x.challengeId === approval.challengeTrackerId);
  const requiresProof = !!approvalCriteria?.merkleChallenge?.root;
  const isWhitelist = claimItem?.useCreatorAddressAsLeaf ?? false;
  const details = approval.details;
  const merkleChallenge = approval.approvalCriteria && approvalCriteria?.merkleChallenge?.root ? approvalCriteria?.merkleChallenge : undefined;
  const claim = merkleChallenge;
  const fetchedPlugins =
    approval.details?.offChainClaims && approval.details?.offChainClaims.length > 0 ? approval.details?.offChainClaims[0].plugins : [];
  const isManualDistribution = fetchedPlugins.length == 0; //Not using plugins
  const claimId = approval.details?.offChainClaims && approval.details?.offChainClaims.length > 0 ? approval.details?.offChainClaims[0].claimId : '';

  const query = router.query;
  const codeQuery = query.code as string;
  const passwordQuery = query.password as string;

  const [onChainCode, setOnChainCode] = useState<string>('');
  const [recipient, setRecipient] = useState<string>(chain.address);

  const recipientAccount = useAccount(recipient);
  const tree = useMemo(() => {
    if (INFINITE_LOOP_MODE) console.log('useMemo:  tree');
    if (!visible) return null;
    if (!approval) return null;

    return getTreeForApproval(approval);
  }, [approval, visible]);

  //auto populate if navigated to page with a URL query (e.g. QR code)
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display query');
    if (!visible) return;
    if (codeQuery) {
      if (setOnChainCode) setOnChainCode(codeQuery);
    } else if (passwordQuery) {
      if (setOnChainCode) setOnChainCode(passwordQuery);
    }
  }, [codeQuery, passwordQuery, setOnChainCode, visible]);

  const [fetchedReservedCodes, setFetchedReservedCodes] = useState<boolean>(false);
  useEffect(() => {
    async function fetchReservedCodes() {
      const docId = claimId;
      const recipientAddress = chain.cosmosAddress;
      if (!challengeTracker || !docId || !recipientAddress || !merkleChallenge || !visible || !setOnChainCode) return;
      if (challengeTracker.usedLeafIndices.length == 0) return;
      if (fetchedReservedCodes) return;

      const res = await checkAndCompleteClaim(docId, recipientAddress, { prevCodesOnly: true });
      setFetchedReservedCodes(true);

      if (res.prevCodes) {
        for (const code of res.prevCodes) {
          const leafIndex = approval.details?.challengeDetails?.leavesDetails.leaves.findIndex((x) => x === SHA256(code).toString()) ?? -1;
          const used = challengeTracker && (challengeTracker.usedLeafIndices?.find((x) => x == BigInt(leafIndex)) ?? -1) >= 0;

          if (!used) {
            setOnChainCode(code);
            notification.success({
              message: 'Success',
              description:
                'You previously proved you satisfy the criteria but did not claim. We have auto-completed the form for you using the prior criteria.'
            });
          }
        }
      }
    }

    fetchReservedCodes();
  }, [claimId, chain.cosmosAddress, merkleChallenge, visible, approval.details, challengeTracker, setOnChainCode]);

  const calculationMethod = approvalCriteria?.predeterminedBalances?.orderCalculationMethod;

  const claimCode = onChainCode;

  const leafIndex: number =
    (claim?.useCreatorAddressAsLeaf
      ? approval.details?.challengeDetails?.leavesDetails.leaves.findIndex((x) => x.includes(chain.cosmosAddress))
      : approval.details?.challengeDetails?.leavesDetails.leaves.findIndex((x) => x === SHA256(claimCode ?? '').toString())) ?? -1;

  //There are many different cases that can happen here as to why a user can not claim
  //1. Not connected to wallet
  //2. Not logged in to wallet and password claim (requires login)
  //3. Only one claim per address and user has already claimed
  //4. Only one claim per code and code has been used
  //5. Could not fetch claim data when it was created (most likely due to not being created through BitBadges website and being incompatible)
  const validTime = approval.transferTimes.searchIfExists(BigInt(Date.now()));
  let errorMessage = '';
  let cantClaim = false;
  let notConnected = false;

  //Cases 1-5
  if (!chain.connected) {
    cantClaim = true;
    notConnected = true;
    errorMessage = 'Please connect to claim!';
  } else if (claim && fetchedPlugins.length > 0 && !chain.loggedIn) {
    cantClaim = true;
    notConnected = true;
    errorMessage = 'Please sign in with your wallet!';
  } else if (!details && approvalCriteria?.merkleChallenge?.root) {
    cantClaim = true;
    errorMessage =
      'The details for this claim were not found. This is usually the case when a badge collection is not created through the BitBadges website and incompatible.';
  } else if ((approvalCriteria?.predeterminedBalances?.manualBalances ?? []).length > 0) {
    cantClaim = true;
    errorMessage = 'This claim uses manual predetermined balances which is not currently supported.';
  } else if (!validTime) {
    cantClaim = true;
    errorMessage = 'This claim is not currently active! Invalid time.';
  } else if (
    claim?.root &&
    claim.useCreatorAddressAsLeaf &&
    !details?.challengeDetails?.leavesDetails.leaves.find((y) => y.includes(chain.cosmosAddress))
  ) {
    cantClaim = true;
    errorMessage = 'You are not on the whitelist for this claim!';
  } else if (challengeTracker?.usedLeafIndices?.includes(BigInt(leafIndex))) {
    cantClaim = true;
    errorMessage = 'You are attempting to use a previously used value!';
  } else if (onChainCode && leafIndex < 0) {
    cantClaim = true;
    errorMessage = 'The entered code / password is invalid!';
  } else if (claim?.root && !claim.useCreatorAddressAsLeaf && !onChainCode && (details?.hasPassword || fetchedPlugins.length == 0)) {
    cantClaim = true;
    errorMessage = 'No code / password has been entered.';
  } else if (approval && !(approval.initiatedByList.checkAddress(chain.cosmosAddress) || approval.initiatedByList.checkAddress(chain.address))) {
    cantClaim = true;
    errorMessage = 'You are excluded from the list of approved addresses.';
  } else if (
    approval &&
    !(approval.toList.checkAddress(recipientAccount?.cosmosAddress ?? '') || approval.toList.checkAddress(recipientAccount?.cosmosAddress ?? ''))
  ) {
    cantClaim = true;
    errorMessage = 'The recipient is excluded from the list of addresses that can receive.';
  } else if ((fetchedPlugins ?? []).length > 0 && !onChainCode) {
    cantClaim = true;
    errorMessage = 'Please complete the form to claim!';
  }

  const isMint = approval.fromListId === 'Mint';

  const leaf = isWhitelist ? SHA256(chain.cosmosAddress).toString() : SHA256(onChainCode).toString();
  const proofObj = tree?.getProof(leaf, leafIndex !== undefined && leafIndex >= 0 ? leafIndex : undefined);
  const isValidProof = proofObj && tree && proofObj.length === tree.getLayerCount() - 1;
  const reservedCode = !(claim?.useCreatorAddressAsLeaf || !calculationMethod?.useMerkleChallengeLeafIndex || !onChainCode || !(leafIndex >= 0));
  const reservedAddress = claim?.useCreatorAddressAsLeaf && calculationMethod?.useMerkleChallengeLeafIndex && leafIndex >= 0;

  const reservedBalances = applyIncrementsToBalances(
    approvalCriteria?.predeterminedBalances?.incrementedBalances?.startBalances.clone() ?? [],
    approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy ?? 0n,
    approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy ?? 0n,
    BigInt(leafIndex)
  );

  const txsInfo = useMemo(() => {
    const txCosmosMsg = new MsgTransferBadges({
      creator: chain.cosmosAddress,
      collectionId: collectionId,
      transfers: [
        {
          from: 'Mint',
          toAddresses: [recipient ? convertToCosmosAddress(recipient) : chain.cosmosAddress],
          balances: [],
          precalculateBalancesFromApproval: {
            approvalId: precalculationId ?? '',
            approvalLevel: hasPredetermined ? 'collection' : '',
            approverAddress: ''
          },
          merkleProofs: requiresProof
            ? [
                {
                  aunts: proofObj
                    ? proofObj.map((proof) => {
                        return {
                          aunt: proof.data.toString('hex'),
                          onRight: proof.position === 'right'
                        };
                      })
                    : [],
                  leaf: isWhitelist ? '' : onChainCode
                }
              ]
            : [],
          memo: '',
          prioritizedApprovals: precalculationId
            ? [
                {
                  approvalId: precalculationId ?? '',
                  approvalLevel: 'collection',
                  approverAddress: ''
                }
              ]
            : [],
          onlyCheckPrioritizedApprovals: false
        }
      ]
    });

    return [
      {
        type: 'MsgTransferBadges',
        msg: txCosmosMsg,
        afterTx: async () => {
          await fetchCollections([collectionId], true);

          const addressesToFetch = [txCosmosMsg.creator, chain.cosmosAddress];
          for (const transfer of txCosmosMsg.transfers) {
            addressesToFetch.push(...transfer.from);
            addressesToFetch.push(...transfer.toAddresses);
          }

          //Anything after the first 10 addresses will not be fetched and they can just refresh the page, if necessary
          const prunedAddresses = [...new Set(addressesToFetch.map((x) => convertToCosmosAddress(x)))].slice(0, 10);
          await fetchAccounts(prunedAddresses, true);

          await fetchAccountsWithOptions([{ address: chain.cosmosAddress, fetchSequence: true }], true);
        }
      }
    ];
  }, [collectionId, chain.cosmosAddress, recipient, precalculationId, hasPredetermined, requiresProof, proofObj, isWhitelist, onChainCode]);

  if (!collection || !visible) return <></>;

  const items = [
    {
      title: 'Claim Details',
      disabled: cantClaim || !(isValidProof || !requiresProof),
      description: (
        <div>
          <div className="flex flex-wrap">
            <InformationDisplayCard md={12} xs={24} sm={24} title="Details" style={{ textAlign: 'center' }} subtitle={''}>
              {errorMessage ? (
                <>
                  <ErrDisplay err={errorMessage} />
                </>
              ) : (
                <></>
              )}
              <div className="flex-center full-width">
                <div
                  style={{
                    padding: '0',
                    textAlign: 'center',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                  <div style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>
                      {isMint && hasPredetermined && chain.connected && (
                        <div className="full-width" style={{ textAlign: 'center' }}>
                          <>
                            <div className="text-center mt-4">
                              <Typography.Text strong className="primary-text" style={{ marginBottom: 12 }}>
                                {' '}
                                Recipient
                              </Typography.Text>
                            </div>

                            <AddressSelect
                              switchable
                              defaultValue={chain.address}
                              onUserSelect={(val) => {
                                if (setRecipient) setRecipient(val);
                              }}
                              disabled={approvalCriteria?.requireToEqualsInitiatedBy}
                            />
                            <br />
                          </>

                          {claim?.useCreatorAddressAsLeaf && calculationMethod?.useMerkleChallengeLeafIndex && leafIndex >= 0 ? (
                            <>
                              <Typography.Text strong className="primary-text" style={{ fontSize: 16 }}>
                                This address has been reserved claim #{leafIndex + 1}.
                              </Typography.Text>
                            </>
                          ) : (
                            <></>
                          )}
                        </div>
                      )}
                      <br />
                      {notConnected ? (
                        <>
                          <div>
                            <BlockinDisplay hideLogo hideLogin={!(claim?.root && details?.hasPassword)} />
                          </div>
                        </>
                      ) : (
                        <>
                          {isMint && claim?.root && !claim.useCreatorAddressAsLeaf && setOnChainCode ? (
                            <div className="full-width" style={{ textAlign: 'center' }}>
                              {/* If the claim is self-created (not via our claim builder) in a compatible format */}
                              {!details?.hasPassword && isManualDistribution && details?.challengeDetails?.leavesDetails.leaves.length ? (
                                <>
                                  <div className="text-center mt-4">
                                    <Typography.Text strong className="primary-text" style={{ marginBottom: 12 }}>
                                      {' '}
                                      Code
                                    </Typography.Text>
                                  </div>

                                  <Input
                                    placeholder={`Enter Code`}
                                    value={onChainCode}
                                    onInput={(e: any) => {
                                      if (setOnChainCode) {
                                        setOnChainCode(e.target.value);
                                      }
                                    }}
                                    className="primary-text inherit-bg full-width"
                                    style={{
                                      textAlign: 'center',
                                      width: '100%',
                                      marginTop: 10
                                    }}
                                  />
                                  <br />
                                </>
                              ) : (
                                <></>
                              )}

                              {!isManualDistribution && !onChainCode && (
                                <>
                                  <div className="text-center mt-4">
                                    <Typography.Text strong className="primary-text" style={{ marginBottom: 12 }}>
                                      {' '}
                                      Criteria
                                    </Typography.Text>
                                  </div>

                                  <ClaimInputs claimId={claimId} plugins={fetchedPlugins} docId={claimId} setOnChainCode={setOnChainCode} />
                                </>
                              )}

                              {claim?.useCreatorAddressAsLeaf ||
                              !calculationMethod?.useMerkleChallengeLeafIndex ||
                              !onChainCode ||
                              !(leafIndex >= 0) ? (
                                <></>
                              ) : (
                                <>
                                  <br />
                                  <br />
                                  <Typography.Text strong className="primary-text" style={{ fontSize: 16 }}>
                                    This is code #{leafIndex + 1} which is reserved claim #{leafIndex + 1}
                                  </Typography.Text>
                                </>
                              )}

                              {!!onChainCode && !isManualDistribution && (
                                <>
                                  <Typography.Text strong className="secondary-text" style={{ fontSize: 16 }}>
                                    {`All criteria is satisfied!`} <CheckCircleFilled style={{ color: '#00FF00' }} />
                                  </Typography.Text>
                                </>
                              )}

                              {onChainCode && leafIndex >= 0 && !errorMessage && !details?.hasPassword && isManualDistribution && (
                                <>
                                  <Typography.Text strong className="secondary-text" style={{ fontSize: 16 }}>
                                    {`The code is valid`} <CheckCircleFilled style={{ color: '#00FF00' }} />
                                  </Typography.Text>
                                </>
                              )}
                            </div>
                          ) : (
                            <></>
                          )}
                        </>
                      )}
                      <br />
                    </div>
                  </div>
                </div>
              </div>
            </InformationDisplayCard>
            <InformationDisplayCard md={12} xs={24} sm={24} title="Badges to Receive" style={{ textAlign: 'center' }} subtitle={''}>
              {reservedCode || reservedAddress ? (
                <>
                  <br />
                  <BalanceDisplay message={`Claim #${leafIndex + 1}`} collectionId={collectionId} balances={reservedBalances} />
                </>
              ) : (
                <PredeterminedCard collectionId={collectionId} transfer={approval} />
              )}
            </InformationDisplayCard>
          </div>
          <br />
        </div>
      )
    }
  ];

  console.log(txsInfo);
  return (
    <TxModal
      width={'90%'}
      visible={visible}
      setVisible={setVisible}
      txsInfo={txsInfo}
      txName="Claim Badge"
      requireLogin={fetchedPlugins.length > 0}
      disabled={requiresProof && !isValidProof}
      msgSteps={items}>
      {children}
    </TxModal>
  );
}
