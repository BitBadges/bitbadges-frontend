import { Modal, Tooltip } from "antd";
import { useRouter } from "next/router";
import { useCollectionsContext } from "../../bitbadges-api/contexts/CollectionsContext";
import { BadgeAvatar } from "../badges/BadgeAvatar";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { InformationDisplayCard } from "../display/InformationDisplayCard";
import { useEffect } from "react";
import { INFINITE_LOOP_MODE } from "../../constants";

export function CollectionDisplay({ collectionId }: { collectionId: bigint }) {
  const router = useRouter();
  const collections = useCollectionsContext();
  const collection = collections.collections[collectionId.toString()]

  useEffect(() => {
    if (INFINITE_LOOP_MODE) console.log('useEffect: collection display, fetch collection ');

    if (collection && !collection.owners.find(x => x.cosmosAddress === 'Total')) {
      collections.fetchCollectionsWithOptions([{ collectionId, fetchTotalAndMintBalances: true, handleAllAndAppendDefaults: true }]);
    }
  }, [collectionId]);

  return <div style={{ width: 265, margin: 4, marginBottom: 15, display: 'flex' }}>
    <InformationDisplayCard
      noBorder
      title={<>
        <Tooltip color='black' title={"Collection ID: " + collectionId} placement="bottom">
          <div className='link-button-nav' onClick={() => {
            router.push('/collections/' + collectionId)
            Modal.destroyAll()
          }} style={{ alignItems: 'center', justifyContent: 'center' }}>
            <BadgeAvatar collectionId={collectionId} size={150} />
            <br />{collection?.cachedCollectionMetadata?.name}
          </div>
        </Tooltip>
        <br />
      </>}
    >
      <div className='primary-text'>
        <br />
        <b style={{ fontSize: 16 }}>Badges</b>
        <BadgeAvatarDisplay
          collectionId={collectionId}
          badgeIds={collection?.owners.find(x => x.cosmosAddress === 'Total')?.balances.map((x) => x.badgeIds).flat() ?? []}
        />
      </div>
    </InformationDisplayCard>
  </div>
}