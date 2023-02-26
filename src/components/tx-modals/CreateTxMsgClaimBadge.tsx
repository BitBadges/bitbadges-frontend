import { MessageMsgClaimBadge, createTxMsgClaimBadge } from 'bitbadgesjs-transactions';
import SHA256 from 'crypto-js/sha256';
import React from 'react';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { useChainContext } from '../../contexts/ChainContext';
import { TxModal } from './TxModal';
import { useCollectionsContext } from '../../contexts/CollectionsContext';

export function CreateTxMsgClaimBadgeModal(
    {
        collection, visible, setVisible, children, claimId, code, refreshUserBalance
    }: {
        collection: BitBadgeCollection | undefined,
        refreshUserBalance: () => void
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        claimId: number
        code: string
    }
) {
    const chain = useChainContext();
    const collections = useCollectionsContext();
    const claimObject = collection?.claims[claimId];

    if (!claimObject || !collection) return <></>;

    const proofObj = claimObject.tree?.getProof(SHA256(code).toString());

    const txCosmosMsg: MessageMsgClaimBadge = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
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
            onSuccessfulTx={() => { collections.refreshCollection(collection.collectionId); refreshUserBalance(); }}
        >
            {children}
        </TxModal>
    );
}