import { Avatar, Modal, Tooltip } from "antd";
import { BitBadgeCollection, getIdRangesForAllBadgeIdsInCollection } from "bitbadgesjs-utils";
import { useRouter } from "next/router";
import { PRIMARY_TEXT } from '../../constants';
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";

export function CollectionDisplay({ collection }: { collection: BitBadgeCollection }) {
  const router = useRouter();

  if (!collection) return <></>;

  return <div style={{ width: 265, margin: 4, marginBottom: 15, display: 'flex' }}>
    <InformationDisplayCard
      noBorder
      title={<>
        <Tooltip color='black' title={"Collection ID: " + collection.collectionId} placement="bottom">
          <div className='link-button-nav' onClick={() => {
            router.push('/collections/' + collection.collectionId)
            Modal.destroyAll()
          }} style={{ alignItems: 'center', justifyContent: 'center' }}>

            <Avatar
              src={collection.collectionMetadata?.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
              size={150}
              style={{
                verticalAlign: 'middle',
                border: '1px solid',
                borderColor: collection.collectionMetadata?.color
                  ? collection.collectionMetadata?.color
                  : 'black',
                margin: 4,
              }}
            />
            <br />{collection.collectionMetadata?.name}

          </div>
        </Tooltip>
        <br />

      </>}
    >
      <div key={collection.collectionId} style={{ color: PRIMARY_TEXT }}>
        <br />
        <b style={{ fontSize: 16 }}>Badges</b>
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