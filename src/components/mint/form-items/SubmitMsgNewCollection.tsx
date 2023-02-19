import { Button } from 'antd';
import React from 'react';
import { useState } from 'react';
import { BadgeMetadata, ClaimItem, DistributionMethod, MetadataAddMethod } from '../../../bitbadges-api/types';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { CreateTxMsgNewCollectionModal } from '../../txModals/CreateTxMsgNewCollectionModal';
import { addMerkleTreeToIpfs, addToIpfs } from '../../../bitbadges-api/backend_connectors';
import { SHA256 } from 'crypto-js';

export function SubmitMsgNewCollection({
    newCollectionMsg,
    setNewCollectionMsg,
    collectionMetadata,
    individualBadgeMetadata,
    addMethod,
    claimItems,
    distributionMethod,
}: {
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    addMethod: MetadataAddMethod;
    claimItems: ClaimItem[];
    collectionMetadata: BadgeMetadata;
    individualBadgeMetadata: { [badgeId: string]: BadgeMetadata };
    distributionMethod: DistributionMethod;
}) {
    const [visible, setVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    async function updateIPFSUris() {
        let badgeMsg = newCollectionMsg;

        //If metadata was added manually, add it to IPFS and update the colleciton and badge URIs
        if (addMethod == MetadataAddMethod.Manual) {
            let res = await addToIpfs(collectionMetadata, individualBadgeMetadata);

            badgeMsg.collectionUri = 'ipfs://' + res.cid + '/collection';
            badgeMsg.badgeUri = 'ipfs://' + res.cid + '/{id}';
        }

        //If distribution method is codes or a whitelist, add the merkle tree to IPFS and update the claim URI
        if (distributionMethod == DistributionMethod.Codes || distributionMethod == DistributionMethod.Whitelist) {
            if (badgeMsg.claims?.length > 0) {
                //For the codes, we store the hashed codes as leaves on IPFS because we don't want to store the codes themselves
                //For the whitelist, we store the full plaintext codes as leaves on IPFS
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
        />
    </div>
}
