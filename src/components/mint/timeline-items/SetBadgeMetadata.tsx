import { InputNumber, } from 'antd';
import React, { useState } from 'react';

import { BadgeMetadata } from '../../../bitbadges-api/types';
import { MessageMsgNewBadge } from 'bitbadgesjs-transactions';
import { BadgeSubBadgesTab } from '../../badges/tabs/BadgePageSubBadgesTab';
import { FormTimeline } from '../form/FormTimeline';
import { FullMetadataForm } from '../form/FullMetadataForm';

export function SetIndividualBadgeMetadata({
    setCurrStepNumber,
    newBadgeMsg,
    setNewBadgeMsg,
    individualBadgeMetadata,
    setIndividualBadgeMetadata,
}: {
    setCurrStepNumber: (stepNumber: number) => void;
    newBadgeMsg: MessageMsgNewBadge;
    setNewBadgeMsg: (badge: MessageMsgNewBadge) => void;
    individualBadgeMetadata: BadgeMetadata[];
    setIndividualBadgeMetadata: (metadata: BadgeMetadata[]) => void;
}) {
    const [id, setId] = useState(0);

    return (
        <>
            <FormTimeline
                currStepNumber={2}
                items={[
                    {
                        title: 'Set Individual Badge Metadata',
                        description: <>Currently Setting Metadata for Badge ID: <InputNumber min={0} max={individualBadgeMetadata.length - 1} value={id} onChange={(e) => setId(e)} /></>,
                        node: <FullMetadataForm
                            id={id}
                            metadata={individualBadgeMetadata}
                            setMetadata={setIndividualBadgeMetadata as any}
                        />,
                        disabled: !(individualBadgeMetadata[id]?.name)
                    },
                ]}
                setCurrStepNumber={setCurrStepNumber}
            />
            {/* <BadgeSubBadgesTab
                setBadgeCollection={individualBadgeMetadata}
                badgeCollection={undefined}
            /> */}
        </>
    );
}
