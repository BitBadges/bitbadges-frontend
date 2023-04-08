import { MessageMsgClaimBadge, createTxMsgClaimBadge } from 'bitbadgesjs-transactions';
import SHA256 from 'crypto-js/sha256';
import React, { useEffect, useState } from 'react';
import { BitBadgeCollection, ClaimItem } from 'bitbadges-sdk';
import { useChainContext } from '../../contexts/ChainContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxModal } from './TxModal';
import { getCodeForPassword } from '../../bitbadges-api/api';
import MerkleTree from 'merkletreejs';
import { WarningOutlined } from '@ant-design/icons';

export function CreateTxMsgClaimBadgeModal(
    {
        collection, visible, setVisible, children, claimId, claimItem, refreshUserBalance, code, whitelistIndex
    }: {
        collection: BitBadgeCollection,
        refreshUserBalance: () => Promise<void>,
        visible: boolean,
        setVisible: (visible: boolean) => void,
        children?: React.ReactNode,
        claimId: number
        claimItem?: ClaimItem,
        code: string
        whitelistIndex?: number
    }
) {
    const chain = useChainContext();
    const collections = useCollectionsContext();
    const claimObject = collection?.claims[claimId - 1];

    const [codeTree, setCodeTree] = useState(claimItem ? new MerkleTree(claimItem?.hashedCodes, SHA256, { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' }) : null);
    const [addressesTree, setAddressesTree] = useState(claimItem ? new MerkleTree(claimItem?.addresses.map(x => SHA256(x)), SHA256, { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' }) : null);
    const [codeToSubmit, setCodeToSubmit] = useState<string>("");

    useEffect(() => {
        // If the claim is password-based, we need to fetch the code to submit to the blockchain from the server
        async function fetchCode() {
            if (claimItem && claimItem.hasPassword && collection) {
                const res = await getCodeForPassword(collection.collectionId, claimId, code);
                setCodeToSubmit(res.code);
            } else {
                setCodeToSubmit(code);
            }
        }
        fetchCode();
    }, [claimItem, code, collection, claimId])

    useEffect(() => {
        if (claimItem) {
            const tree = new MerkleTree(claimItem?.hashedCodes, SHA256, { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' });
            setCodeTree(tree);

            const tree2 = new MerkleTree(claimItem?.addresses.map(x => SHA256(x)), SHA256, { fillDefaultHash: '0000000000000000000000000000000000000000000000000000000000000000' });
            setAddressesTree(tree2);
        }
    }, [claimItem]);


    if (!claimObject || !collection || !claimItem) return <></>;

    const addressString = chain.cosmosAddress;
    const addressProofObj = addressesTree?.getProof(SHA256(addressString).toString(), whitelistIndex);

    const codeString = SHA256(codeToSubmit).toString();
    const codeProofObj = codeTree?.getProof(codeString);

    const isValidCodeProof = codeProofObj && codeTree && codeProofObj.length === codeTree.getLayerCount() - 1;


    const txCosmosMsg: MessageMsgClaimBadge = {
        creator: chain.cosmosAddress,
        collectionId: collection.collectionId,
        claimId,
        whitelistProof: {
            aunts: addressProofObj ? addressProofObj.map((proof) => {
                return {
                    aunt: proof.data.toString('hex'),
                    onRight: proof.position === 'right'
                }
            }) : [],
            // leaf: addressString,
            leaf: '',
        },
        codeProof: {
            aunts: isValidCodeProof ? codeProofObj?.map((proof) => {
                return {
                    aunt: proof.data.toString('hex'),
                    onRight: proof.position === 'right'
                }
            }) : [],
            leaf: isValidCodeProof ? codeToSubmit : '',
            // leaf: SHA256('6df58fb2641e20144f9a301b9cbd7a9c28ef0cc91bbf5fa0c177f2d586ab13a7').toString()
        }
    };

    return (
        <TxModal
            visible={visible}
            setVisible={setVisible}
            txName="Claim Badge"
            txCosmosMsg={txCosmosMsg}
            createTxFunction={createTxMsgClaimBadge}
            disabled={!isValidCodeProof}
            displayMsg={isValidCodeProof ? undefined :
                <div style={{ fontSize: 20 }}>
                    <div style={{ color: 'red' }}><WarningOutlined style={{ color: 'red' }} /> The provided code is invalid. This transaction will fail.</div>
                </div>
            }
            requireRegistration
            onSuccessfulTx={async () => { await collections.refreshCollection(collection.collectionId); await refreshUserBalance(); }}
        >
            {children}
        </TxModal>
    );
}