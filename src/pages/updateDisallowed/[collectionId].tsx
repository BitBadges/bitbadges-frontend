import { Layout } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getBadgeCollection } from '../../bitbadges-api/api';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { UpdateMetadataTimeline } from '../../components/mint/UpdateMetadataTimeline';
import { DisconnectedWrapper } from '../../components/wrappers/DisconnectedWrapper';
import { RegisteredWrapper } from '../../components/wrappers/RegisterWrapper';
import { PRIMARY_BLUE, SECONDARY_BLUE } from '../../constants';
import { UpdateDisallowedTimeline } from '../../components/mint/UpdateDIsallowedTimeline';

const { Content } = Layout;

function UpdateDisallowedTransfers() {
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
            message='Please connect a wallet and sign in to access the Update Disallowed page.'
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
                                <div className="primary-text">Update Disallowed Transfers</div>
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
                                        <UpdateDisallowedTimeline
                                            collection={badgeCollection}
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

export default UpdateDisallowedTransfers;
