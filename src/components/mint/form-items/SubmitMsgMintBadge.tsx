import { Button } from 'antd';
import { useState } from 'react';

import { MessageMsgMintBadge, MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { SHA256 } from 'crypto-js';
import { BitBadgeCollection, ClaimItem, DistributionMethod } from '../../../bitbadges-api/types';
import { addMerkleTreeToIpfs } from '../../../bitbadges-api/api';
import { CreateTxMsgMintBadgeModal } from '../../txModals/CreateTxMsgMintBadgeModal';
import { useAccountsContext } from '../../../accounts/AccountsContext';
import { getBadgeSupplysFromMsgNewCollection } from '../../../bitbadges-api/balances';
import { getClaimsValueFromClaimItems } from '../../../bitbadges-api/claims';

export function SubmitNewMintMsg({
    newCollectionMsg,
    setNewCollectionMsg,
    collection,
    claimItems,
    setClaimItems,
    distributionMethod,
    manualSend
}: {
    collection: BitBadgeCollection,
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    claimItems: ClaimItem[];
    setClaimItems: (claimItems: ClaimItem[]) => void;
    distributionMethod: DistributionMethod;
    manualSend: boolean;
}) {
    const [visible, setVisible] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);

    const accounts = useAccountsContext();


    const newMintMsg: MessageMsgMintBadge = {
        creator: newCollectionMsg.creator,
        collectionId: collection.collectionId,
        claims: newCollectionMsg.claims,
        transfers: newCollectionMsg.transfers,
        badgeSupplys: newCollectionMsg.badgeSupplys,
    }

    const unregisteredUsers = manualSend
        && newCollectionMsg.transfers.length > 0
        ? claimItems.filter((x) => x.userInfo.accountNumber === -1).map((x) => x.userInfo.cosmosAddress) : [];

    const onRegister = async () => {
        setLoading(true);

        let newUsersToRegister = claimItems.filter((x) => x.userInfo.accountNumber === -1);

        const newAccounts = await accounts.fetchAccounts(newUsersToRegister.map((x) => x.userInfo.cosmosAddress));
        const newClaimItems = [];
        for (const claimItem of claimItems) {
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

        setClaimItems([...newClaimItems]);

        if (manualSend) {
            setNewCollectionMsg({
                ...newCollectionMsg,
                transfers: newClaimItems.map((x) => ({
                    toAddresses: [x.accountNum],
                    balances: [
                        {
                            balance: x.amount,
                            badgeIds: x.badgeIds,
                        }
                    ]
                })),
                claims: []
            });
        } else if (!manualSend) {
            const balance = getBadgeSupplysFromMsgNewCollection(newCollectionMsg);
            const claimRes = getClaimsValueFromClaimItems(balance, newClaimItems, distributionMethod);

            setNewCollectionMsg({
                ...newCollectionMsg,
                transfers: [],
                claims: claimRes.claims
            })
        }

        setVisible(true);
        setLoading(false);
    }

    return (
        <div>
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 20,
                }}
            >
                <Button
                    type="primary"
                    style={{ width: '90%' }}
                    loading={loading}

                    onClick={async () => {
                        setLoading(true);

                        let badgeMsg = newCollectionMsg;

                        if (distributionMethod == DistributionMethod.Codes || distributionMethod == DistributionMethod.Whitelist) {
                            //Store N-1 layers of the tree
                            if (badgeMsg.claims?.length > 0) {
                                if (distributionMethod == DistributionMethod.Codes) {
                                    let merkleTreeRes = await addMerkleTreeToIpfs(claimItems.map((x) => SHA256(x.fullCode).toString()));
                                    badgeMsg.claims[0].uri = 'ipfs://' + merkleTreeRes.cid + '';
                                } else {
                                    let merkleTreeRes = await addMerkleTreeToIpfs(claimItems.map((x) => x.fullCode));
                                    badgeMsg.claims[0].uri = 'ipfs://' + merkleTreeRes.cid + '';
                                }
                            }
                        }

                        setNewCollectionMsg(badgeMsg);

                        setVisible(true);

                        setLoading(false);
                    }}
                >
                    Mint Badges!
                </Button>
                <CreateTxMsgMintBadgeModal
                    visible={visible}
                    setVisible={setVisible}
                    unregisteredUsers={unregisteredUsers}
                    onRegister={onRegister}
                    txCosmosMsg={newMintMsg}
                />
            </div>
        </div >
    );
}
