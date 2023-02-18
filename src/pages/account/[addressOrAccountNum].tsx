import { Avatar, Divider, Layout, Tooltip } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getPortfolio, getAccountInformation, getAccountInformationByAccountNumber } from '../../bitbadges-api/api';
import { BitBadgesUserInfo } from '../../bitbadges-api/types';
import { useChainContext } from '../../chain/ChainContext';
import { BalanceDisplay } from '../../components/common/BalanceDisplay';
import { InformationDisplayCard } from '../../components/common/InformationDisplayCard';
import { Tabs } from '../../components/common/Tabs';
import { DEV_MODE, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_BLUE } from '../../constants';
import { COSMOS, ethToCosmos } from 'bitbadgesjs-address-converter';
import { ethers } from 'ethers';
import { AccountDisplay } from '../../components/common/AccountDisplay';
import { LinkOutlined } from '@ant-design/icons';
const { Content } = Layout;

const tabInfo = [
    { key: 'collected', content: 'Collected', disabled: false },
    { key: 'managing', content: 'Managing', disabled: false },
    { key: 'activity', content: 'Activity', disabled: false },
    // { key: 'actions', content: 'Actions', disabled: false },
];

function CollectionPage() {
    const router = useRouter()
    const chain = useChainContext();

    const { addressOrAccountNum } = router.query;

    const [accountInfo, setAccountInfo] = useState<BitBadgesUserInfo>();
    const [userInfo, setUserInfo] = useState<any>();

    useEffect(() => {
        async function getUserInfo() {
            if (!addressOrAccountNum) return;

            let accountNum = Number(addressOrAccountNum);
            let bech32address = ''
            try {
                COSMOS.decoder(addressOrAccountNum as string);
                bech32address = addressOrAccountNum as string;
            } catch (e) {

            }
            if (ethers.utils.isAddress(addressOrAccountNum as string)) {
                bech32address = ethToCosmos(addressOrAccountNum as string);
            }

            let fetchedInfo;
            if (bech32address !== '') {
                console.log(bech32address);
                fetchedInfo = await getAccountInformation(bech32address as string);
                if (!fetchedInfo) return;
                accountNum = fetchedInfo?.account_number;
            } else {
                fetchedInfo = await getAccountInformationByAccountNumber(accountNum);
            }

            setAccountInfo({
                accountNumber: fetchedInfo?.account_number,
                address: fetchedInfo?.address,
                cosmosAddress: fetchedInfo?.cosmosAddress,
                chain: fetchedInfo?.chain
            });


            console.log(accountNum);

            const portfolioInfo = await getPortfolio(accountNum);
            if (!portfolioInfo) return;
            setUserInfo(portfolioInfo);

            //TODO: get all profile info, balances here
        }
        getUserInfo();
    }, [addressOrAccountNum]);

    const [tab, setTab] = useState('collected');


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
                    {accountInfo &&
                        <AccountDisplay accountInfo={accountInfo} />}
                    <Tabs tabInfo={tabInfo} tab={tab} setTab={setTab} theme="dark" fullWidth />
                    <br />

                    {/* Tab Content */}
                    {tab === 'collected' && (<>
                        <div style={{ display: 'flex', justifyContent: 'center', }}>
                            {userInfo?.collected.map((collection: any) => {
                                return (
                                    <div key={collection.collectionId} style={{ width: 400, margin: 10, display: 'flex' }}>
                                        <InformationDisplayCard
                                            title={<>
                                                <Avatar
                                                    src={collection.collectionMetadata?.image}
                                                    size={50}
                                                    style={{
                                                        verticalAlign: 'middle',
                                                        border: '3px solid',
                                                        borderColor: collection.collectionMetadata?.color
                                                            ? collection.collectionMetadata?.color
                                                            : 'black',
                                                        margin: 4,
                                                    }}
                                                />
                                                <br />
                                                {collection.collectionMetadata?.name}

                                                <a style={{ marginLeft: 4 }}>
                                                    <Tooltip title="Go to collection page">
                                                        <LinkOutlined
                                                            onClick={() => {
                                                                router.push('/collections/' + collection.collectionId)
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </a>
                                            </>}
                                        >
                                            <div key={collection.collectionId} style={{ color: PRIMARY_TEXT }}>
                                                <BalanceDisplay
                                                    message='Collected Badges'
                                                    collection={collection}
                                                    setCollection={() => { }}
                                                    balance={collection.balances[accountInfo?.accountNumber || 0]} />
                                            </div>
                                        </InformationDisplayCard>
                                    </div>
                                )
                            })}
                        </div>
                    </>)}

                    {tab === 'managing' && (<>
                        <div style={{ display: 'flex', justifyContent: 'center', }}>
                            {userInfo?.managing.map((collection: any) => {
                                return (
                                    <div key={collection.collectionId} style={{ width: 400, margin: 10, display: 'flex' }}>
                                        <InformationDisplayCard
                                            title={<>
                                                <Avatar
                                                    src={collection.collectionMetadata?.image}
                                                    size={50}
                                                    style={{
                                                        verticalAlign: 'middle',
                                                        border: '3px solid',
                                                        borderColor: collection.collectionMetadata?.color
                                                            ? collection.collectionMetadata?.color
                                                            : 'black',
                                                        margin: 4,
                                                    }}
                                                />
                                                <br />
                                                {collection.collectionMetadata?.name}
                                                <a style={{ marginLeft: 4 }}>
                                                    <Tooltip title="Go to collection page">
                                                        <LinkOutlined
                                                            onClick={() => {
                                                                router.push('/collections/' + collection.collectionId)
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </a>
                                            </>}
                                        >
                                            <div key={collection.collectionId} style={{ color: PRIMARY_TEXT }}>
                                                {collection.collectionMetadata?.description ?
                                                    collection.collectionMetadata?.description
                                                    : 'No description provided'
                                                }
                                            </div>
                                            <br />
                                        </InformationDisplayCard>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                    )}

                    {tab === 'actions' && (<></>
                    )}

                    {tab === 'activity' && (<></>
                    )}

                    {tab === 'owners' && (<></>
                    )}
                </div>
                {
                    DEV_MODE && (
                        <pre style={{ color: PRIMARY_TEXT }}>
                            PORTFOLIO INFO: {JSON.stringify(userInfo, null, 2)}
                        </pre>
                    )
                }
                <Divider />
            </Content >
        </Layout >
    );
}

export default CollectionPage;
