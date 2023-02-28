import React, { useState } from 'react';
import { MessageMsgMintBadge, createTxMsgMintBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { getClaimsValueFromClaimItems, getTransfersFromClaimItems } from '../../bitbadges-api/claims';
import { getBadgeSupplysFromMsgNewCollection } from '../../bitbadges-api/balances';
import { DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { addMerkleTreeToIpfs, addToIpfs } from '../../bitbadges-api/api';
import { SHA256 } from 'crypto-js';

export function CreateTxMsgMintBadgeModal(
    { visible, setVisible, children, txType, collectionId }
        : {
            visible: boolean,
            setVisible: (visible: boolean) => void,
            children?: React.ReactNode,
            txType: 'AddBadges' | 'DistributeBadges'
            collectionId: number,
        }
) {
    const router = useRouter();
    const collections = useCollectionsContext();
    const accounts = useAccountsContext();


    const [txState, setTxState] = useState<TxTimelineProps>();

    const newMintMsg: MessageMsgMintBadge = {
        creator: txState ? txState?.newCollectionMsg.creator : '',
        collectionId: collectionId,
        claims: txState ? txState?.newCollectionMsg.claims : [],
        transfers: txState ? txState?.newCollectionMsg.transfers : [],
        badgeSupplys: txState ? txState?.newCollectionMsg.badgeSupplys : [],
        collectionUri: txState && txType === 'AddBadges' ? txState?.newCollectionMsg.collectionUri : "",
        badgeUri: txState && txType === 'AddBadges' ? txState?.newCollectionMsg.badgeUri : ""
    }

    const unregisteredUsers = txState?.manualSend && txState?.newCollectionMsg.transfers.length > 0
        ? txState.claimItems.filter((x) => x.userInfo.accountNumber === -1).map((x) => x.userInfo.cosmosAddress) : [];

    async function updateIPFSUris() {
        if (!txState) return;

        let collectionUri = txState.newCollectionMsg.collectionUri;
        let badgeUri = txState.newCollectionMsg.badgeUri;
        let claims = txState.newCollectionMsg.claims;

        //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
        if (txState?.addMethod == MetadataAddMethod.Manual && txType === 'AddBadges') {
            let res = await addToIpfs(txState?.collectionMetadata, txState?.individualBadgeMetadata);

            collectionUri = 'ipfs://' + res.cid + '/collection';
            badgeUri = 'ipfs://' + res.cid + '/{id}';
        }

        //If distribution method is codes or a whitelist, add the merkle tree to IPFS and update the claim URI
        if (txState?.distributionMethod == DistributionMethod.Codes || txState?.distributionMethod == DistributionMethod.Whitelist) {
            if (claims?.length > 0) {
                //For the codes, we store the hashed codes as leaves on IPFS because we don't want to store the codes themselves
                //For the whitelist, we store the full plaintext codes as leaves on IPFS
                if (txState?.distributionMethod == DistributionMethod.Codes) {
                    let merkleTreeRes = await addMerkleTreeToIpfs(txState?.claimItems.map((x) => SHA256(x.fullCode).toString()));
                    claims[0].uri = 'ipfs://' + merkleTreeRes.cid + '';
                } else {
                    let merkleTreeRes = await addMerkleTreeToIpfs(txState?.claimItems.map((x) => x.fullCode));
                    claims[0].uri = 'ipfs://' + merkleTreeRes.cid + '';
                }
            }
        }

        setTxState({
            ...txState,
            newCollectionMsg: {
                ...txState.newCollectionMsg,
                collectionUri,
                badgeUri,
                claims
            }
        });

        return {
            creator: txState ? txState?.newCollectionMsg.creator : '',
            collectionId: collectionId,
            claims,
            transfers: txState ? txState?.newCollectionMsg.transfers : [],
            badgeSupplys: txState ? txState?.newCollectionMsg.badgeSupplys : [],
            collectionUri,
            badgeUri
        }
    }

    const onRegister = async () => {
        if (!txState) return;
        let newUsersToRegister = txState.claimItems.filter((x) => x.userInfo.accountNumber === -1);

        const newAccounts = await accounts.fetchAccounts(newUsersToRegister.map((x) => x.userInfo.cosmosAddress));
        const newClaimItems = [];
        for (const claimItem of txState.claimItems) {
            if (claimItem.userInfo.accountNumber === -1) {
                const newAccount = newAccounts.find((x) => x.cosmosAddress === claimItem.userInfo.cosmosAddress);
                if (newAccount) {
                    newClaimItems.push({
                        ...claimItem,
                        userInfo: newAccount,
                        address: newAccount.cosmosAddress,
                        accountNum: newAccount.accountNumber,
                    });
                }
            } else {
                newClaimItems.push(claimItem);
            }
        }

        txState.setClaimItems([...newClaimItems]);

        if (txState.manualSend) {
            txState.setNewCollectionMsg({
                ...txState?.newCollectionMsg,
                transfers: getTransfersFromClaimItems(newClaimItems),
                claims: []
            });
        } else if (!txState.manualSend) {
            const balance = getBadgeSupplysFromMsgNewCollection(txState?.newCollectionMsg);
            const claimRes = getClaimsValueFromClaimItems(balance, newClaimItems, txState.distributionMethod);

            txState.setNewCollectionMsg({
                ...txState?.newCollectionMsg,
                transfers: [],
                claims: claimRes.claims
            })
        }

        setVisible(true);
    }

    const [disabled, setDisabled] = useState<boolean>(true);

    const msgSteps = [
        {
            title: txType === 'AddBadges' ? 'Add Badges' : 'Distribute Badges',
            description: <TxTimeline txType={txType} collectionId={collectionId} onFinish={(txState: TxTimelineProps) => {
                setDisabled(false);
                setTxState(txState);
            }} />,
            disabled: disabled,
        }
    ];

    return (
        <TxModal
            beforeTx={async () => {
                const newMsg = await updateIPFSUris();
                return newMsg
            }}
            msgSteps={msgSteps}
            visible={visible}
            setVisible={setVisible}
            txName="Mint Badges"
            txCosmosMsg={newMintMsg}
            createTxFunction={createTxMsgMintBadge}
            onSuccessfulTx={async () => {
                await collections.refreshCollection(collectionId);
                router.push(`/collections/${collectionId}`)
            }}
            onRegister={onRegister}
            unregisteredUsers={unregisteredUsers}
        >
            {children}
        </TxModal>
    );
}
