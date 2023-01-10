import { InputNumber, } from 'antd';
import React, { useState } from 'react';

import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../../bitbadges-api/types';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';
import { FormTimeline } from '../form/FormTimeline';
import { FullMetadataForm } from '../form/FullMetadataForm';
import { BadgeCard } from '../../badges/BadgeCard';
import { MetadataAddMethod } from '../MintTimeline';

export function SetIndividualBadgeMetadata({
    setCurrStepNumber,
    newBadgeMsg,
    setNewBadgeMsg,
    individualBadgeMetadata,
    setIndividualBadgeMetadata,
    addMethod,
    setAddMethod,
}: {
    setCurrStepNumber: (stepNumber: number) => void;
    newBadgeMsg: MessageMsgNewBadge;
    setNewBadgeMsg: (badge: MessageMsgNewBadge) => void;
    individualBadgeMetadata: BadgeMetadata[];
    setIndividualBadgeMetadata: (metadata: BadgeMetadata[]) => void;
    addMethod: MetadataAddMethod;
    setAddMethod: (method: MetadataAddMethod) => void;
}) {
    const [id, setId] = useState(0);

    return (
        <>
            <FormTimeline
                currStepNumber={2}
                items={[
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
                                hideAddMethod
                            />,
                            disabled: !(individualBadgeMetadata[id]?.name)
                        } : {
                            title: 'Set Individual Badge Metadata',
                            description: <>You previously selected to add metadata using the following option: {addMethod}</>,
                            node: <>
                                {/* //TODO: */}
                            </>,
                            // disabled: !(individualBadgeMetadata[id]?.name) //TODO:
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
