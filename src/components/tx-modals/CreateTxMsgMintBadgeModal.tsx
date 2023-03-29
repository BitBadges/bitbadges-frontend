import { MessageMsgMintBadge, createTxMsgMintBadge } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { addMerkleTreeToIpfs, addToIpfs } from '../../bitbadges-api/api';
import { BadgeMetadataMap, BadgeUri, DistributionMethod, IdRange, MetadataAddMethod } from '../../bitbadges-api/types';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';
import { RemoveIdsFromIdRange } from '../../bitbadges-api/idRanges';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { getClaimsFromClaimItems, getTransfersFromClaimItems } from '../../bitbadges-api/claims';
import { getBadgeSupplysFromMsgNewCollection } from '../../bitbadges-api/balances';

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
    const [unregisteredUsers, setUnregisteredUsers] = useState<string[]>([]);

    useEffect(() => {
        if (!txState) return;
        let newUnregisteredUsers: string[] = [];
        for (const claimItem of txState.claimItems) {
            for (const address of claimItem.addresses) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }
        setUnregisteredUsers(newUnregisteredUsers);

        //If we are manually sending, we need to update the transfers field. If not, we update the claims.
        if (txState.manualSend) {
            txState.setNewCollectionMsg({
                ...txState.newCollectionMsg,
                transfers: getTransfersFromClaimItems(txState.claimItems, accounts),
                claims: []
            });
        } else if (!txState.manualSend) {
            const balance = getBadgeSupplysFromMsgNewCollection(txState.newCollectionMsg);
            const claimRes = getClaimsFromClaimItems(balance, txState.claimItems);

            txState.setNewCollectionMsg({
                ...txState.newCollectionMsg,
                transfers: [],
                claims: claimRes.claims
            })
        }
    }, [txState, txState?.claimItems, accounts, txState?.manualSend, txState?.setNewCollectionMsg]);

    const newMintMsg: MessageMsgMintBadge = {
        creator: txState ? txState?.newCollectionMsg.creator : '',
        collectionId: collectionId,
        claims: txState ? txState?.newCollectionMsg.claims : [],
        transfers: txState ? txState?.newCollectionMsg.transfers : [],
        badgeSupplys: txState ? txState?.newCollectionMsg.badgeSupplys : [],
        collectionUri: txState && txType === 'AddBadges' ? txState?.newCollectionMsg.collectionUri : "",
        badgeUris: txState && txType === 'AddBadges' ? txState?.newCollectionMsg.badgeUris : []
    }



    async function updateIPFSUris() {
        if (!txState || !txState.existingCollection) return;

        let badgeMsg = txState.newCollectionMsg;
        let collectionUri = txState.existingCollection.collectionUri;
        let badgeUris = JSON.parse(JSON.stringify(txState.existingCollection.badgeUris));
        let claims = txState.newCollectionMsg.claims;

        //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
        if (txState.addMethod == MetadataAddMethod.Manual && txType === 'AddBadges') {
            //Prune the metadata to only include the new badges
            const prunedMetadata: BadgeMetadataMap = {};
            let keys = Object.keys(txState.individualBadgeMetadata);
            let values = Object.values(txState.individualBadgeMetadata);
            let idx = 0;

            for (let i = 0; i < keys.length; i++) {
                let prunedBadgeIds: IdRange[] = [];
                for (let j = 0; j < values[i].badgeIds.length; j++) {
                    if (txState.existingCollection) {
                        prunedBadgeIds.push(...RemoveIdsFromIdRange({ start: 1, end: txState.existingCollection.nextBadgeId - 1 }, values[i].badgeIds[j]));
                    } else {
                        prunedBadgeIds = values[i].badgeIds;
                    }
                }

                if (prunedBadgeIds.length > 0) {
                    prunedMetadata[`${idx}`] = {
                        metadata: values[i].metadata,
                        badgeIds: prunedBadgeIds,
                        uri: values[i].uri
                    }
                    idx++;
                }
            }




            let res = await addToIpfs(txState.collectionMetadata, prunedMetadata);

            keys = Object.keys(prunedMetadata);
            values = Object.values(prunedMetadata);
            let addedUris: BadgeUri[] = [];
            for (let i = 0; i < keys.length; i++) {
                let duplicate = false;
                for (let j = 0; j < addedUris.length; j++) {
                    if (addedUris[j].uri === 'ipfs://' + res.cid + '/batch/' + keys[i]
                        && JSON.stringify(addedUris[j].badgeIds) === JSON.stringify(values[i].badgeIds)) {
                        duplicate = true;
                        break;
                    }
                }
                if (!duplicate) {
                    badgeUris.push({
                        uri: 'ipfs://' + res.cid + '/batch/' + keys[i],
                        badgeIds: values[i].badgeIds
                    });

                    addedUris.push({
                        uri: 'ipfs://' + res.cid + '/batch/' + keys[i],
                        badgeIds: values[i].badgeIds
                    });
                }
            }
        }

        //If distribution method is codes or a whitelist, add the merkle tree to IPFS and update the claim URI
        if (txState.distributionMethod == DistributionMethod.Codes || txState.distributionMethod == DistributionMethod.Whitelist) {
            if (badgeMsg.claims?.length > 0) {
                for (let i = 0; i < txState.claimItems.length; i++) {
                    let merkleTreeRes = await addMerkleTreeToIpfs([], txState.claimItems[i].addresses, txState.claimItems[i].codes, txState.claimItems[i].hashedCodes, txState.claimItems[i].password);
                    claims[i].uri = 'ipfs://' + merkleTreeRes.cid + '';
                }
            }
        }

        if (txState.addMethod == MetadataAddMethod.UploadUrl && txType === 'AddBadges') {
            badgeUris.push(...txState.newCollectionMsg.badgeUris);
        }

        txState.setNewCollectionMsg({
            ...txState?.newCollectionMsg,
            collectionUri: collectionUri,
            badgeUris: badgeUris,
            claims: claims
        });

        return {
            creator: txState ? txState?.newCollectionMsg.creator : '',
            collectionId: collectionId,
            claims: claims,
            transfers: txState ? txState?.newCollectionMsg.transfers : [],
            badgeSupplys: txState ? txState?.newCollectionMsg.badgeSupplys : [],
            collectionUri: collectionUri,
            badgeUris: badgeUris,
        }
    }


    function updateUnregisteredUsers() {
        if (!txState) return;
        //Get new account numbers for unregistered users
        let newUnregistedUsers: string[] = [];
        for (const claimItem of txState.claimItems) {
            for (const address of claimItem.addresses) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregistedUsers.push(address);
            }
        }
        setUnregisteredUsers(newUnregistedUsers);
    }

    const onRegister = async () => {
        if (!txState || !txState.manualSend) return;

        const fetchedAccounts = await accounts.fetchAccounts(unregisteredUsers, true);
        console.log("FETCHED ACCTS", fetchedAccounts);

        updateUnregisteredUsers();

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
