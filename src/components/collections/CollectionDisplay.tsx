import { Avatar, Modal, Tooltip } from "antd";
import { BitBadgeCollection, getIdRangesForAllBadgeIdsInCollection } from "bitbadges-sdk";
import { useRouter } from "next/router";
import { PRIMARY_TEXT } from '../../constants';
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";

export function CollectionDisplay({ collection }: { collection: BitBadgeCollection }) {
    const router = useRouter();

    if (!collection) return <></>;

    return <div style={{ width: 350, margin: 10, display: 'flex' }}>
        <InformationDisplayCard
            title={<>
                <Tooltip color='black' title={"Collection ID: " + collection.collectionId} placement="bottom">
                    <div className='link-button-nav' onClick={() => {
                        router.push('/collections/' + collection.collectionId)
                        Modal.destroyAll()
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
                </Tooltip>
            </>}
        >
            <div key={collection.collectionId} style={{ color: PRIMARY_TEXT }}>
                <BadgeAvatarDisplay
                    collection={collection}
                    userBalance={{
                        balances: collection.maxSupplys,
                        approvals: []
                    }}
                    badgeIds={getIdRangesForAllBadgeIdsInCollection(collection)}
                />
            </div>
        </InformationDisplayCard>
    </div>
}