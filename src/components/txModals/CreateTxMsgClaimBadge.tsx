import React, { useEffect, useState } from 'react';
import { MessageMsgClaimBadge, MessageMsgTransferBadge, createTxMsgClaimBadge, createTxMsgTransferBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, IdRange, BitBadgesUserInfo, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { SampleAccountMerkleTreeLeafHashes, SampleAccountMerkleTreeObject } from '../../constants';

export function CreateTxMsgClaimBadgeModal(
    {
        badge, visible, setVisible, children, balance, setBadgeCollection
    }: {
        badge: BitBadgeCollection,
        setBadgeCollection: (badge: BitBadgeCollection) => void,
        balance: UserBalance,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
    }
) {
    const chain = useChainContext();

    const [claimId, setClaimId] = useState<number>(0);

    const proofObj = SampleAccountMerkleTreeObject.getProof(SampleAccountMerkleTreeLeafHashes[0].toString());

    console.log(SampleAccountMerkleTreeObject);
    
    const txCosmosMsg: MessageMsgClaimBadge = {
        creator: chain.cosmosAddress,
        collectionId: badge.collectionId,
        claimId,
        proof: {
            aunts: proofObj.map((proof) => {
                return {
                    aunt: proof.data.toString('hex'),
                    onRight: proof.position === 'right'
                }
            }),
            leaf: "",
            isLeafHashed: false,
        },
    };



    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Claim Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgClaimBadge}
        >
            {children}
        </TxModal>
    );
}