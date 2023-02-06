import React, { ReactNode, useEffect, useState } from 'react';
import { DEV_MODE, PRIMARY_TEXT } from '../../../constants';
import { BadgeMetadata, BitBadgeCollection, UserBalance } from '../../../bitbadges-api/types';
import { BadgeCard } from '../BadgeCard';
import { getBadgeCollection } from '../../../bitbadges-api/api';
import { ClaimDisplay } from '../../common/ClaimDisplay';
import MerkleTree from 'merkletreejs';
import { CreateTxMsgClaimBadgeModal } from '../../txModals/CreateTxMsgClaimBadge';
import { Empty } from 'antd';
import { getBlankBalance } from '../../../bitbadges-api/balances';

export function ClaimsTab({ badgeCollection, setBadgeCollection, balance }: {
    badgeCollection: BitBadgeCollection | undefined;
    setBadgeCollection: (badgeCollection: BitBadgeCollection) => void;
    balance: UserBalance | undefined;
}) {
    const [claimId, setClaimId] = useState<number>(0);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [code, setCode] = useState<string>("");


    const individualBadgeMetadata = badgeCollection?.badgeMetadata;
    const [display, setDisplay] = useState<ReactNode>(<>
        {individualBadgeMetadata?.map((metadata, idx) => {
            return <div key={idx}>
                <BadgeCard collection={badgeCollection ? badgeCollection : {} as BitBadgeCollection} metadata={metadata} id={idx} />
            </div>
        })}
    </>);

    let stringified = JSON.stringify(individualBadgeMetadata);

    useEffect(() => {
        async function updateDisplay(badgeCollection: BitBadgeCollection | undefined) {
            if (!badgeCollection) return;
            let numBadges = badgeCollection?.nextBadgeId;
            //TODO: should probably make it more scalable than this

            for (let i = 0; i < numBadges; i++) {
                if (individualBadgeMetadata && JSON.stringify(individualBadgeMetadata[i]) === JSON.stringify({} as BadgeMetadata)) {
                    await getBadgeCollection(badgeCollection.collectionId, badgeCollection, i)
                        .then(res => { if (res.collection) setBadgeCollection(res.collection) });
                }
            }

            setDisplay(<>
                {individualBadgeMetadata?.map((metadata, idx) => {
                    return <div key={idx}>
                        <BadgeCard
                            balance={balance}
                            collection={badgeCollection ? badgeCollection : {} as BitBadgeCollection} metadata={metadata} id={idx} />
                    </div>
                })}
            </>)
        }
        updateDisplay(badgeCollection);
    }, [badgeCollection, stringified, individualBadgeMetadata, setBadgeCollection, balance]);

    return (
        <div
            style={{
                color: PRIMARY_TEXT,
                display: 'flex',
                justifyContent: 'center',
            }}>
            {
                badgeCollection?.claims.map((claim, idx) => {
                    return <div key={idx}>
                        <ClaimDisplay
                            collection={badgeCollection}
                            setCollection={setBadgeCollection}
                            claim={claim}
                            claimId={idx}
                            openModal={(code) => {
                                setClaimId(idx)
                                setModalVisible(true);
                                setCode(code ? code : "");
                            }}
                        />

                        {DEV_MODE &&
                            <pre>
                                {JSON.stringify(claim, null, 2)}
                            </pre>}
                    </div>
                })
            }
            {
                badgeCollection?.claims.length === 0 &&
                <Empty
                    style={{ color: PRIMARY_TEXT }}
                    description="No claims found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            }
            <CreateTxMsgClaimBadgeModal
                badge={badgeCollection}
                setBadgeCollection={setBadgeCollection}
                claimId={claimId}
                balance={getBlankBalance()}
                visible={modalVisible}
                setVisible={setModalVisible}
                code={code}
            />
        </div >
    );
}

