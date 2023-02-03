import { MintCollectionTimeline } from '../../components/mint/mint-collection/MintCollectionTimeline';
import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { DEV_MODE, PRIMARY_BLUE, SECONDARY_BLUE } from '../../constants';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { MintAndDistribute } from '../../components/mint/distribute-badges/DistributeTimeline';
import { MintAndDistributeTimeline } from '../../components/mint/distribute-badges/DistributeBadgeTimeline';
import { getBadgeCollection } from '../../bitbadges-api/api';
import { useRouter } from 'next/router';
import { useChainContext } from '../../chain/ChainContext';
import { BadgeMetadata, BitBadgeCollection } from '../../bitbadges-api/types';

const { Content } = Layout;

function Distribute() {
    const router = useRouter()
    const chain = useChainContext();

    const { collectionId } = router.query;

    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection>();


    // Get badge collection information
    useEffect(() => {
        async function getBadgeInformation() {
            // if (!badgeCollection || !setBadgeCollection) return;
            let collectionIdNumber = Number(collectionId);
            let individualBadgeMetadata = badgeCollection?.badgeMetadata;
            if (isNaN(collectionIdNumber) || collectionIdNumber < 0) return;

            if (!badgeCollection) {
                try {
                    const res = await getBadgeCollection(collectionIdNumber);
                    setBadgeCollection(res.collection);
                } catch (e) {
                    if (DEV_MODE) console.error("Error getting badge collection: ", e);
                }
            }

            let numBadges = badgeCollection?.nextBadgeId ? badgeCollection?.nextBadgeId : 0;
            //TODO: should probably make it more scalable than this
            for (let i = 0; i < numBadges; i++) {
                console.log(i);
                if (badgeCollection && individualBadgeMetadata && JSON.stringify(individualBadgeMetadata[i]) === JSON.stringify({} as BadgeMetadata)) {
                    console.log(i);
                    await getBadgeCollection(badgeCollection.collectionId, badgeCollection, i)
                        .then(res => {
                            if (res.collection) {
                                console.log(res.collection);
                                setBadgeCollection(res.collection)
                            }
                        });
                }
            }
        }
        getBadgeInformation();
    }, [collectionId, badgeCollection, setBadgeCollection]);

    return (
        <DisconnectedWrapper
            message='Please connect a wallet and sign in to access the Mint page.'
            node={
                <RegisteredWrapper
                    message='Please register to access the Mint page.'
                    node={
                        <Layout>
                            <Content
                                style={{
                                    background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0,${PRIMARY_BLUE} 0%)`,
                                    textAlign: 'center',
                                    minHeight: '100vh',
                                }}
                            >
                                <div className="primary-text">Distribute</div>
                                <div
                                    style={{
                                        marginLeft: '10vw',
                                        marginRight: '10vw',
                                        paddingLeft: '2vw',
                                        paddingRight: '2vw',
                                        paddingTop: '20px',
                                        background: PRIMARY_BLUE,
                                    }}
                                >
                                    {badgeCollection &&
                                        <MintAndDistributeTimeline
                                            collection={badgeCollection ? badgeCollection : {} as BitBadgeCollection}
                                            setCollection={setBadgeCollection}
                                        />
                                    }
                                </div>
                            </Content>
                        </Layout>
                    }
                />
            }
        />
    );
}

export default Distribute;
