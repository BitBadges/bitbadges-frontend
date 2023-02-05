import React from 'react';
import { MessageMsgClaimBadge, createTxMsgClaimBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { BitBadgeCollection, UserBalance } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import SHA256 from 'crypto-js/sha256';

export function CreateTxMsgClaimBadgeModal(
    {
        badge, visible, setVisible, children, balance, setBadgeCollection, claimId, code
    }: {
        badge: BitBadgeCollection | undefined,
        setBadgeCollection: (badge: BitBadgeCollection) => void,
        balance: UserBalance,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        claimId: number
        code: string
    }
) {
    const chain = useChainContext();
    const claimObject = badge?.claims[claimId];

    if (!claimObject || !badge) return <></>;

    const proofObj = claimObject.tree?.getProof(SHA256(code).toString());

    const txCosmosMsg: MessageMsgClaimBadge = {
        creator: chain.cosmosAddress,
        collectionId: badge.collectionId,
        claimId,
        proof: {
            aunts: proofObj?.map((proof) => {
                return {
                    aunt: proof.data.toString('hex'),
                    onRight: proof.position === 'right'
                }
            }),
            leaf: code,
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