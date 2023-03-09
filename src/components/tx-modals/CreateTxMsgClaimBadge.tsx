import { MessageMsgClaimBadge, createTxMsgClaimBadge } from 'bitbadgesjs-transactions';
import SHA256 from 'crypto-js/sha256';
import React from 'react';
import { BitBadgeCollection, ClaimItem } from '../../bitbadges-api/types';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxModal } from './TxModal';

export function CreateTxMsgClaimBadgeModal(
    {
        collection, visible, setVisible, children, claimId, claimItem, refreshUserBalance, code
    }: {
        collection: BitBadgeCollection | undefined,
        refreshUserBalance: () => Promise<void>,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        claimId: number
        claimItem?: ClaimItem,
        code: string
    }
) {
    const chain = useChainContext();
    const collections = useCollectionsContext();
    const claimObject = collection?.claims[claimId];

    if (!claimObject || !collection || !claimItem) return <></>;

    //TODO: duplicate addresses / codes //.includes may lead to bugs
    const addressString = claimItem.addresses.find((x) => x.includes(chain.cosmosAddress)) || "";
    console.log(addressString, "ADDRESS STRING");
    const addressProofObj = claimItem.addressesTree?.getProof(SHA256(addressString).toString());

    console.log(claimItem.addressesTree.getHexRoot(), "ADDRESS TREE ROOT");

    const codeString = claimItem.codes.find((x) => x.includes(code)) || "";
    const codeProofObj = claimItem.codeTree?.getProof(SHA256(codeString).toString());

    const txCosmosMsg: MessageMsgClaimBadge = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        claimId,
        whitelistProof: {
            aunts: addressProofObj?.map((proof) => {
                return {
                    aunt: proof.data.toString('hex'),
                    onRight: proof.position === 'right'
                }
            }),
            leaf: addressString,
        },
        codeProof: {
            aunts: codeProofObj?.map((proof) => {
                return {
                    aunt: proof.data.toString('hex'),
                    onRight: proof.position === 'right'
                }
            }),
            leaf: codeString,
        },
    };

    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Claim Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgClaimBadge}
            onSuccessfulTx={async () => { await collections.refreshCollection(collection.collectionId); await refreshUserBalance(); }}
        >
            {children}
        </TxModal>
    );
}