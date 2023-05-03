import { Form, Input, Typography } from "antd";
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BitBadgeCollection } from "bitbadgesjs-utils";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../../constants";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { CollectionHeader } from "../../badges/CollectionHeader";
import { useEffect, useState } from "react";

const { Text } = Typography;

export function MetadataUriSelect({
  collection,
  newCollectionMsg,
  setNewCollectionMsg,
  updateMetadataForBadgeIdsDirectlyFromUriIfAbsent,
  startId,
  endId,
  hideCollectionSelect,
  hideBadgeSelect
}: {
  collection: BitBadgeCollection,
  newCollectionMsg: MessageMsgNewCollection,
  setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection, updateCollection: boolean, updateBadges: boolean) => void,
  updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => Promise<void>;
  startId: number;
  endId: number;
  hideCollectionSelect?: boolean;
  hideBadgeSelect?: boolean;
}) {
  const [collectionUri, setCollectionUri] = useState(newCollectionMsg.collectionUri);
  const [badgeUri, setBadgeUri] = useState(newCollectionMsg.badgeUris[0]?.uri);

  const DELAY_MS = 1000;
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!collectionUri) return

      setNewCollectionMsg({
        ...newCollectionMsg,
        collectionUri: collectionUri
      }, true, false);

    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionUri])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!collectionUri) return
      setNewCollectionMsg({
        ...newCollectionMsg,
        badgeUris: [

          {
            badgeIds: [{ start: startId, end: endId }],
            uri: badgeUri
          }
        ]
      }, false, true);
    }, DELAY_MS)

    return () => clearTimeout(delayDebounceFn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badgeUri])


  return <>
    {!hideCollectionSelect && <>
      <Form.Item
        label={
          <Text
            style={{ color: PRIMARY_TEXT }}
            strong
          >
            Collection Metadata URI
          </Text>
        }
        required
      >
        <Input
          value={collectionUri}
          onChange={(e: any) => {
            setCollectionUri(e.target.value);
          }}
          style={{
            backgroundColor: PRIMARY_BLUE,
            color: PRIMARY_TEXT,
          }}
        />
      </Form.Item>

      {
        newCollectionMsg.collectionUri &&
        <CollectionHeader
          metadata={collection.collectionMetadata}
        />
      }
    </>
    }

    {!hideBadgeSelect && <>
      <Form.Item
        label={
          <Text
            style={{ color: PRIMARY_TEXT }}
            strong
          >
            Badge Metadata URI
          </Text>
        }
        required
      >
        <Input
          value={badgeUri}
          onChange={(e: any) => {
            setBadgeUri(e.target.value);
          }}
          style={{
            backgroundColor: PRIMARY_BLUE,
            color: PRIMARY_TEXT,
          }}
        />
        <div style={{ fontSize: 12 }}>
          <Text style={{ color: 'lightgray' }}>
            {"\"{id}\""} can be used as a placeholder which will be replaced the unique ID of each badge.
          </Text>
        </div>
      </Form.Item>



      {newCollectionMsg.badgeUris[0] &&
        <div className='flex-between' style={{ width: '100%', justifyContent: 'center', display: 'flex', color: PRIMARY_TEXT }}>
          <BadgeAvatarDisplay
            badgeIds={newCollectionMsg.badgeUris[0].badgeIds}
            collection={collection}
            userBalance={undefined}
            showIds
            updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
          />
        </div>
      }
    </>}
  </>
}