import { notification } from 'antd';
import { MsgTransferBadges, createTxMsgTransferBadges } from 'bitbadgesjs-proto';
import { ApprovalCriteriaWithDetails, CollectionApprovalWithDetails, MerkleChallengeWithDetails, convertToCosmosAddress } from 'bitbadgesjs-utils';
import SHA256 from 'crypto-js/sha256';
import MerkleTree from 'merkletreejs';
import React, { useEffect, useState } from 'react';
import { getMerkleChallengeCodeViaPassword } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { TxModal } from './TxModal';

export function CreateTxMsgClaimBadgeModal(
  {
    collectionId, visible, approval, setVisible, children, approvalCriteria, claimItem, code, whitelistIndex, recipient, approvalId
  }: {
    collectionId: bigint,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
    approval: CollectionApprovalWithDetails<bigint>,
    approvalCriteria?: ApprovalCriteriaWithDetails<bigint>,
    claimItem?: MerkleChallengeWithDetails<bigint>,
    code: string
    whitelistIndex?: number
    recipient?: string
    approvalId: string
  }
) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);

  const precalculationId = approvalId
  const leavesDetails = approval?.details?.challengeDetails?.leavesDetails;
  const treeOptions = approval?.details?.challengeDetails?.treeOptions;

  const requiresProof = !!approvalCriteria?.merkleChallenge?.root;

  const challengeTracker = collection?.merkleChallenges.find(x => x.challengeId === approval.challengeTrackerId);


  const [passwordCodeToSubmit, setPasswordCodeToSubmit] = useState<string>(code);
  const [tree, setTree] = useState<MerkleTree | null>(claimItem ? new MerkleTree(
    leavesDetails?.leaves.map(x => {
      return leavesDetails?.isHashed ? x : SHA256(x);
    }) ?? [],
    SHA256,
    treeOptions
  ) : null);

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
        // setPasswordCodeToSubmit(code);
        console.log(code);
        const leaf = isWhitelist ? SHA256(chain.cosmosAddress).toString() : SHA256(code).toString();

        console.log(leaf);

        const proofObj = tree?.getProof(leaf, whitelistIndex !== undefined && whitelistIndex >= 0 ? whitelistIndex : undefined);
        // console.log(whitelistIndex, proofObj);
        const isValidProof = proofObj && tree && proofObj.length === tree.getLayerCount() - 1;

        console.log('isValidProof', tree, proofObj);
        const leafIndex = tree?.getLeafIndex(Buffer.from(leaf, 'hex'));
        console.log(leafIndex);

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

  useEffect(() => {

    if (INFINITE_LOOP_MODE) console.log('useEffect:  tree');
    if (claimItem) {
      const tree = new MerkleTree(approval.details?.challengeDetails?.leavesDetails?.leaves.map(x => {
        return approval.details?.challengeDetails?.leavesDetails?.isHashed ? x : SHA256(x);
      }) ?? [], SHA256, approval.details?.challengeDetails?.treeOptions);
      setTree(tree);
    }
  }, [claimItem]);


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
        approvalLevel: "collection",
        approverAddress: "",
      },
      merkleProofs: requiresProof ? [{
        aunts: proofObj ? proofObj.map((proof) => {
          return {
            aunt: proof.data.toString('hex'),
            onRight: proof.position === 'right'
          }
        }) : [],
        leaf: passwordCodeToSubmit,
      }] : [],
      memo: '',
      prioritizedApprovals: [],
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