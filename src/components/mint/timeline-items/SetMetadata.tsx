import { InputNumber, } from 'antd';
import React, { useState } from 'react';

import { BadgeMetadata } from '../../../bitbadges-api/types';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';
import { FormTimeline } from '../form/FormTimeline';
import { FullMetadataForm } from '../form/FullMetadataForm';
import { MetadataAddMethod } from '../MintTimeline';
import { SwitchForm } from '../form/SwitchForm';
import { SubassetSupply } from '../form/SubassetSupply';

import { Typography, Form, Button } from 'antd';
import { SECONDARY_TEXT } from '../../../constants';
import { addToIpfs } from '../../../chain/backend_connectors';
import { CheckCircleFilled } from '@ant-design/icons';

import { saveAs } from 'file-saver';

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
}: {
    setCurrStepNumber: (stepNumber: number) => void;
    newBadgeMsg: MessageMsgNewBadge;
    setNewBadgeMsg: (badge: MessageMsgNewBadge) => void;
    collectionMetadata: BadgeMetadata;
    setCollectionMetadata: (metadata: BadgeMetadata) => void;
    individualBadgeMetadata: BadgeMetadata[];
    setIndividualBadgeMetadata: (metadata: BadgeMetadata[]) => void;
    addMethod: MetadataAddMethod;
    setAddMethod: (method: MetadataAddMethod) => void;
}) {
    const [id, setId] = useState(0);

    const [stepNum, setStepNum] = useState(1);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    console.log("default subasset supply", newBadgeMsg.defaultSubassetSupply);
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
                            || (addMethod === MetadataAddMethod.UploadUrl && !(newBadgeMsg.uri.insertIdIdx && newBadgeMsg.uri.insertIdIdx >= 0))
                    },
                    {
                        //TODO: add semi-fungible and random assortments of supplys / amounts support
                        title: 'Fungible or Non-Fungible?',
                        // description: `Will each individual badge have unique characteristics or will they all be identical?`,
                        description: '',
                        node: <SwitchForm
                            selectedTitle={"Non-Fungible"}
                            unselectedTitle={"Fungible"}
                            onSwitchChange={(fungible, nonFungible) => {
                                if (fungible) {
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        defaultSubassetSupply: 0,
                                    })
                                } else if (nonFungible) {
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        defaultSubassetSupply: 1
                                    });
                                }
                            }}
                            isOptionOneSelected={newBadgeMsg.defaultSubassetSupply !== -1 && newBadgeMsg.defaultSubassetSupply != 1}
                            isOptionTwoSelected={newBadgeMsg.defaultSubassetSupply !== -1 && newBadgeMsg.defaultSubassetSupply == 1}
                            selectedMessage={'Every minted badge will have its own unique metadata and characteristics.'}
                            unselectedMessage={`Every minted badge will have the same metadata and characteristics.`}
                        // helperMessage={`If you only intend on creating one badge, this answer will not matter.`}
                        />,
                        disabled: newBadgeMsg.defaultSubassetSupply == undefined //This will change as well
                    },
                    {
                        title: `How Many ${newBadgeMsg.defaultSubassetSupply === 0 ? 'Fungible' : 'Non-Fungible'} Badges To Create?`,
                        description: 'What do you want the total supply of this badge to be? This can not be changed later.',
                        node: <SubassetSupply newBadgeMsg={newBadgeMsg} setNewBadgeMsg={setNewBadgeMsg} />,
                        disabled: newBadgeMsg.subassetSupplysAndAmounts?.length == 0 || newBadgeMsg.subassetSupplysAndAmounts?.length == 0
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
                                    setNewBadgeMsg({
                                        ...newBadgeMsg,
                                        uri: {
                                            ...newBadgeMsg.uri,
                                            uri: res.cid + '/collection',
                                            decodeScheme: 0,
                                            scheme: 3,
                                            idxRangeToRemove: {
                                                start: uri.indexOf('collection'),
                                                end: uri.length,
                                            },
                                            insertSubassetBytesIdx: 0,
                                            bytesToInsert: '',
                                            insertIdIdx: uri.indexOf('collection'),
                                        },
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
