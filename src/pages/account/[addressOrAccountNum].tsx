import { Divider, Layout } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getPortfolio } from '../../bitbadges-api/api';
import { isAddressValid } from '../../bitbadges-api/chains';
import { GetPortfolioResponse } from '../../bitbadges-api/routes';
import { BitBadgeCollection } from '../../bitbadges-api/types';
import { CollectionDisplay } from '../../components/collections/CollectionDisplay';
import { Tabs } from '../../components/navigation/Tabs';
import { AccountDisplay } from '../../components/portfolio-page/AccountDisplay';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import { ActivityTab } from '../../components/collection-page/ActivityTab';

const { Content } = Layout;

const tabInfo = [
    { key: 'collected', content: 'Collected', disabled: false },
    { key: 'managing', content: 'Managing', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false }
];

function CollectionPage() {
    const router = useRouter();
    const collections = useCollectionsContext();
    const accounts = useAccountsContext();
    const { addressOrAccountNum } = router.query;

    const [cosmosAddress, setCosmosAddress] = useState<string>('');
    const [portfolioInfo, setPortfolioInfo] = useState<GetPortfolioResponse>();
    const [tab, setTab] = useState('collected');

    const accountInfo = accounts.accounts[cosmosAddress];

    useEffect(() => {
        async function getPortfolioInfo() {
            //Check if addressOrAccountNum is an address or account number and fetch portfolio accordingly
            if (!addressOrAccountNum) return;

            let fetchedInfo;
            if (isAddressValid(addressOrAccountNum as string)) {
                fetchedInfo = await accounts.fetchAccounts([addressOrAccountNum as string]);
            } else {
                fetchedInfo = await accounts.fetchAccountsByNumber([parseInt(addressOrAccountNum as string)]);
            }
            let accountNum = fetchedInfo[0].accountNumber
            setCosmosAddress(fetchedInfo[0].cosmosAddress);

            if (accountNum) {
                //TODO: address redundancies between GetPortfolio repsonse and fetch collections
                const portfolioInfo = await getPortfolio(accountNum);
                console.log("portfolioInfo", portfolioInfo);
                if (!portfolioInfo) return;

                await collections.fetchCollections([...portfolioInfo.collected.map((collection: any) => collection.collectionId), ...portfolioInfo.managing.map((collection: any) => collection.collectionId), ...portfolioInfo.activity.map((collection: any) => collection.collectionId)]);

                setPortfolioInfo(portfolioInfo);
            }
        }
        getPortfolioInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addressOrAccountNum]);

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
                    {/* Overview and Tabs */}
                    {accountInfo && <AccountDisplay accountInfo={accountInfo} />}
                    <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
                    <br />

                    {/* Tab Content */}
                    {tab === 'collected' && (<>
                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {portfolioInfo?.collected.map((portfolioCollection: BitBadgeCollection) => {
                                const collection = collections.collections[portfolioCollection.collectionId];
                                const accountInfo = accounts.accounts[cosmosAddress];

                                return <CollectionDisplay
                                    key={portfolioCollection.collectionId}
                                    collection={collection}
                                    accountInfo={accountInfo}
                                />
                            })}
                        </div>
                    </>)}

                    {tab === 'managing' && (<>
                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {portfolioInfo?.managing.map((portfolioCollection: BitBadgeCollection) => {
                                const collection = collections.collections[portfolioCollection.collectionId];
                                const accountInfo = accounts.accounts[cosmosAddress];
                                return (
                                    <CollectionDisplay
                                        key={portfolioCollection.collectionId}
                                        collection={collection}
                                        accountInfo={accountInfo}
                                    />
                                )
                            })}
                        </div>
                    </>)}

                    {tab === 'actions' && (<></>)}

                    {tab === 'activity' && (
                        <ActivityTab
                            userActivity={portfolioInfo?.activity}
                            collection={{} as BitBadgeCollection}
                        />
                    )}

                    {tab === 'owners' && (<></>)}
                </div>
                {
                    DEV_MODE && (
                        <pre style={{ color: PRIMARY_TEXT }}>
                            PORTFOLIO INFO: {JSON.stringify(portfolioInfo, null, 2)}
                        </pre>
                    )
                }
                <Divider />
            </Content >
        </Layout >
    );
}

export default CollectionPage;
