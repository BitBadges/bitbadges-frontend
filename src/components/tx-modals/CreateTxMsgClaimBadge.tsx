import { WarningOutlined } from '@ant-design/icons';
import { MsgClaimBadge, createTxMsgClaimBadge } from 'bitbadgesjs-transactions';
import { ClaimInfoWithDetails } from 'bitbadgesjs-utils';
import SHA256 from 'crypto-js/sha256';
import MerkleTree from 'merkletreejs';
import React, { useEffect, useState } from 'react';
import { getClaimCodeViaPassword } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { TxModal } from './TxModal';

//TODO: support multiple challenges per claim
export function CreateTxMsgClaimBadgeModal(
  {
    collectionId, visible, setVisible, children, claimItem, code, whitelistIndex
  }: {
    collectionId: bigint,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
    claimItem?: ClaimInfoWithDetails<bigint>,
    code: string
    whitelistIndex?: number
  }
) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.getCollection(collectionId);
  const claimId = claimItem?.claimId;
  const claimObject = claimItem;
  const leavesDetails = claimItem?.details?.challengeDetails[0]?.leavesDetails;

  const [codeToSubmit, setCodeToSubmit] = useState<string>("");
  const [tree, setTree] = useState<MerkleTree | null>(claimItem ? new MerkleTree(
    leavesDetails?.leaves.map(x => {
      return leavesDetails?.isHashed ? x : SHA256(x);
    }) ?? [],
    SHA256,
    { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' }
  ) : null);


  const isWhitelist = claimItem?.challenges[0]?.useCreatorAddressAsLeaf ?? false;
  // const isCodes = !isWhitelist;

  useEffect(() => {
    // If the claim is password-based, we need to fetch the code to submit to the blockchain from the server
    async function fetchCode() {
      if (claimItem && claimItem.details?.hasPassword) {
        const res = await getClaimCodeViaPassword(collectionId, claimId ?? '-1', code);
        setCodeToSubmit(res.code);
      } else {
        setCodeToSubmit(code);
      }
    }
    fetchCode();
  }, [claimItem, code, claimId, collectionId]);

  useEffect(() => {
    if (claimItem) {
      const tree = new MerkleTree(claimItem.details?.challengeDetails[0]?.leavesDetails?.leaves.map(x => {
        return claimItem.details?.challengeDetails[0]?.leavesDetails?.isHashed ? x : SHA256(x);
      }) ?? [], SHA256, {
        fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000'
      });
      setTree(tree);
    }
  }, [claimItem]);


  if (!claimObject || !collection || !claimItem) return <></>;

  const leaf = isWhitelist ? chain.cosmosAddress : SHA256(codeToSubmit).toString();
  const proofObj = tree?.getProof(leaf, whitelistIndex);
  const isValidProof = proofObj && tree && proofObj.length === tree.getLayerCount() - 1;

  const txCosmosMsg: MsgClaimBadge<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collection.collectionId,
    claimId: claimId ?? 0n,
    solutions: [
      {
        proof: {
          aunts: proofObj ? proofObj.map((proof) => {
            return {
              aunt: proof.data.toString('hex'),
              onRight: proof.position === 'right'
            }
          }) : [],
          leaf,
        },
      },
    ]
  };

  return (
    <TxModal
      visible={visible}
      setVisible={setVisible}
      txName="Claim Badge"
      txCosmosMsg={txCosmosMsg}
      createTxFunction={createTxMsgClaimBadge}
      disabled={!isValidProof}
      displayMsg={isValidProof ? undefined :
        <div style={{ fontSize: 20 }}>
          <div style={{ color: 'red' }}><WarningOutlined style={{ color: 'red' }} /> The provided code is invalid. This transaction will fail.</div>
        </div>
      }
      requireRegistration
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
        await collections.fetchBalanceForUser(collectionId, chain.cosmosAddress, true);
      }}
    >
      {children}
    </TxModal>
  );
}