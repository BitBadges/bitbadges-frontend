import { MessageMsgMintBadge, createTxMsgMintBadge } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { addMerkleTreeToIpfs, addToIpfs } from '../../bitbadges-api/api';
import { DistributionMethod, MetadataAddMethod } from '../../bitbadges-api/types';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';

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
    // const accounts = useAccountsContext();


    const [txState, setTxState] = useState<TxTimelineProps>();

    const newMintMsg: MessageMsgMintBadge = {
        creator: txState ? txState?.newCollectionMsg.creator : '',
        collectionId: collectionId,
        claims: txState ? txState?.newCollectionMsg.claims : [],
        transfers: txState ? txState?.newCollectionMsg.transfers : [],
        badgeSupplys: txState ? txState?.newCollectionMsg.badgeSupplys : [],
        collectionUri: txState && txType === 'AddBadges' ? txState?.newCollectionMsg.collectionUri : "",
        badgeUris: txState && txType === 'AddBadges' ? txState?.newCollectionMsg.badgeUris : []
    }

    // const unregisteredUsers = txState?.manualSend && txState?.newCollectionMsg.transfers.length > 0
    //     ? txState.claimItems.filter((x) => x.userInfo.accountNumber === -1).map((x) => x.userInfo.cosmosAddress) : [];
    const unregisteredUsers: string[] = [];


    async function updateIPFSUris() {
        if (!txState) return;

        let collectionUri = txState.newCollectionMsg.collectionUri;
        let badgeUris = txState.newCollectionMsg.badgeUris;
        let claims = txState.newCollectionMsg.claims;

        //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
        if (txState?.addMethod == MetadataAddMethod.Manual && txType === 'AddBadges') {
            let res = await addToIpfs(txState?.collectionMetadata, txState?.individualBadgeMetadata);

            // collectionUri = 'ipfs://' + res.cid + '/collection';
            const keys = Object.keys(txState.individualBadgeMetadata);
            const values = Object.values(txState.individualBadgeMetadata);
            //This is a little hack; we never alter the previous badges in AddBadges timeline, so we can just add the new metadata to the end of the array 
            for (let i = badgeUris.length; i < keys.length; i++) {
                badgeUris.push({
                    uri: 'ipfs://' + res.cid + '/batch/' + keys[i],
                    badgeIds: values[i].badgeIds
                });
            }
        }

        //If distribution method is codes or a whitelist, add the merkle tree to IPFS and update the claim URI
        if (txState?.distributionMethod == DistributionMethod.Codes || txState?.distributionMethod == DistributionMethod.Whitelist) {
            if (claims?.length > 0) {
                let merkleTreeRes = await addMerkleTreeToIpfs(txState?.claimItems.map((x) => x.fullCode), txState?.claimItems.map(x => x.addresses), txState?.claimItems.map(x => x.codes));
                claims[0].uri = 'ipfs://' + merkleTreeRes.cid + '';
                // //For the codes, we store the hashed codes as leaves on IPFS because we don't want to store the codes themselves
                // //For the whitelist, we store the full plaintext codes as leaves on IPFS
                // if (txState?.distributionMethod == DistributionMethod.Codes) {

                // } else {
                //     let merkleTreeRes = await addMerkleTreeToIpfs(txState?.claimItems.map((x) => x.fullCode));
                //     claims[0].uri = 'ipfs://' + merkleTreeRes.cid + '';
                // }
            }
        }

        setTxState({
            ...txState,
            newCollectionMsg: {
                ...txState.newCollectionMsg,
                collectionUri,
                badgeUris,
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
            badgeUris
        }
    }

    const onRegister = async () => {
        // if (!txState) return;
        // let newUsersToRegister = txState.claimItems.filter((x) => x.userInfo.accountNumber === -1);

        // const newAccounts = await accounts.fetchAccounts(newUsersToRegister.map((x) => x.userInfo.cosmosAddress));
        // const newClaimItems = [];
        // for (const claimItem of txState.claimItems) {
        //     if (claimItem.userInfo.accountNumber === -1) {
        //         const newAccount = newAccounts.find((x) => x.cosmosAddress === claimItem.userInfo.cosmosAddress);
        //         if (newAccount) {
        //             newClaimItems.push({
        //                 ...claimItem,
        //                 userInfo: newAccount,
        //                 address: newAccount.cosmosAddress,
        //                 accountNum: newAccount.accountNumber,
        //             });
        //         }
        //     } else {
        //         newClaimItems.push(claimItem);
        //     }
        // }

        // txState.setClaimItems([...newClaimItems]);

        // if (txState.manualSend) {
        //     txState.setNewCollectionMsg({
        //         ...txState?.newCollectionMsg,
        //         transfers: getTransfersFromClaimItems(newClaimItems, accounts),
        //         claims: []
        //     });
        // } else if (!txState.manualSend) {
        //     const balance = getBadgeSupplysFromMsgNewCollection(txState?.newCollectionMsg);
        //     const claimRes = getClaimsValueFromClaimItems(balance, newClaimItems, txState.distributionMethod);

        //     txState.setNewCollectionMsg({
        //         ...txState?.newCollectionMsg,
        //         transfers: [],
        //         claims: claimRes.claims
        //     })
        // }

        // setVisible(true);
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
