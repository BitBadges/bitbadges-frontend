import { CheckCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import { Input, Typography } from 'antd';
import { MsgTransferBadges } from 'bitbadgesjs-proto';
import { CollectionApprovalWithDetails, convertToCosmosAddress, isInAddressList, searchUintRangesForId } from 'bitbadgesjs-utils';
import SHA256 from 'crypto-js/sha256';
import MerkleTree from 'merkletreejs';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { getCodeForPassword } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { fetchAccounts, useAccount } from '../../bitbadges-api/contexts/accounts/AccountsContext';
import { fetchCollections, useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalCriteriaUsesPredeterminedBalances } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { AddressSelect } from '../address/AddressSelect';
import { BalanceDisplay } from '../balances/BalanceDisplay';
import { BlockinDisplay } from '../blockin/BlockinDisplay';
import { ErrDisplay } from '../common/ErrDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { TxModal } from './TxModal';
import { applyIncrementsToBalances } from 'bitbadgesjs-utils';
import { PredeterminedCard } from '../collection-page/transferability/PredeterminedCard';


//Claim badge is exclusively used for predetermined balances
//For other standard tramsfers, use CreateTxMsgTransferBadgesModal
export function CreateTxMsgClaimBadgeModal(
  {
    collectionId, visible, approval, setVisible, children
  }: {
    collectionId: bigint,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
    approval: CollectionApprovalWithDetails<bigint>,
  }
) {
  const chain = useChainContext();
  const router = useRouter();
  const collection = useCollection(collectionId);


  const approvalId = approval.approvalId;
  const approvalCriteria = approval?.approvalCriteria;
  const hasPredetermined = approvalCriteriaUsesPredeterminedBalances(approvalCriteria);
  const precalculationId = hasPredetermined ? approvalId : '';
  const claimItem = approval.approvalCriteria?.merkleChallenge?.root ? approval.approvalCriteria?.merkleChallenge : undefined;
  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === approval.challengeTrackerId);
  const requiresProof = !!approvalCriteria?.merkleChallenge?.root;
  const isAllowlist = claimItem?.useCreatorAddressAsLeaf ?? false;
  const details = approval.details;
  const merkleChallenge = approval.approvalCriteria && approvalCriteria?.merkleChallenge?.root ? approvalCriteria?.merkleChallenge : undefined;
  const claim = merkleChallenge
  const leavesDetails = approval?.details?.challengeDetails?.leavesDetails;
  const treeOptions = approval?.details?.challengeDetails?.treeOptions;
  const hasPassword = approval.details?.hasPassword;


  const query = router.query;
  const codeQuery = query.code as string;
  const passwordQuery = query.password as string;

  const [code, setCode] = useState<string>("");
  const [passwordCodeToSubmit, setPasswordCodeToSubmit] = useState<string>("");
  const [recipient, setRecipient] = useState<string>(chain.address);
  const [address, setAddress] = useState<string>(chain.address);

  const recipientAccount = useAccount(recipient);

  const tree = useMemo(() => {
    if (INFINITE_LOOP_MODE) console.log('useMemo:  tree');
    if (!visible) return null;
    if (!merkleChallenge) return null;
    return new MerkleTree(leavesDetails?.leaves.map(x => leavesDetails?.isHashed ? x : SHA256(x)) ?? [], SHA256, treeOptions);
  }, [merkleChallenge, leavesDetails, treeOptions, visible]);


  //auto populate if navigated to page with a URL query (e.g. QR code)
  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: claim display query');
    if (!visible) return;
    if (codeQuery) {
      if (setCode) setCode(codeQuery as string);
    } else if (passwordQuery) {
      if (setCode) setCode(passwordQuery as string);
    }
  }, [codeQuery, passwordQuery, setCode, visible]);

  const calculationMethod = approvalCriteria?.predeterminedBalances?.orderCalculationMethod;

  const claimCode = details?.hasPassword ? passwordCodeToSubmit : code;

  const leafIndex: number = (claim?.useCreatorAddressAsLeaf ?
    approval.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x.includes(chain.cosmosAddress))
    : approval.details?.challengeDetails?.leavesDetails.leaves.findIndex(x => x === SHA256(claimCode ?? '').toString())) ?? -1;


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
    errorMessage = 'Please connect to claim!';
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
    errorMessage = 'You are not on the allowlist for this claim!';
  } else if (code && !hasPassword && challengeTracker?.usedLeafIndices?.includes(BigInt(leafIndex))) {
    cantClaim = true;
    errorMessage = 'The entered code has already been used!';
  } else if (code && challengeTracker?.usedLeafIndices?.includes(BigInt(leafIndex))) {
    cantClaim = true;
    errorMessage = 'The entered password has already been used!';
  } else if (code && leafIndex < 0) {
    cantClaim = true;
    errorMessage = 'The entered code / password is invalid!';
  } else if (claim && claim.root && !claim.useCreatorAddressAsLeaf && !code) {
    cantClaim = true;
    errorMessage = 'No code / password has been entered.';
  } else if (approval && !(isInAddressList(approval.initiatedByList, chain.cosmosAddress) || isInAddressList(approval.initiatedByList, chain.address))) {
    cantClaim = true;
    errorMessage = 'You are excluded from the list of approved addresses.';
  } else if (approval && !(isInAddressList(approval.toList, recipientAccount?.cosmosAddress ?? '') || isInAddressList(approval.toList, recipientAccount?.cosmosAddress ?? ''))) {
    cantClaim = true;
    errorMessage = 'The recipient is excluded from the list of addresses that can receive.';
  }

  const isMint = approval.fromListId === 'Mint'

  useEffect(() => {
    if (claimItem && approval.details?.hasPassword) {

    } else {
      setPasswordCodeToSubmit(code);
    }
  }, [code, claimItem, approval]);

  async function fetchCodeForPassword() {
    if (!visible || !code) return;

    if (approval && approval.details?.hasPassword) {
      let claimItemCid = '';
      if (approval.uri?.startsWith('ipfs://')) {
        claimItemCid = approval.uri.split('ipfs://')[1];
        claimItemCid = claimItemCid.split('/')[0];
      }
      if (code) {
        try {
          const res = await getCodeForPassword(collectionId, claimItemCid, code);
          setPasswordCodeToSubmit(res.code);
          console.log(res.code);
        } catch (e) {

        }
      }
    }
  }

  const leaf = isAllowlist ? SHA256(chain.cosmosAddress).toString() : SHA256(passwordCodeToSubmit).toString();
  const proofObj = tree?.getProof(leaf, leafIndex !== undefined && leafIndex >= 0 ? leafIndex : undefined);
  const isValidProof = proofObj && tree && proofObj.length === tree.getLayerCount() - 1;
  const reservedCode = !(claim?.useCreatorAddressAsLeaf || !calculationMethod?.useMerkleChallengeLeafIndex || !code || !(leafIndex >= 0))
  const reservedAddress = claim?.useCreatorAddressAsLeaf && calculationMethod?.useMerkleChallengeLeafIndex && (leafIndex >= 0);

  const reservedBalances = applyIncrementsToBalances(
    approvalCriteria?.predeterminedBalances?.incrementedBalances?.startBalances ?? [],
    approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementBadgeIdsBy ?? 0n,
    approvalCriteria?.predeterminedBalances?.incrementedBalances.incrementOwnershipTimesBy ?? 0n,
    BigInt(leafIndex)
  );

  const txsInfo = useMemo(() => {
    const txCosmosMsg: MsgTransferBadges<bigint> = {
      creator: chain.cosmosAddress,
      collectionId: collectionId,
      transfers: [{
        from: "Mint",
        toAddresses: [recipient ? convertToCosmosAddress(recipient) : chain.cosmosAddress],
        balances: [],
        precalculateBalancesFromApproval: {
          approvalId: precalculationId ?? '',
          approvalLevel: hasPredetermined ? "collection" : "",
          approverAddress: "",
        },
        merkleProofs: requiresProof ? [{
          aunts: proofObj ? proofObj.map((proof) => {
            return {
              aunt: proof.data.toString('hex'),
              onRight: proof.position === 'right'
            }
          }) : [],
          leaf: isAllowlist ? '' : passwordCodeToSubmit,
        }] : [],
        memo: '',
        prioritizedApprovals: hasPredetermined ? [{
          approvalId: precalculationId ?? '',
          approvalLevel: hasPredetermined ? "collection" : "",
          approverAddress: "",
        }] : [],
        onlyCheckPrioritizedApprovals: false,
      }],
    };

    return [
      {
        type: 'MsgTransferBadges',
        msg: txCosmosMsg,
        afterTx: async () => {
          await fetchCollections([collectionId], true)

          const addressesToFetch = [txCosmosMsg.creator, chain.cosmosAddress];
          for (const transfer of txCosmosMsg.transfers) {
            addressesToFetch.push(...transfer.from);
            addressesToFetch.push(...transfer.toAddresses);
          }

          //Anything after the first 10 addresses will not be fetched and they can just refresh the page, if necessary
          const prunedAddresses = [...new Set(addressesToFetch.map(x => convertToCosmosAddress(x)))].slice(0, 10);
          await fetchAccounts(prunedAddresses, true);
        }
      }
    ]
  }, [collectionId, chain.cosmosAddress, recipient, precalculationId, hasPredetermined, requiresProof, proofObj, isAllowlist, passwordCodeToSubmit]);


  if (!collection || !visible) return <></>;



  const items = [
    {
      title: 'Claim Details',
      disabled: cantClaim || !(isValidProof || !requiresProof),
      description: <div>

        <div className='flex flex-wrap'>
          <InformationDisplayCard md={12} xs={24} sm={24} title='Details' style={{ textAlign: 'center' }} subtitle={'Enter details for this claim, such as the recipient or enter claim codes, if applicable.'}>
            <br />
            <div className="flex-center full-width">
              <div style={{ padding: '0', textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ alignItems: 'center', justifyContent: 'center' }} >
                  <div className="flex-center flex-wrap full-width" style={{ alignItems: 'normal' }}>
                    {notConnected ? <>

                      <div>
                        <BlockinDisplay hideLogo hideLogin={!(claim && claim.root && details?.hasPassword)} />
                      </div>
                    </> : <>
                      {isMint && claim && claim.root && !claim.useCreatorAddressAsLeaf && setCode ?
                        <div className='full-width' style={{ alignItems: 'center' }}>
                          {
                            <>
                              <Typography.Text strong className='primary-text' style={{ fontSize: 18, marginBottom: 12 }}>
                                {details?.hasPassword ? 'Password' : 'Code'}</Typography.Text>

                              <Input
                                placeholder={`Enter ${details?.hasPassword ? 'Password' : 'Code'}`}
                                value={code}
                                onInput={(e: any) => {
                                  if (setCode) {
                                    setCode(e.target.value);
                                    setPasswordCodeToSubmit('');
                                  }
                                }
                                }
                                className="primary-text inherit-bg"
                                style={{
                                  textAlign: 'center',
                                  width: '100%',
                                  marginTop: 10,
                                }}
                              />
                              {details?.hasPassword && <>
                                <br />
                                <br />
                                {!passwordCodeToSubmit &&
                                  <div className='flex-center'>
                                    <button className='landing-button' disabled={!!passwordCodeToSubmit} onClick={fetchCodeForPassword} style={{ width: '100%' }}>Check</button>
                                  </div>}
                                {!passwordCodeToSubmit && <>
                                  <div className='secondary-text'>
                                    <InfoCircleOutlined /> {`If correct, this will count as a use of the password (1 per address, ${details?.challengeDetails?.leavesDetails?.leaves.length - (leafIndex + 1)} total).`}
                                  </div>
                                </>}

                                {!!passwordCodeToSubmit && <>

                                  <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                                    {`The password is valid`} <CheckCircleFilled style={{ color: '#00FF00' }} />
                                  </Typography.Text>
                                </>}

                              </>}
                              {code && leafIndex >= 0 && !errorMessage && !details?.hasPassword && <>

                                <Typography.Text strong className='secondary-text' style={{ fontSize: 16 }}>
                                  {`The code is valid`} <CheckCircleFilled style={{ color: '#00FF00' }} />
                                </Typography.Text>
                              </>}

                            </>
                          }
                          {claim?.useCreatorAddressAsLeaf || !calculationMethod?.useMerkleChallengeLeafIndex || !code || !(leafIndex >= 0) ? <></> : <>
                            <br />
                            <br />
                            <Typography.Text strong className='primary-text' style={{ fontSize: 16 }}>This is code #{leafIndex + 1} which is reserved claim #{leafIndex + 1}</Typography.Text>

                          </>
                          }

                        </div> : <></>}
                    </>}

                    {isMint && hasPredetermined && chain.connected && <InformationDisplayCard md={24} xs={24} sm={24} title='' noBorder inheritBg>


                      {<>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 18, marginBottom: 12 }}> Recipient</Typography.Text>

                        <AddressSelect switchable defaultValue={chain.address} onUserSelect={(val) => {
                          if (setRecipient) setRecipient(val);
                        }}
                          disabled={approvalCriteria?.requireToEqualsInitiatedBy}
                        />
                        <br />
                      </>}
                      {claim?.useCreatorAddressAsLeaf && calculationMethod?.useMerkleChallengeLeafIndex && (leafIndex >= 0) ? <>
                        <Typography.Text strong className='primary-text' style={{ fontSize: 16 }}>
                          This address has been reserved claim #{leafIndex + 1}.
                        </Typography.Text>
                      </> : <></>}
                    </InformationDisplayCard>}
                  </div>



                  {errorMessage ? <>
                    <br />
                    <ErrDisplay err={errorMessage} />
                  </> : <>
                    <br />

                  </>}
                </div>
              </div>

            </div >
          </InformationDisplayCard>
          <InformationDisplayCard md={12} xs={24} sm={24} title='Badges to Receive' style={{ textAlign: 'center' }} subtitle={'Below, you can determine which badges you will receive for this claim.'}>
            <br />
            {reservedCode || reservedAddress ? <>
              <BalanceDisplay
                message={`Claim #${leafIndex + 1}`}
                collectionId={collectionId}
                balances={reservedBalances}

              />
            </> : <>
              <PredeterminedCard
                collectionId={collectionId} transfer={approval} address={address} setAddress={setAddress}
              />
            </>}
          </InformationDisplayCard>
        </div>
        <br />
        <div className='secondary-text' style={{ textAlign: 'center' }}>
          <InfoCircleOutlined /> These are the details for this claim.
          All claims have a parent approval from which they are derived (which is the one you clicked to get here). All criteria in the parent approval must be satisfied in order to claim,
          and once the claim is processed, it will increment the counters in the parent approval.
        </div>
        <br />
      </div >
    }
  ]

  console.log(txsInfo);
  return (
    <TxModal
      width={'90%'}
      visible={visible}
      setVisible={setVisible}
      txsInfo={txsInfo}
      txName="Claim Badge"
      disabled={requiresProof && !isValidProof}
      requireRegistration
      msgSteps={items}
    >
      {children}
    </TxModal>
  );
}