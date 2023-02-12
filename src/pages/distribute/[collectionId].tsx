import React, { useEffect, useState } from 'react';
import { Layout } from 'antd';
import { DEV_MODE, PRIMARY_BLUE, SECONDARY_BLUE } from '../../constants';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { MintAndDistributeTimeline } from '../../components/mint/DistributeBadgeTimeline';
import { getBadgeCollection } from '../../bitbadges-api/api';
import { useRouter } from 'next/router';
import { BitBadgeCollection } from '../../bitbadges-api/types';

const { Content } = Layout;

function Distribute() {
    const router = useRouter()

    const { collectionId } = router.query;
    const collectionIdNumber = Number(collectionId);

    const [badgeCollection, setBadgeCollection] = useState<BitBadgeCollection>();

    // Get badge collection information
    useEffect(() => {
        async function getBadgeInformation() {
            const res = await getBadgeCollection(collectionIdNumber);
            setBadgeCollection(res.collection);
        }
        getBadgeInformation();
    }, [collectionIdNumber]);

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
