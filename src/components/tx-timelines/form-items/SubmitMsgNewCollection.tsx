import { Button } from 'antd';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { useEffect, useState } from 'react';
import { addMerkleTreeToIpfs, addToIpfs } from '../../../bitbadges-api/api';
import { BadgeMetadata, BadgeMetadataMap, ClaimItem, DistributionMethod, MetadataAddMethod } from '../../../bitbadges-api/types';
import { CreateTxMsgNewCollectionModal } from '../../tx-modals/CreateTxMsgNewCollectionModal';
import { getClaimsValueFromClaimItems, getTransfersFromClaimItems } from '../../../bitbadges-api/claims';
import { getBadgeSupplysFromMsgNewCollection } from '../../../bitbadges-api/balances';
import { useAccountsContext } from '../../../contexts/AccountsContext';

export function SubmitMsgNewCollection({
    newCollectionMsg,
    setNewCollectionMsg,
    collectionMetadata,
    individualBadgeMetadata,
    addMethod,
    claimItems,
    distributionMethod,
    setClaimItems,
    manualSend
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
            const claimRes = getClaimsValueFromClaimItems(balance, claimItems);

            setNewCollectionMsg({
                ...newCollectionMsg,
                transfers: [],
                claims: claimRes.claims
            })
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
        let newUnregistedUsers: string[] = [];
        for (const claimItem of claimItems) {
            for (const address of claimItem.addresses) {
                console.log("ACCOUNT", accounts.accounts[address]);
                if (accounts.accounts[address].accountNumber >= 0) continue;

                newUnregistedUsers.push(address);
            }
        }
        setUnregisteredUsers(newUnregistedUsers);
        console.log("UNREGISTED", newUnregistedUsers);
    }



    const onRegister = async () => {
        setLoading(true);
        if (!manualSend) return;


        const fetchedAccounts = await accounts.fetchAccounts(unregisteredUsers, true);
        console.log("FETCHED ACCTS", fetchedAccounts);

        updateUnregisteredUsers();

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
