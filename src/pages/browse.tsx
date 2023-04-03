import { Divider, Layout } from 'antd';
import { BadgeCollection } from 'bitbadges-sdk';
import { useEffect, useState } from 'react';
import { getBrowseInfo } from '../bitbadges-api/api';
import { CollectionDisplay } from '../components/collections/CollectionDisplay';
import { Tabs } from '../components/navigation/Tabs';
import { PRIMARY_BLUE, SECONDARY_BLUE } from '../constants';
import { useCollectionsContext } from '../contexts/CollectionsContext';

const { Content } = Layout;

//TODO: paginations and parallelizations
//TODO: make this actually work

function BrowsePage() {
    const collections = useCollectionsContext();

    const [browseInfo, setBrowseInfo] = useState<{ [category: string]: BadgeCollection[] }>();
    const [tab, setTab] = useState('featured');


    useEffect(() => {
        async function getCollections() {
            //TODO: Redundancies
            const browseInfo = await getBrowseInfo();
            if (!browseInfo) return;

            const collectionsToFetch = [];
            for (const category of Object.keys(browseInfo)) {
                for (const collection of browseInfo[category]) {
                    collectionsToFetch.push(collection.collectionId);
                }
            }

            await collections.fetchCollections(collectionsToFetch);

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
                        tabInfo={browseInfo ? Object.keys(browseInfo).map(category => {
                            return {
                                key: category,
                                onClick: () => setTab(category),
                                //uppercase first letter
                                content: category.charAt(0).toUpperCase() + category.slice(1),
                            }
                        }) : []}
                        theme='dark'
                        fullWidth
                    />

                    <div>
                        <br />
                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {browseInfo && browseInfo[tab]?.map((portfolioCollection: BadgeCollection) => {
                                const collection = collections.collections[portfolioCollection.collectionId];

                                return <>
                                    <CollectionDisplay
                                        key={portfolioCollection.collectionId}
                                        collection={collection}
                                    />
                                </>
                            })}
                        </div>
                    </div>
                </div>

                <Divider />
            </Content >
        </Layout >
    );
}

export default BrowsePage;
