import React, { useState } from 'react';
import { MessageMsgMintBadge, createTxMsgMintBadge } from 'bitbadgesjs-transactions';
import { TxModal } from './TxModal';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { TxTimeline, TxTimelineProps } from '../tx-timelines/TxTimeline';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { getClaimsValueFromClaimItems, getTransfersFromClaimItems } from '../../bitbadges-api/claims';
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
