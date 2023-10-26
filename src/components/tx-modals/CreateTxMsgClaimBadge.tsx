import { notification } from 'antd';
import { MsgTransferBadges, createTxMsgTransferBadges } from 'bitbadgesjs-proto';
import { CollectionApprovalWithDetails, convertToCosmosAddress } from 'bitbadgesjs-utils';
import SHA256 from 'crypto-js/sha256';
import MerkleTree from 'merkletreejs';
import React, { useEffect, useState } from 'react';
import { getMerkleChallengeCodeViaPassword } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { approvalCriteriaUsesPredeterminedBalances } from '../../bitbadges-api/utils/claims';
import { INFINITE_LOOP_MODE } from '../../constants';
import { TxModal } from './TxModal';


//Claim badge is exclusively used for predetermined balances
//For other standard tramsfers, use CreateTxMsgTransferBadgesModal
export function CreateTxMsgClaimBadgeModal(
  {
    collectionId, visible, approval, setVisible, children, code, whitelistIndex, recipient, tree
  }: {
    collectionId: bigint,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
    approval: CollectionApprovalWithDetails<bigint>,
    code: string
    whitelistIndex?: number
    recipient?: string
    tree?: MerkleTree | null,
  }
) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  const approvalId = approval.approvalId;
  const approvalCriteria = approval?.approvalCriteria;
  const hasPredetermined = approvalCriteriaUsesPredeterminedBalances(approvalCriteria);
  const precalculationId = hasPredetermined ? approvalId : '';
  const claimItem = approval.approvalCriteria?.merkleChallenge?.root ? approval.approvalCriteria?.merkleChallenge : undefined;


  const requiresProof = !!approvalCriteria?.merkleChallenge?.root;
  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === approval.challengeTrackerId);


  const [passwordCodeToSubmit, setPasswordCodeToSubmit] = useState<string>(code);

  const isWhitelist = claimItem?.useCreatorAddressAsLeaf ?? false;

  useEffect(() => {
    if (claimItem && approval.details?.hasPassword) {

    }
    else {
      setPasswordCodeToSubmit(code);
    }
  }, [code, claimItem]);

  useEffect(() => {
    if (!visible) return;
    if (INFINITE_LOOP_MODE) console.log('useEffect: code to submit ');
    // If the claim is password-based, we need to fetch the code to submit to the blockchain from the server
    async function fetchCode() {
      if (claimItem && approval.details?.hasPassword) {
        let claimItemCid = '';
        if (claimItem.uri.startsWith('ipfs://')) {
          claimItemCid = claimItem.uri.split('ipfs://')[1];
          claimItemCid = claimItemCid.split('/')[0];
        }
        if (code) {
          try {
            const res = await getMerkleChallengeCodeViaPassword(collectionId, claimItemCid, code);
            setPasswordCodeToSubmit(res.code);
          } catch (e) {
            setVisible(false);
          }
        }
      } else if (claimItem) {
        const leaf = isWhitelist ? SHA256(chain.cosmosAddress).toString() : SHA256(code).toString();
        const proofObj = tree?.getProof(leaf, whitelistIndex !== undefined && whitelistIndex >= 0 ? whitelistIndex : undefined);
        const isValidProof = proofObj && tree && proofObj.length === tree.getLayerCount() - 1;
        const leafIndex = tree?.getLeafIndex(Buffer.from(leaf, 'hex'));

        if (challengeTracker?.usedLeafIndices?.includes(BigInt(leafIndex ?? -1))) {
          notification.error({
            message: 'Code already used',
            description: 'The provided code has already been used. This transaction will fail.',
          });
          setVisible(false);
        }

        if (!isValidProof) {
          notification.error({
            message: 'Invalid code',
            description: 'The provided code is invalid. This transaction will fail.',
          });
          setVisible(false);
        }
      }
    }
    fetchCode();
  }, [claimItem, code, collectionId, visible]);

  if (!collection || !visible) return <></>;

  const leaf = isWhitelist ? SHA256(chain.cosmosAddress).toString() : SHA256(passwordCodeToSubmit).toString();
  const proofObj = tree?.getProof(leaf, whitelistIndex !== undefined && whitelistIndex >= 0 ? whitelistIndex : undefined);
  const isValidProof = proofObj && tree && proofObj.length === tree.getLayerCount() - 1;

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
        leaf: isWhitelist ? '' : passwordCodeToSubmit,
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


  console.log(txCosmosMsg);

  return (
    <TxModal
      visible={visible && (isValidProof || !requiresProof)}
      setVisible={setVisible}
      txName="Claim Badge"
      txCosmosMsg={txCosmosMsg}
      createTxFunction={createTxMsgTransferBadges}
      disabled={requiresProof && !isValidProof}
      requireRegistration
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
      }}
      msgSteps={[]}
    >
      {children}
    </TxModal>
  );
}