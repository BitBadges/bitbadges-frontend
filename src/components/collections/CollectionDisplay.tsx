import { Avatar, Typography } from "antd";
import { useRouter } from "next/router";
import { BitBadgeCollection, BitBadgesUserInfo } from "../../bitbadges-api/types";
import { PRIMARY_TEXT } from "../../constants";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";

export function CollectionDisplay({ collection, accountInfo, badgeOnlyView, showBadges }: { collection: BitBadgeCollection, accountInfo: BitBadgesUserInfo, badgeOnlyView?: boolean, showBadges?: boolean }) {
    const router = useRouter();

    if (!collection) return <></>;

    return <div style={{ width: 350, margin: 10, display: 'flex' }}>
        {showBadges ?
            <InformationDisplayCard
                title={<>
                    <div className='link-button-nav' onClick={() => {
                        router.push('/collections/' + collection.collectionId)
                    }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Avatar
                            src={collection.collectionMetadata?.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                            size={40}
                            style={{
                                verticalAlign: 'middle',
                                border: '1px solid',
                                borderColor: collection.collectionMetadata?.color
                                    ? collection.collectionMetadata?.color
                                    : 'black',
                                margin: 4,
                            }}
                        /> {collection.collectionMetadata?.name}
                    </div>
                </>}
            >
                <div key={collection.collectionId} style={{ color: PRIMARY_TEXT }}>
                    <BalanceDisplay
                        message='Collected Badges'
                        collection={collection}
                        balance={collection.balances[accountInfo?.accountNumber || 0]}
                    />
                </div>
            </InformationDisplayCard>
            :
            <InformationDisplayCard
                title={<>
                    <div className='link-button-nav' onClick={() => {
                        router.push('/collections/' + collection.collectionId)
                    }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {collection.collectionMetadata?.name}
                    </div>
                </>}
            >
                <Avatar
                    src={collection.collectionMetadata?.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                    size={80}
                    style={{
                        verticalAlign: 'middle',
                        border: '1px solid',
                        borderColor: collection.collectionMetadata?.color
                            ? collection.collectionMetadata?.color
                            : 'black',
                        margin: 4,
                    }}
                />
                <br />
                <Typography.Text style={{ color: PRIMARY_TEXT, fontSize: 16 }} strong>
                    ID: {collection.collectionId}
                </Typography.Text>
                <br />

            </InformationDisplayCard>
        }
    </div>
}