import { InputNumber, } from 'antd';
import React, { useState } from 'react';

import { BadgeMetadata } from '../../../bitbadges-api/types';
import { MessageMsgNewCollection } from 'bitbadgesjs-transactions';
import { FormTimeline } from '../form/FormTimeline';
import { FullMetadataForm } from '../form/FullMetadataForm';
import { MetadataAddMethod } from '../MintTimeline';
import { SwitchForm } from '../form/SwitchForm';
import { SubassetSupply } from '../form/SubassetSupply';

import { Typography, Form, Button } from 'antd';
import { SECONDARY_TEXT } from '../../../constants';
import { addMerkleTreeToIpfs, addToIpfs } from '../../../chain/backend_connectors';
import { CheckCircleFilled } from '@ant-design/icons';

import { MerkleTree } from 'merkletreejs';
import SHA256 from 'crypto-js/sha256';



import { saveAs } from 'file-saver';

const CryptoJS = require("crypto-js");

function downloadJson(json: object, filename: string) {
    const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json'
    });
    saveAs(blob, filename);
}

export function SetMetadata({
    setCurrStepNumber,
    newBadgeMsg,
    setNewBadgeMsg,
    collectionMetadata,
    setCollectionMetadata,
    individualBadgeMetadata,
    setIndividualBadgeMetadata,
    addMethod,
    setAddMethod,
    leaves,
    setLeaves,

}: {
    setCurrStepNumber: (stepNumber: number) => void;
    newBadgeMsg: MessageMsgNewCollection;
    setNewBadgeMsg: (badge: MessageMsgNewCollection) => void;
    collectionMetadata: BadgeMetadata;
    setCollectionMetadata: (metadata: BadgeMetadata) => void;
    individualBadgeMetadata: BadgeMetadata[];
    setIndividualBadgeMetadata: (metadata: BadgeMetadata[]) => void;
    addMethod: MetadataAddMethod;
    setAddMethod: (method: MetadataAddMethod) => void;
    leaves: string[];
    setLeaves: (leaves: string[]) => void;
}) {
    const [id, setId] = useState(0);

    const [stepNum, setStepNum] = useState(1);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);


    return (
        <>
            <FormTimeline
                currStepNumber={2}
                items={[
                    {
                        title: 'Set the Collection Metadata',
                        description: `Individual badges will be created later.`,
                        node: <FullMetadataForm
                            addMethod={addMethod}
                            setAddMethod={setAddMethod}
                            metadata={collectionMetadata}
                            setMetadata={setCollectionMetadata as any}
                            setNewBadgeMsg={setNewBadgeMsg}
                            newBadgeMsg={newBadgeMsg}
                        />,
                        disabled: (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
                            || (addMethod === MetadataAddMethod.UploadUrl && !(newBadgeMsg.badgeUri.indexOf('{id}') == -1))
                    },
                    addMethod === MetadataAddMethod.Manual ?
                        {
                            title: 'Set Individual Badge Metadata',
                            description: <>Currently Setting Metadata for Badge ID: <InputNumber min={0} max={individualBadgeMetadata.length - 1} value={id} onChange={(e) => setId(e)} /></>,
                            node: <FullMetadataForm
                                id={id}
                                metadata={individualBadgeMetadata}
                                setMetadata={setIndividualBadgeMetadata as any}
                                addMethod={addMethod}
                                setAddMethod={setAddMethod}
                                setNewBadgeMsg={setNewBadgeMsg}
                                newBadgeMsg={newBadgeMsg}
                                hideAddMethod
                            />,
                            disabled: !(individualBadgeMetadata[id]?.name)
                        } : {
                            title: 'Set Individual Badge Metadata',
                            description: <>No action is required here because you previously selected to add metadata using the following option: {addMethod}</>,
                            node: <>
                                {/* //TODO: */}
                            </>,
                            // disabled: !(individualBadgeMetadata[id]?.name) //TODO:
                        },
                    {
                        title: 'Upload',
                        description: <> We will now upload your metadata to our permanent file storage.
                            For backup purposes, we recommend you save a local copy as well (
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
                                    }, `metadata-${collectionMetadata.name}-${dateString}-${timeString}.json`);
                                }}
                                className="opacity link-button"
                            >
                                click here to download
                            </button>). </>,
                        node: <div
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
                                loading={loading}
                                style={{ width: '90%' }}
                                onClick={async () => {
                                    setLoading(true);
                                    setSuccess(false);
                                    let res = await addToIpfs(collectionMetadata, individualBadgeMetadata);

                                    let uri = 'ipfs://' + res.cid + '/collection';
                                    let badgeUri = 'ipfs://' + res.cid + '/{id}';

                                    let merkleTreeRes = await addMerkleTreeToIpfs(leaves);

                                    let merkleTreeUri = 'ipfs://' + merkleTreeRes.cid + '';

                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        collectionUri: uri,
                                        badgeUri: badgeUri,
                                        claims: [
                                            {
                                                ...newBadgeMsg.claims[0],
                                                uri: merkleTreeUri,
                                            },
                                        ],
                                    });

                                    setSuccess(true);
                                    setLoading(false);
                                }}
                                disabled={success}
                            >
                                Upload Metadata {success && <CheckCircleFilled
                                    style={{
                                        color: 'green',
                                    }}
                                />}
                            </Button>
                        </div>
                    },
                ]}
                setCurrStepNumber={setCurrStepNumber}
            />
            {/* {
                individualBadgeMetadata.map((metadata, index) => {
                    return (
                        <BadgeCard
                            key={index}
                            metadata={metadata}
                            id={index}
                            collection={{} as BitBadgeCollection}
                        />
                    );
                }
                )
            } */}
        </>
    );
}
