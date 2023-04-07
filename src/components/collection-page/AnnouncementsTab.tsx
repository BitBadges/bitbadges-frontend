import { Avatar, Button, Divider, Empty, Input, Modal, Spin, Tooltip, Typography } from 'antd';
import { AnnouncementActivityItem, BitBadgeCollection, SupportedChain } from 'bitbadges-sdk';
import { useEffect, useState } from 'react';
import { PRIMARY_BLUE, PRIMARY_TEXT } from '../../constants';
import { addAnnouncement } from '../../bitbadges-api/api';
import { useChainContext } from '../../contexts/ChainContext';
import { AddressDisplay } from '../address/AddressDisplay';
import { useAccountsContext } from '../../contexts/AccountsContext';
import { useRouter } from 'next/router';
import { useCollectionsContext } from '../../contexts/CollectionsContext';
import InfiniteScroll from 'react-infinite-scroll-component';

export function AnnouncementsTab({ announcements, collection, hideCollection, fetchMore, hasMore }: {
    announcements: AnnouncementActivityItem[];
    collection?: BitBadgeCollection,
    hideCollection?: boolean,
    fetchMore: () => void,
    hasMore: boolean
}) {
    const chain = useChainContext();
    const accounts = useAccountsContext();
    const collections = useCollectionsContext();
    const router = useRouter();
    const [newAnnouncement, setNewAnnouncement] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        for (let i = 0; i <= announcements.length; i++) {
            const accountsToFetch: number[] = [];
            const collectionsToFetch: number[] = [];
            for (const announcement of announcements) {
                if (!accounts.cosmosAddressesByAccountNumbers[announcement.from]) {
                    accountsToFetch.push(announcement.from);
                }

                collectionsToFetch.push(announcement.collectionId);
            }
            if (accountsToFetch.length > 0) {
                accounts.fetchAccountsByNumber(accountsToFetch);
            }

            if (collectionsToFetch.length > 0) {
                collections.fetchCollections(collectionsToFetch);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [announcements])

    return (
        <>
            {collection && chain.accountNumber === collection.manager.accountNumber && chain.loggedIn && (<>
                <br />
                <Input.TextArea

                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="New Announcement (Max 2048 Characters)"
                    style={{ marginBottom: 16, backgroundColor: PRIMARY_BLUE, color: PRIMARY_TEXT }}
                />

                <Button
                    disabled={newAnnouncement.length > 2048}
                    type="primary"
                    loading={loading}
                    style={{ width: '100%' }}
                    onClick={async () => {
                        if (newAnnouncement.length === 0) return;
                        setLoading(true);
                        await addAnnouncement(newAnnouncement, collection.collectionId);
                        await collections.refreshCollection(collection.collectionId);
                        setNewAnnouncement('');
                        setLoading(false);
                    }}
                >
                    Send Announcement to All Owners
                </Button>
                <Divider />
            </>)}
            {announcements.length === 0 && <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No Announcements"
                style={{ color: PRIMARY_TEXT }}
            />}
            <InfiniteScroll
                dataLength={announcements.length}
                next={fetchMore}
                hasMore={hasMore}
                loader={<div>
                    <br />
                    <Spin size={'large'} />
                </div>}
                scrollThreshold="200px"
                endMessage={
                    <></>
                }
                style={{ width: '100%', overflow: 'hidden' }}
            >
                {announcements.map((announcement, index) => {
                    // if (index < currPageStart || index > currPageEnd) return <></>;

                    const collectionToDisplay = collections.collections[announcement.collectionId]?.collection;
                    return (
                        <div key={index} style={{ color: PRIMARY_TEXT, display: 'flex', width: '100%', flexDirection: 'column' }}>
                            <div style={{ color: PRIMARY_TEXT, display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                <div style={{ color: PRIMARY_TEXT, alignItems: 'center', flexDirection: 'column', textAlign: 'left' }}>
                                    {!hideCollection && collectionToDisplay &&
                                        <div style={{ display: 'flex', alignItems: 'center' }} >
                                            <Typography.Text strong style={{ color: PRIMARY_TEXT, fontSize: 24, textAlign: 'left', marginRight: 8 }}>Collection:</Typography.Text>

                                            <Tooltip color='black' title={"Collection ID: " + collectionToDisplay.collectionId} placement="bottom">
                                                <div className='link-button-nav' onClick={() => {
                                                    router.push('/collections/' + collectionToDisplay.collectionId)
                                                    Modal.destroyAll()
                                                }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>

                                                    <Avatar
                                                        src={collectionToDisplay.collectionMetadata?.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                                        size={40}
                                                        style={{
                                                            verticalAlign: 'middle',
                                                            border: '1px solid',
                                                            borderColor: collectionToDisplay.collectionMetadata?.color
                                                                ? collectionToDisplay.collectionMetadata?.color
                                                                : 'black',
                                                            margin: 4,
                                                        }}
                                                    /> {collectionToDisplay.collectionMetadata?.name}

                                                </div>
                                            </Tooltip>
                                        </div>}

                                    <div style={{ display: 'flex', alignItems: 'center' }} >
                                        <Typography.Text strong style={{ color: PRIMARY_TEXT, fontSize: 24, textAlign: 'left', marginRight: 8 }}>Manager:</Typography.Text>

                                        <AddressDisplay userInfo={accounts.accounts[accounts.cosmosAddressesByAccountNumbers[announcement.from]] || {
                                            address: '',
                                            cosmosAddress: '',
                                            accountNumber: announcement.from,
                                            chain: SupportedChain.UNKNOWN
                                        }}
                                            darkMode
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Typography.Text strong style={{ color: PRIMARY_TEXT, fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                                        {new Date(announcement.timestamp).toLocaleDateString() + ' '}
                                        {new Date(announcement.timestamp).toLocaleTimeString()}
                                    </Typography.Text>

                                </div>
                            </div>
                            <br />
                            <div style={{ color: PRIMARY_TEXT, display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                                <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 18, textAlign: 'left', marginRight: 8 }}>
                                    {announcement.announcement}
                                </Typography.Text>
                            </div>

                            <br />
                            <hr style={{ width: '100%', color: PRIMARY_TEXT }} />
                        </div>

                    )
                })}
            </InfiniteScroll>
        </>
    )
}
