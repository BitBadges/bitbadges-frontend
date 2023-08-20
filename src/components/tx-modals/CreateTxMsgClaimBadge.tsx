import { MsgTransferBadges, createTxMsgTransferBadges } from 'bitbadgesjs-proto';
import { CollectionApprovedTransferWithDetails, MerkleChallengeWithDetails, convertToCosmosAddress } from 'bitbadgesjs-utils';
import SHA256 from 'crypto-js/sha256';
import MerkleTree from 'merkletreejs';
import React, { useEffect, useState } from 'react';
import { getMerkleChallengeCodeViaPassword } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { useCollectionsContext } from '../../bitbadges-api/contexts/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { TxModal } from './TxModal';
import { notification } from 'antd';

//TODO: support multiple challenges per claim
//TODO: handle used claim codes
export function CreateTxMsgClaimBadgeModal(
  {
    collectionId, visible, setVisible, children, approvedTransfer, claimItem, code, whitelistIndex, recipient
  }: {
    collectionId: bigint,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    children?: React.ReactNode,
    approvedTransfer?: CollectionApprovedTransferWithDetails<bigint>,
    claimItem?: MerkleChallengeWithDetails<bigint>,
    code: string
    whitelistIndex?: number
    recipient?: string
  }
) {
  const chain = useChainContext();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()];

  const approvalId = approvedTransfer?.approvalDetails[0].approvalId;

  // const claimObject = claimItem;
  const leavesDetails = claimItem?.details?.challengeDetails?.leavesDetails;

  const requiresProof = (approvedTransfer?.approvalDetails[0].merkleChallenges ?? []).length > 0;

  const [passwordCodeToSubmit, setPasswordCodeToSubmit] = useState<string>(code);
  const [tree, setTree] = useState<MerkleTree | null>(claimItem ? new MerkleTree(
    leavesDetails?.leaves.map(x => {
      return leavesDetails?.isHashed ? x : SHA256(x);
    }) ?? [],
    SHA256,
    { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' }
  ) : null);

  // const [modalVisible, setModalVisible] = useState<boolean>(false);



  const isWhitelist = claimItem?.useCreatorAddressAsLeaf ?? false;
  // const isCodes = !isWhitelist;



  useEffect(() => {
    if (claimItem && claimItem.details?.hasPassword) {

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
      if (claimItem && claimItem.details?.hasPassword) {
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
        const leaf = isWhitelist ? SHA256(chain.cosmosAddress).toString() : SHA256(code).toString();

        const proofObj = tree?.getProof(leaf, whitelistIndex !== undefined && whitelistIndex >= 0 ? whitelistIndex : undefined);
        // console.log(whitelistIndex, proofObj);
        const isValidProof = proofObj && tree && proofObj.length === tree.getLayerCount() - 1;

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
      const tree = new MerkleTree(claimItem.details?.challengeDetails?.leavesDetails?.leaves.map(x => {
        return claimItem.details?.challengeDetails?.leavesDetails?.isHashed ? x : SHA256(x);
      }) ?? [], SHA256, {
        fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000'
      });
      setTree(tree);
    }
  }, [claimItem]);


  if (!collection || !visible) return <></>;

  const leaf = isWhitelist ? SHA256(chain.cosmosAddress).toString() : SHA256(passwordCodeToSubmit).toString();

  const proofObj = tree?.getProof(leaf, whitelistIndex !== undefined && whitelistIndex >= 0 ? whitelistIndex : undefined);
  // console.log(whitelistIndex, proofObj);
  const isValidProof = proofObj && tree && proofObj.length === tree.getLayerCount() - 1;

  const txCosmosMsg: MsgTransferBadges<bigint> = {
    creator: chain.cosmosAddress,
    collectionId: collectionId,
    transfers: [{
      from: "Mint",
      toAddresses: [recipient ? convertToCosmosAddress(recipient) : chain.cosmosAddress],
      balances: [],
      precalculationDetails: {
        approvalId: approvalId ?? '',
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
      memo: ''
    }],
  };

  console.log("MSG", JSON.stringify(txCosmosMsg, null, 2));

  return (
    <TxModal
      visible={visible && (isValidProof || !requiresProof)}
      setVisible={setVisible}
      txName="Claim Badge"
      txCosmosMsg={txCosmosMsg}
      createTxFunction={createTxMsgTransferBadges}
      disabled={requiresProof && !isValidProof}
      // displayMsg={isValidProof || !requiresProof ? undefined :
      //   // <div style={{ fontSize: 20 }}>
      //   //   <div style={{ color: 'red' }}><WarningOutlined style={{ color: 'red' }} /> The provided code is invalid. This transaction will fail.</div>
      //   // </div>
      // }
      requireRegistration
      onSuccessfulTx={async () => {
        await collections.fetchCollections([collectionId], true);
        // await collections.fetchBalanceForUser(collectionId, chain.address, true);
      }}
      msgSteps={[]}
    >
      {children}
    </TxModal>
  );
}