import { Avatar } from "antd";
import { useRouter } from "next/router";
import { BitBadgeCollection, BitBadgesUserInfo } from "../../bitbadges-api/types";
import { PRIMARY_TEXT } from "../../constants";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";

export function CollectionDisplay({ collection, accountInfo, badgeOnlyView }: { collection: BitBadgeCollection, accountInfo: BitBadgesUserInfo, badgeOnlyView?: boolean }) {
    const router = useRouter();
    
    if (!collection) return <></>;

    return <div style={{ width: 350, margin: 10, display: 'flex' }}>
        <InformationDisplayCard
            title={<>
                <div className='link-button-nav' onClick={() => {
                    router.push('/collections/' + collection.collectionId)
                }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Avatar
                        src={collection.collectionMetadata?.image}
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
    </div>
}