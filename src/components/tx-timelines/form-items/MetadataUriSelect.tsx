import { Form, Input, Typography } from "antd";
import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BitBadgeCollection } from "../../../bitbadges-api/types";
import { PRIMARY_BLUE, PRIMARY_TEXT } from "../../../constants";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { BadgePageHeader } from "../../collection-page/BadgePageHeader";

const { Text } = Typography;

export function MetadataUriSelect({
    collection,
    newCollectionMsg,
    setNewCollectionMsg,
    updateMetadataForBadgeIds,
    startId,
    endId,
    hideCollectionSelect,
}: {
    collection: BitBadgeCollection,
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (newCollectionMsg: MessageMsgNewCollection, updateCollection: boolean, updateBadges: boolean) => void,
    updateMetadataForBadgeIds?: (badgeIds: number[]) => void;
    startId: number;
    endId: number;
    hideCollectionSelect?: boolean;
}) {




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
                    value={newCollectionMsg.collectionUri}
                    onChange={(e: any) => {
                        setNewCollectionMsg({
                            ...newCollectionMsg,
                            collectionUri: e.target.value
                        }, true, false);
                    }}
                    style={{
                        backgroundColor: PRIMARY_BLUE,
                        color: PRIMARY_TEXT,
                    }}
                />
            </Form.Item>

            {
                newCollectionMsg.collectionUri &&
                <BadgePageHeader
                    metadata={collection.collectionMetadata}
                />
            }
        </>
        }

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
                value={newCollectionMsg.badgeUris[0]?.uri}
                onChange={(e: any) => {
                    setNewCollectionMsg({
                        ...newCollectionMsg,
                        badgeUris: [

                            {
                                badgeIds: [{ start: startId, end: endId }],
                                uri: e.target.value
                            }
                        ]
                    }, false, true);
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
                    updateMetadataForBadgeIds={updateMetadataForBadgeIds}
                />
            </div>
        }
    </>
}