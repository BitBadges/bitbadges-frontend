import { Button } from 'antd';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { addMerkleTreeToIpfs, addToIpfs } from '../../../bitbadges-api/api';
import { BadgeMetadata, BadgeMetadataMap, ClaimItem, DistributionMethod, IdRange, MetadataAddMethod, TransferMappingWithUnregisteredUsers } from '../../../bitbadges-api/types';
import { CreateTxMsgNewCollectionModal } from '../../tx-modals/CreateTxMsgNewCollectionModal';
import { getClaimsFromClaimItems, getTransfersFromClaimItems } from '../../../bitbadges-api/claims';
import { getBadgeSupplysFromMsgNewCollection } from '../../../bitbadges-api/balances';
import { useAccountsContext } from '../../../contexts/AccountsContext';
import { InsertRangeToIdRanges, RemoveIdsFromIdRange } from '../../../bitbadges-api/idRanges';

export function SubmitMsgNewCollection({
    newCollectionMsg,
    setNewCollectionMsg,
    collectionMetadata,
    individualBadgeMetadata,
    addMethod,
    claimItems,
    distributionMethod,
    setClaimItems,
    manualSend,
    managerApprovedTransfersWithUnregisteredUsers,
    disallowedTransfersWithUnregisteredUsers,
}: {
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    addMethod: MetadataAddMethod;
    claimItems: ClaimItem[];
    collectionMetadata: BadgeMetadata;
    individualBadgeMetadata: BadgeMetadataMap;
    distributionMethod: DistributionMethod;
    setClaimItems: (claimItems: ClaimItem[]) => void;
    manualSend: boolean;
    managerApprovedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[],
    disallowedTransfersWithUnregisteredUsers: TransferMappingWithUnregisteredUsers[],
}) {
    const [visible, setVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [unregisteredUsers, setUnregisteredUsers] = useState<string[]>([]);

    const accounts = useAccountsContext();

    useEffect(() => {
        let newUnregisteredUsers: string[] = [];
        for (const claimItem of claimItems) {
            for (const address of claimItem.addresses) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }

        for (const transfer of managerApprovedTransfersWithUnregisteredUsers) {
            for (const address of transfer.toUnregisteredUsers) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }

            for (const address of transfer.fromUnregisteredUsers) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }

        for (const transfer of disallowedTransfersWithUnregisteredUsers) {
            for (const address of transfer.toUnregisteredUsers) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }

            for (const address of transfer.fromUnregisteredUsers) {
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
                transfers: getTransfersFromClaimItems(claimItems, accounts),
                claims: []
            });
        } else if (!manualSend) {
            const balance = getBadgeSupplysFromMsgNewCollection(newCollectionMsg);
            const claimRes = getClaimsFromClaimItems(balance, claimItems);
            setNewCollectionMsg({
                ...newCollectionMsg,
                claims: claimRes.claims,
                transfers: []
            });

        }

    }, [claimItems, accounts, manualSend, setNewCollectionMsg]);

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
        }

        //If distribution method is codes or a whitelist, add the merkle tree to IPFS and update the claim URI
        if (distributionMethod == DistributionMethod.Codes || distributionMethod == DistributionMethod.Whitelist) {
            if (badgeMsg.claims?.length > 0) {
                for (let i = 0; i < claimItems.length; i++) {
                    let merkleTreeRes = await addMerkleTreeToIpfs([], claimItems[i].addresses, claimItems[i].codes, claimItems[i].hashedCodes, claimItems[i].password);
                    badgeMsg.claims[i].uri = 'ipfs://' + merkleTreeRes.cid + '';
                }

                // //For the codes, we store the hashed codes as leaves on IPFS because we don't want to store the codes themselves
                // //For the whitelist, we store the full plaintext codes as leaves on IPFS
                // if (distributionMethod == DistributionMethod.Codes) {

                // } else {
                //     let merkleTreeRes = await addMerkleTreeToIpfs(claimItems.map((x) => x.fullCode));
                //     badgeMsg.claims[0].uri = 'ipfs://' + merkleTreeRes.cid + '';
                // }
            }
        }

        setNewCollectionMsg(badgeMsg);
    }



    function updateUnregisteredUsers() {
        //Get new account numbers for unregistered users
        let newUnregisteredUsers: string[] = [];
        for (const claimItem of claimItems) {
            for (const address of claimItem.addresses) {
                console.log("ACCOUNT", accounts.accounts[address]);
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }

        for (const transfer of managerApprovedTransfersWithUnregisteredUsers) {
            for (const address of transfer.toUnregisteredUsers) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }

            for (const address of transfer.fromUnregisteredUsers) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }

        for (const transfer of disallowedTransfersWithUnregisteredUsers) {
            for (const address of transfer.toUnregisteredUsers) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }

            for (const address of transfer.fromUnregisteredUsers) {
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregisteredUsers.push(address);
            }
        }
        setUnregisteredUsers(newUnregisteredUsers);
        console.log("UNREGISTED", newUnregisteredUsers);
    }



    const onRegister = async () => {
        setLoading(true);

        const fetchedAccounts = await accounts.fetchAccounts(unregisteredUsers, true);
        console.log("FETCHED ACCTS", fetchedAccounts);

        updateUnregisteredUsers();

        const finalCollectionMsg = { ...newCollectionMsg };

        //If we are manually sending, we need to update the transfers field. If not, we update the claims.
        if (manualSend) {
            finalCollectionMsg.transfers = getTransfersFromClaimItems(claimItems, accounts);
            finalCollectionMsg.claims = [];

        } else if (!manualSend) {
            const balance = getBadgeSupplysFromMsgNewCollection(newCollectionMsg);
            const claimRes = getClaimsFromClaimItems(balance, claimItems);

            finalCollectionMsg.claims = claimRes.claims;
            finalCollectionMsg.transfers = [];
        }

        for (const transferMapping of managerApprovedTransfersWithUnregisteredUsers) {
            for (const address of transferMapping.toUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;


                let newAccountNums: IdRange[] = []
                if (transferMapping.removeToUsers) {
                    for (const idRange of transferMapping.to.accountNums) {
                        newAccountNums.push(...RemoveIdsFromIdRange({ start: fetchedAcctNumber, end: fetchedAcctNumber }, idRange));
                    }

                    transferMapping.to.accountNums = newAccountNums;
                } else {
                    if (transferMapping.to.accountNums.length == 0) {
                        transferMapping.to.accountNums = [{ start: fetchedAcctNumber, end: fetchedAcctNumber }];
                    } else {
                        if (transferMapping.to.accountNums.length == 0) {
                            transferMapping.to.accountNums.push({ start: fetchedAcctNumber, end: fetchedAcctNumber });
                        } else {
                            //Since they were previously unregistered, we assume there is no way it can already be in accountNums
                            transferMapping.to.accountNums = InsertRangeToIdRanges({ start: fetchedAcctNumber, end: fetchedAcctNumber }, transferMapping.to.accountNums);
                        }
                    }
                }

            }

            for (const address of transferMapping.fromUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;


                let newAccountNums: IdRange[] = []
                if (transferMapping.removeFromUsers) {
                    for (const idRange of transferMapping.from.accountNums) {
                        newAccountNums.push(...RemoveIdsFromIdRange({ start: fetchedAcctNumber, end: fetchedAcctNumber }, idRange));
                    }

                    transferMapping.from.accountNums = newAccountNums;
                } else {
                    if (transferMapping.from.accountNums.length == 0) {
                        transferMapping.from.accountNums.push({ start: fetchedAcctNumber, end: fetchedAcctNumber });
                    } else {
                        //Since they were previously unregistered, we assume there is no way it can already be in accountNums
                        transferMapping.from.accountNums = InsertRangeToIdRanges({ start: fetchedAcctNumber, end: fetchedAcctNumber }, transferMapping.from.accountNums);
                    }
                }
            }

            finalCollectionMsg.managerApprovedTransfers = managerApprovedTransfersWithUnregisteredUsers.map((x) => {
                return {
                    to: x.to,
                    from: x.from
                }
            });
        }

        for (const transferMapping of disallowedTransfersWithUnregisteredUsers) {
            for (const address of transferMapping.toUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;


                let newAccountNums: IdRange[] = []
                if (transferMapping.removeToUsers) {
                    for (const idRange of transferMapping.to.accountNums) {
                        newAccountNums.push(...RemoveIdsFromIdRange({ start: fetchedAcctNumber, end: fetchedAcctNumber }, idRange));
                    }

                    transferMapping.to.accountNums = newAccountNums;
                } else {
                    if (transferMapping.to.accountNums.length == 0) {
                        transferMapping.to.accountNums.push({ start: fetchedAcctNumber, end: fetchedAcctNumber });
                    } else {
                        //Since they were previously unregistered, we assume there is no way it can already be in accountNums
                        transferMapping.to.accountNums = InsertRangeToIdRanges({ start: fetchedAcctNumber, end: fetchedAcctNumber }, transferMapping.to.accountNums);
                    }
                }
            }

            for (const address of transferMapping.fromUnregisteredUsers) {
                const fetchedAcctNumber = fetchedAccounts.find((x) => x.cosmosAddress == address)?.accountNumber;
                if (fetchedAcctNumber == undefined) continue;


                let newAccountNums: IdRange[] = []
                if (transferMapping.removeFromUsers) {
                    for (const idRange of transferMapping.from.accountNums) {
                        newAccountNums.push(...RemoveIdsFromIdRange({ start: fetchedAcctNumber, end: fetchedAcctNumber }, idRange));
                    }

                    transferMapping.from.accountNums = newAccountNums;
                } else {
                    if (transferMapping.from.accountNums.length == 0) {
                        transferMapping.from.accountNums.push({ start: fetchedAcctNumber, end: fetchedAcctNumber });
                    } else {
                        //Since they were previously unregistered, we assume there is no way it can already be in accountNums
                        transferMapping.from.accountNums = InsertRangeToIdRanges({ start: fetchedAcctNumber, end: fetchedAcctNumber }, transferMapping.from.accountNums);
                    }
                }
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
        {/* TODO: Preview and Review */}
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
