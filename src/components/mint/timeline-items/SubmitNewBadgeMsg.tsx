import { Typography, Form, Button } from 'antd';
import React from 'react';
import { useState } from 'react';

import { PRIMARY_TEXT, SECONDARY_TEXT } from '../../../constants';
import { FormNavigationHeader } from '../form/FormNavigationHeader';
import { BadgeMetadata } from '../../../bitbadges-api/types';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { CreateTxMsgNewCollectionModal } from '../../txModals/CreateTxMsgNewCollectionModal';
import { MetadataAddMethod } from '../MintTimeline';
import { addMerkleTreeToIpfs, addToIpfs } from '../../../chain/backend_connectors';
import saveAs from 'file-saver';

const FINAL_STEP_NUM = 1;
const FIRST_STEP_NUM = 1;
const CURR_TIMELINE_STEP_NUM = 2;

enum DistributionMethod {
    None,
    FirstComeFirstServe,
    SpecificAddresses,
    Codes,
    Unminted,
}

function downloadJson(json: object, filename: string) {
    const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json'
    });
    saveAs(blob, filename);
}

export function TransactionDetails({
    setTimelineStepNumber,
    newBadgeMsg,
    setNewBadgeMsg,
    newBadgeMetadata,
    setNewBadgeMetadata,
    collectionMetadata,
    setCollectionMetadata,
    individualBadgeMetadata,
    setIndividualBadgeMetadata,
    addMethod,
    setAddMethod,
    leaves,
    setLeaves,
    distributionMethod,
    setDistributionMethod,
}: {
    setTimelineStepNumber: (stepNum: number) => void;
    newBadgeMsg: MessageMsgNewCollection;
    newBadgeMetadata: BadgeMetadata;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
    setNewBadgeMetadata: (metadata: BadgeMetadata) => void;
    addMethod: MetadataAddMethod;
    setAddMethod: (method: MetadataAddMethod) => void;
    leaves: string[];
    setLeaves: (leaves: string[]) => void;
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

    return (
        <div>
            <Form.Provider>
                <FormNavigationHeader
                    incrementStep={incrementStep}
                    decrementStep={decrementStep}
                    stepNum={stepNum}
                    // backButtonDisabled={txnSubmitted && !transactionIsLoading} TODO: instead of this, we redirect to new badge page
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

                            let badgeMsg = newBadgeMsg;

                            if (addMethod == MetadataAddMethod.Manual) {
                                let res = await addToIpfs(collectionMetadata, individualBadgeMetadata);

                                badgeMsg.collectionUri = 'ipfs://' + res.cid + '/collection';
                                badgeMsg.badgeUri = 'ipfs://' + res.cid + '/{id}';
                            }

                            if (distributionMethod == DistributionMethod.Codes || distributionMethod == DistributionMethod.SpecificAddresses) {
                                let merkleTreeRes = await addMerkleTreeToIpfs(leaves);
                                badgeMsg.claims[0].uri = 'ipfs://' + merkleTreeRes.cid + '';
                            }

                            setNewBadgeMsg(badgeMsg);

                            setVisible(true);

                            setLoading(false);
                            setSuccess(true);
                        }}
                    >
                        Create Badge Collection!
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
                    <CreateTxMsgNewCollectionModal
                        visible={visible}
                        setVisible={setVisible}
                        txCosmosMsg={newBadgeMsg}
                    />
                </div>
            </Form.Provider >
        </div >
    );
}
