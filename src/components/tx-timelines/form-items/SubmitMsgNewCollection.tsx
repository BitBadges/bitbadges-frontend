import { Button } from 'antd';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { addMerkleTreeToIpfs, addToIpfs } from '../../../bitbadges-api/api';
import { ClaimItemWithTrees, getClaimsFromClaimItems, getTransfersFromClaimItems } from 'bitbadges-sdk';
import { updateTransferMappingAccountNums } from 'bitbadges-sdk';
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, DistributionMethod, MetadataAddMethod, TransferMappingWithUnregisteredUsers } from 'bitbadges-sdk';
import { useAccountsContext } from '../../../contexts/AccountsContext';
import { CreateTxMsgNewCollectionModal } from '../../tx-modals/CreateTxMsgNewCollectionModal';

export function SubmitMsgNewCollection({
    newCollectionMsg,
    setNewCollectionMsg,
    collectionMetadata,
    individualBadgeMetadata,
    addMethod,
    claimItems,
    distributionMethod,
    manualSend,
    managerApprovedTransfersWithUnregisteredUsers,
    disallowedTransfersWithUnregisteredUsers,
    simulatedCollection
}: {
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    addMethod: MetadataAddMethod;
    claimItems: ClaimItemWithTrees[];
    collectionMetadata: BadgeMetadata;
    individualBadgeMetadata: BadgeMetadataMap;
    distributionMethod: DistributionMethod;
    manualSend: boolean;
    managerApprovedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[],
    disallowedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[],
    simulatedCollection: BitBadgeCollection
}) {
    const [visible, setVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [unregisteredUsers, setUnregisteredUsers] = useState<string[]>([]);

    const accounts = useAccountsContext();

    useEffect(() => {
        let newUnregisteredUsers: string[] = [];
        if (manualSend) {
            for (const claimItem of claimItems) {
                for (const address of claimItem.addresses) {
                    if (accounts.accounts[address].accountNumber >= 0) continue;

                    newUnregisteredUsers.push(address);
                }
            }
        }

        for (const transfer of managerApprovedTransfersWithUnregisteredUsers) {
            for (const address of [...transfer.toUnregisteredUsers, ...transfer.fromUnregisteredUsers]) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }

        for (const transfer of disallowedTransfersWithUnregisteredUsers) {
            for (const address of [...transfer.toUnregisteredUsers, ...transfer.fromUnregisteredUsers]) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }

        newUnregisteredUsers = [...new Set(newUnregisteredUsers)];
        setUnregisteredUsers(newUnregisteredUsers);

        //If we are manually sending, we need to update the transfers field. If not, we update the claims.
        if (manualSend) {
            setNewCollectionMsg({
                ...newCollectionMsg,
                transfers: getTransfersFromClaimItems(claimItems, accounts.accounts),
                claims: []
            });
        } else if (!manualSend) {
            const balance = {
                balances: simulatedCollection.maxSupplys,
                approvals: [],
            }
            const claimRes = getClaimsFromClaimItems(balance, claimItems);
            setNewCollectionMsg({
                ...newCollectionMsg,
                claims: claimRes.claims,
                transfers: []
            });
        }
    }, [claimItems, accounts, manualSend, setNewCollectionMsg, managerApprovedTransfersWithUnregisteredUsers, disallowedTransfersWithUnregisteredUsers]);

    async function updateIPFSUris() {
        let badgeMsg = newCollectionMsg;

        //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
        if (addMethod == MetadataAddMethod.Manual) {
            let res = await addToIpfs(collectionMetadata, individualBadgeMetadata);

            badgeMsg.collectionUri = 'ipfs://' + res.cid + '/collection';
            badgeMsg.badgeUris = [];

            const keys = Object.keys(individualBadgeMetadata);
            const values = Object.values(individualBadgeMetadata);
            for (let i = 0; i < keys.length; i++) {
                badgeMsg.badgeUris.push({
                    uri: 'ipfs://' + res.cid + '/batch/' + keys[i],
                    badgeIds: values[i].badgeIds
                });
            }

            //No need to append here or perform any additional logic with the badge URIs like in MintBadge because there is no existing collection
        }

        //If distribution method is codes or a whitelist, add the merkle tree to IPFS and update the claim URI
        if (distributionMethod == DistributionMethod.Codes || distributionMethod == DistributionMethod.Whitelist) {
            if (badgeMsg.claims?.length > 0) {
                for (let i = 0; i < claimItems.length; i++) {
                    let merkleTreeRes = await addMerkleTreeToIpfs([], claimItems[i].addresses, claimItems[i].codes, claimItems[i].hashedCodes, claimItems[i].password);
                    badgeMsg.claims[i].uri = 'ipfs://' + merkleTreeRes.cid + '';
                }
            }
        }

        setNewCollectionMsg(badgeMsg);
    }

    const onRegister = async () => {
        setLoading(true);

        const fetchedAccounts = await accounts.fetchAccounts(unregisteredUsers, true); // This will update the useEffect() above and set unregisterUsers to []

        const finalCollectionMsg = { ...newCollectionMsg };

        //If we are manually sending, we need to update the transfers field. If not, we update the claims.
        if (manualSend) {
            finalCollectionMsg.transfers = getTransfersFromClaimItems(claimItems, accounts.accounts);
            finalCollectionMsg.claims = [];
        } else if (!manualSend) {
            const balance = {
                balances: simulatedCollection.maxSupplys,
                approvals: [],
            }
            const claimRes = getClaimsFromClaimItems(balance, claimItems);

            finalCollectionMsg.claims = claimRes.claims;
            finalCollectionMsg.transfers = [];
        }

        //Update the manager approved transfers with the newly registered users
        for (const transferMapping of managerApprovedTransfersWithUnregisteredUsers) {
            for (const address of transferMapping.toUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;
                transferMapping.to = updateTransferMappingAccountNums(fetchedAcctNumber, transferMapping.removeToUsers, transferMapping.to);
            }

            for (const address of transferMapping.fromUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;
                transferMapping.from = updateTransferMappingAccountNums(fetchedAcctNumber, transferMapping.removeFromUsers, transferMapping.from);
            }

            finalCollectionMsg.managerApprovedTransfers = managerApprovedTransfersWithUnregisteredUsers.map((x) => {
                return {
                    to: x.to,
                    from: x.from
                }
            });
        }

        //Update the disallowed transfers with newly registered users
        for (const transferMapping of disallowedTransfersWithUnregisteredUsers) {
            for (const address of transferMapping.toUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;
                transferMapping.to = updateTransferMappingAccountNums(fetchedAcctNumber, transferMapping.removeToUsers, transferMapping.to);
            }

            for (const address of transferMapping.fromUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;
                transferMapping.from = updateTransferMappingAccountNums(fetchedAcctNumber, transferMapping.removeFromUsers, transferMapping.from);
            }

            finalCollectionMsg.disallowedTransfers = disallowedTransfersWithUnregisteredUsers.map((x) => {
                return {
                    to: x.to,
                    from: x.from
                }
            });
        }

        setNewCollectionMsg(finalCollectionMsg);

        setVisible(true);
        setLoading(false);
    }


    return <div
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
                await updateIPFSUris();
                setVisible(true);
                setLoading(false);
            }}
        >
            Create Badge Collection!
        </Button>
        <CreateTxMsgNewCollectionModal
            visible={visible}
            setVisible={setVisible}
            txCosmosMsg={newCollectionMsg}
            unregisteredUsers={unregisteredUsers}
            onRegister={onRegister}
        />
    </div>
}
