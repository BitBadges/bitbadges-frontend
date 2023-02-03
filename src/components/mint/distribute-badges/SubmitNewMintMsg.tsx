import { Typography, Form, Button } from 'antd';
import React from 'react';
import { useState } from 'react';

import { PRIMARY_TEXT } from '../../../constants';
import { FormNavigationHeader } from '../../common/FormNavigationHeader';
import { BadgeMetadata, BitBadgeCollection, ClaimItem, DistributionMethod } from '../../../bitbadges-api/types';
import { MessageMsgMintBadge, MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { CreateTxMsgNewCollectionModal } from '../../txModals/CreateTxMsgNewCollectionModal';
import { addMerkleTreeToIpfs, addToIpfs } from '../../../chain/backend_connectors';
import { SHA256 } from 'crypto-js';
import { CreateTxMsgMintBadgeModal } from '../../txModals/CreateTxMsgMintBadgeModal';

const FINAL_STEP_NUM = 1;
const FIRST_STEP_NUM = 1;
const CURR_TIMELINE_STEP_NUM = 1;

export function SubmitNewMintMsg({
    setTimelineStepNumber,
    newCollectionMsg,
    setNewCollectionMsg,
    collection,

    claimItems,
    distributionMethod,

}: {
    collection: BitBadgeCollection,
    setTimelineStepNumber: (stepNum: number) => void;
    newCollectionMsg: MessageMsgNewCollection;
    setNewCollectionMsg: (badge: MessageMsgNewCollection) => void;
    claimItems: ClaimItem[];
    setClaimItems: (claimItems: ClaimItem[]) => void;
    collectionMetadata: BadgeMetadata;
    setCollectionMetadata: (metadata: BadgeMetadata) => void;
    individualBadgeMetadata: BadgeMetadata[];
    setIndividualBadgeMetadata: (metadata: BadgeMetadata[]) => void;
    distributionMethod: DistributionMethod;
    setDistributionMethod: (method: DistributionMethod) => void;
}) {
    const [stepNum, setStepNum] = useState(1);
    const [visible, setVisible] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);

    const incrementStep = () => {
        if (stepNum === FINAL_STEP_NUM) {
            // setTimelineStepNumber(CURR_TIMELINE_STEP_NUM + 1);
        } else {
            setStepNum(stepNum + 1);
        }
    };

    const decrementStep = () => {
        if (stepNum === FIRST_STEP_NUM) {
            setTimelineStepNumber(CURR_TIMELINE_STEP_NUM - 1);
        } else {
            setStepNum(stepNum - 1);
        }
    };

    const newMintMsg: MessageMsgMintBadge = {
        creator: newCollectionMsg.creator,
        collectionId: collection.collectionId,
        claims: newCollectionMsg.claims,
        transfers: newCollectionMsg.transfers,
        badgeSupplys: newCollectionMsg.badgeSupplys,
    }

    return (
        <div>
            <Form.Provider>
                <FormNavigationHeader
                    incrementStep={incrementStep}
                    decrementStep={decrementStep}
                    stepNum={stepNum}
                    finalStepNumber={1}
                />
                <div style={{ paddingLeft: 5 }}>
                    <div
                        style={{
                            justifyContent: 'center',
                            display: 'flex',
                        }}
                    >
                        <Typography.Text
                            style={{
                                color: PRIMARY_TEXT,
                                fontSize: 20,
                                marginBottom: 10,
                            }}
                            strong
                        >
                            Mint Badge
                        </Typography.Text>
                    </div>
                </div>
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
                            setSuccess(false);

                            let badgeMsg = newCollectionMsg;

                            if (distributionMethod == DistributionMethod.Codes || distributionMethod == DistributionMethod.SpecificAddresses) {
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
                            setSuccess(true);
                        }}
                    >
                        Mint Badges!
                    </Button>
                    {/* <>
                    TODO: should we have this or leave it out for UX?

                        We will now create and upload your collection.
                        For backup purposes, we recommend you save a local copy of the metadata and distribution codes as well (
                        <button
                            style={{
                                backgroundColor: 'inherit',
                                color: SECONDARY_TEXT,
                            }}
                            onClick={() => {
                                const today = new Date();

                                const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                                const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                                downloadJson({
                                    collectionMetadata: collectionMetadata,
                                    individualBadgeMetadata: individualBadgeMetadata,
                                    leaves: leaves,
                                }, `metadata-${collectionMetadata.name}-${dateString}-${timeString}.json`);
                            }}
                            className="opacity link-button"
                        >
                            click here to download
                        </button>). </> */}
                    <CreateTxMsgMintBadgeModal
                        visible={visible}
                        setVisible={setVisible}
                        txCosmosMsg={newMintMsg}
                    />
                </div>
            </Form.Provider >
        </div >
    );
}
