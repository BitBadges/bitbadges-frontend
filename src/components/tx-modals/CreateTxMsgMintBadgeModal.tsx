import { MessageMsgMintBadge, createTxMsgMintBadge } from 'bitbadgesjs-transactions';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { addMerkleTreeToIpfs, addToIpfs } from '../../bitbadges-api/api';
import { BadgeMetadataMap, BadgeUri, DistributionMethod, IdRange, MetadataAddMethod } from 'bitbadges-sdk';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';
import { TxModal } from './TxModal';
import { RemoveIdsFromIdRange } from 'bitbadges-sdk';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { getClaimsFromClaimItems, getTransfersFromClaimItems } from 'bitbadges-sdk';
import { Modal } from 'antd';

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

    const newMintMsg: MessageMsgMintBadge = {
        creator: txState ? txState?.newCollectionMsg.creator : '',
        collectionId: collectionId,
        claims: txState ? txState?.newCollectionMsg.claims : [],
        transfers: txState ? txState?.newCollectionMsg.transfers : [],
        badgeSupplys: txState ? txState?.newCollectionMsg.badgeSupplys : [],
        collectionUri: txState && txType === 'AddBadges' ? txState?.newCollectionMsg.collectionUri : "",
        badgeUris: txState && txType === 'AddBadges' ? txState?.newCollectionMsg.badgeUris : []
    }

    useEffect(() => {
        if (!txState) return;

        //If we are manually sending, we need to register users because we need account numbers.
        //For claims, we use cosmos addresses so account numbers do not matter

        //Also, if we are manually sending, we need to update the transfers field. If not, we update the claims.
        if (txState.manualSend) {
            let newUnregisteredUsers: string[] = [];
            for (const claimItem of txState.claimItems) {
                for (const address of claimItem.addresses) {
                    if (accounts.accounts[address].accountNumber >= 0) continue;

                    newUnregisteredUsers.push(address);
                }
            }
            setUnregisteredUsers(newUnregisteredUsers);

            txState.setNewCollectionMsg({
                ...txState.newCollectionMsg,
                transfers: getTransfersFromClaimItems(txState.claimItems, accounts.accounts),
                claims: []
            });
        } else {
            const balance = {
                balances: txState.simulatedCollection.maxSupplys,
                approvals: [],
            }
            const claimRes = getClaimsFromClaimItems(balance, txState.claimItems);

            txState.setNewCollectionMsg({
                ...txState.newCollectionMsg,
                transfers: [],
                claims: claimRes.claims
            })
        }

    }, [txState, txState?.manualSend, txState?.claimItems, accounts]);


    async function updateIPFSUris() {
        if (!txState || !txState.existingCollection) return;


        let collectionUri = txState.existingCollection.collectionUri;
        let badgeUris = JSON.parse(JSON.stringify(txState.existingCollection.badgeUris));
        let claims = txState.newCollectionMsg.claims;

        //If metadata was added manually, we need to add it to IPFS and update the URIs in newCollectionMsg
        if (txState.addMethod == MetadataAddMethod.Manual && txType === 'AddBadges') {
            //Prune the metadata to only include the new metadata (i.e. no metadata from existingCollection)
            const prunedMetadata: BadgeMetadataMap = {};
            let keys = Object.keys(txState.individualBadgeMetadata);
            let values = Object.values(txState.individualBadgeMetadata);
            let idx = 0;

            for (let i = 0; i < keys.length; i++) {
                let prunedBadgeIds: IdRange[] = [];
                for (let j = 0; j < values[i].badgeIds.length; j++) {
                    prunedBadgeIds.push(...RemoveIdsFromIdRange({ start: 1, end: txState.existingCollection.nextBadgeId - 1 }, values[i].badgeIds[j]));
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
            //HACK: look into removing this
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
        } else if (txState.addMethod == MetadataAddMethod.UploadUrl && txType === 'AddBadges') {
            //If metadata was added via self-hosted URL, we simply just append the newCollectionMsg URIs to the existingCollection URIs
            badgeUris.push(...txState.newCollectionMsg.badgeUris);
        }

        //If distribution method is codes or a whitelist, we need to add the merkle tree to IPFS and update the claim URI
        if (txState.distributionMethod == DistributionMethod.Codes || txState.distributionMethod == DistributionMethod.Whitelist) {
            if (txState.newCollectionMsg.claims?.length > 0) {
                const promises = [];

                for (let i = 0; i < txState.claimItems.length; i++) {
                    promises.push(addMerkleTreeToIpfs([], txState.claimItems[i].addresses, txState.claimItems[i].codes, txState.claimItems[i].hashedCodes, txState.claimItems[i].password));
                }

                const merkleTreeResponses = await Promise.all(promises);

                for (let i = 0; i < txState.claimItems.length; i++) {
                    claims[i].uri = 'ipfs://' + merkleTreeResponses[i].cid + '';
                }
            }
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
        } as MessageMsgMintBadge;
    }

    const onRegister = async () => {
        if (!txState || !txState.manualSend) return;

        await accounts.fetchAccounts(unregisteredUsers, true);

        //When accounts get fetched, the accountsContext updates and the useEffect() will be called again

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
                const newMintMsg = await updateIPFSUris();
                return newMintMsg
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
                Modal.destroyAll()
            }}
            onRegister={onRegister}
            unregisteredUsers={unregisteredUsers}
        >
            {children}
        </TxModal>
    );
}
