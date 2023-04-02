import { Divider, Layout } from 'antd';
import { BadgeCollection } from 'bitbadges-sdk';
import { useEffect, useState } from 'react';
import { getBrowseInfo } from '../bitbadges-api/api';
import { CollectionDisplay } from '../components/collections/CollectionDisplay';
import { Tabs } from '../components/navigation/Tabs';
import { PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../constants';
import { useCollectionsContext } from '../contexts/CollectionsContext';

const { Content } = Layout;

//TODO: paginations and parallelizations
//TODO: make this actually work

function BrowsePage() {
    const collections = useCollectionsContext();

    const [browseInfo, setBrowseInfo] = useState<{ collections: BadgeCollection[] }>();
    const [tab, setTab] = useState('featured');


    useEffect(() => {
        async function getCollections() {
            //TODO: Redundancies
            const browseInfo = await getBrowseInfo();
            if (!browseInfo) return;

            await collections.fetchCollections([...browseInfo.collections.map((collection) => collection.collectionId)]);

            setBrowseInfo(browseInfo);
        }
        getCollections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Layout>
            <Content
                style={{
                    background: `linear-gradient(0deg, ${SECONDARY_BLUE} 0,${PRIMARY_BLUE} 0%)`,
                    textAlign: 'center',
                    minHeight: '100vh',
                }}
            >
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
                    <Tabs
                        tab={tab}
                        setTab={setTab}
                        tabInfo={[
                            {
                                key: 'featured',
                                onClick: () => setTab('featured'),
                                content: 'Featured',
                            },
                            {
                                key: 'trending',
                                onClick: () => setTab('trending'),
                                content: 'Trending',
                            },
                            {
                                key: 'claimable',
                                onClick: () => setTab('claimable'),
                                content: 'Claimable',
                            },
                            {
                                key: 'newest',
                                onClick: () => setTab('newest'),
                                content: 'Newest',
                            },

                        ]}
                        theme='dark'
                        fullWidth

                    />
                    {tab === 'latest' && <div>
                        <h2 style={{ color: PRIMARY_TEXT }}>Featured</h2>


                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {browseInfo?.collections.map((portfolioCollection: BadgeCollection) => {
                                const collection = collections.collections[portfolioCollection.collectionId];

                                return <CollectionDisplay
                                    key={portfolioCollection.collectionId}
                                    collection={collection}
                                    showBadges={false}
                                />
                            })}
                        </div>
                    </div>}
                </div>

                <Divider />
            </Content >
        </Layout >
    );
}

export default BrowsePage;
