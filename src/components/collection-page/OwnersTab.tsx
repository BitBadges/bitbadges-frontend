import { Empty, Pagination, Spin } from 'antd';
import { BitBadgeCollection, getSupplyByBadgeId } from 'bitbadgesjs-utils';
import { useEffect, useState } from 'react';
import { getBadgeOwners } from '../../bitbadges-api/api';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { InformationDisplayCard } from '../display/InformationDisplayCard';
import { getPageDetails } from '../../utils/pagination';
import { useChainContext } from '../../contexts/ChainContext';
import { BlockinDisplay } from '../blockin/BlockinDisplay';

export function OwnersTab({ collection, badgeId }: {
    collection: BitBadgeCollection | undefined;
    badgeId: number
}) {
    const accounts = useAccountsContext();
    const chain = useChainContext();
    const isPreview = collection?.collectionId === 0;

    const [badgeOwners, setBadgeOwners] = useState<number[]>([]);
    const [balances, setBalances] = useState<any>({});
    const [loaded, setLoaded] = useState(false);

    const [currPage, setCurrPage] = useState<number>(1);
    const PAGE_SIZE = 10;
    const minId = 1;
    const maxId = badgeOwners.length;

    const currPageDetails = getPageDetails(currPage, PAGE_SIZE, minId, maxId);
    const pageStartId = currPageDetails.start;
    const pageEndId = currPageDetails.end;


    useEffect(() => {
        const accountsToFetch: number[] = [];
        for (let i = pageStartId - 1; i < pageEndId; i++) {
            accountsToFetch.push(badgeOwners[i]);
        }

        accounts.fetchAccountsByNumber(accountsToFetch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageStartId, pageEndId, currPage]);

    useEffect(() => {
        async function getOwners() {
            if (collection) {
                if (collection.collectionId === 0) {
                    //Is preview
                    setLoaded(true);
                }
                const ownersRes = await getBadgeOwners(collection?.collectionId, badgeId)
                const badgeOwners = ownersRes.owners;

                setBadgeOwners(badgeOwners);
                setBalances(ownersRes.balances);
                setLoaded(true);
            }
        }
        getOwners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (

        <InformationDisplayCard
            title="Balances"
        >
            {loaded ?
                <div
                    style={{
                        color: PRIMARY_TEXT,
                        justifyContent: 'center',
                        alignItems: 'center',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                    <div style={{ width: '100%' }}>
                        <h2 style={{ color: PRIMARY_TEXT }}>You</h2>
                        {chain.connected && chain.accountNumber ?
                            <div className='flex-between' style={{ color: PRIMARY_TEXT, width: '100%', display: 'flex', justifyContent: 'space-between', padding: 10 }}>
                                <div>
                                    <AddressDisplay
                                        userInfo={{
                                            name: chain.name,
                                            avatar: chain.avatar,
                                            address: chain.address,
                                            cosmosAddress: chain.cosmosAddress,
                                            chain: chain.chain,
                                            accountNumber: chain.accountNumber,
                                            github: chain.github,
                                            discord: chain.discord,
                                            twitter: chain.twitter,
                                            telegram: chain.telegram,
                                        }}
                                        fontColor={PRIMARY_TEXT} />
                                </div>
                                <div style={{ fontSize: 20 }}>
                                    x{getSupplyByBadgeId(badgeId, balances[chain.accountNumber]?.balances || [])}
                                </div>
                            </div> : <BlockinDisplay hideLogo />
                        }
                        <hr />
                    </div>

                    <h2 style={{ color: PRIMARY_TEXT }}>All Owners</h2>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 4,

                    }} >
                        <Pagination
                            style={{ background: PRIMARY_BLUE, color: PRIMARY_TEXT }}
                            current={currPage}
                            total={Number(maxId) - Number(minId)}
                            pageSize={PAGE_SIZE}
                            onChange={(page) => {
                                setCurrPage(page);
                            }}
                            hideOnSinglePage
                            showSizeChanger={false}
                        />
                    </div>


                    {badgeOwners?.map((owner, idx) => {
                        if (idx < pageStartId - 1 || idx > pageEndId - 1) {
                            return <></>
                        } else {
                            return <div key={idx} className='flex-between' style={{ color: PRIMARY_TEXT, width: '100%', display: 'flex', justifyContent: 'space-between', padding: 10 }}>
                                <div>
                                    {!accounts.accounts[accounts.cosmosAddressesByAccountNumbers[owner]] ?
                                        <Spin size={'small'} />
                                        :
                                        <AddressDisplay
                                            userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[owner]]}
                                            fontColor={PRIMARY_TEXT} />}
                                </div>
                                <div style={{ fontSize: 20 }}>
                                    x{getSupplyByBadgeId(badgeId, balances[owner].balances)}
                                </div>
                            </div>
                        }
                    })}
                    {badgeOwners.length === 0 && <Empty
                        description={isPreview ? "This feature is not supported for previews." : "No owners found for this badge."}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ color: PRIMARY_TEXT }}
                    />}
                </div>
                : <div>
                    <br />
                    <Spin size={'large'} />
                    <br />
                </div>
            }
        </InformationDisplayCard>
    );
}
