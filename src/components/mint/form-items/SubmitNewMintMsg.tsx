import { Button } from 'antd';
import { useState } from 'react';

import { MessageMsgMintBadge, MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { SHA256 } from 'crypto-js';
import { BadgeMetadata, BitBadgeCollection, ClaimItem, DistributionMethod } from '../../../bitbadges-api/types';
import { addMerkleTreeToIpfs } from '../../../chain/backend_connectors';
import { CreateTxMsgMintBadgeModal } from '../../txModals/CreateTxMsgMintBadgeModal';

export function SubmitNewMintMsg({
    newCollectionMsg,
    setNewCollectionMsg,
    collection,
    claimItems,
    distributionMethod,
}: {
    collection: BitBadgeCollection,
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    claimItems: ClaimItem[];
    distributionMethod: DistributionMethod;
}) {
    const [visible, setVisible] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);


    const newMintMsg: MessageMsgMintBadge = {
        creator: newCollectionMsg.creator,
        collectionId: collection.collectionId,
        claims: newCollectionMsg.claims,
        transfers: newCollectionMsg.transfers,
        badgeSupplys: newCollectionMsg.badgeSupplys,
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
                    txCosmosMsg={newMintMsg}
                />
            </div>
        </div >
    );
}
