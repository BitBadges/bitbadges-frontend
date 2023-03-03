import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, IdRange, MetadataAddMethod } from "../../../bitbadges-api/types";
import { BadgePageHeader } from "../../collection-page/BadgePageHeader";
import { MetadataForm } from "../form-items/MetadataForm";
import { GetPermissions } from "../../../bitbadges-api/permissions";
import { InsertRangeToIdRanges, RemoveIdsFromIdRange, SearchIdRangesForId } from "../../../bitbadges-api/idRanges";
import { getMetadataForBadgeId } from "../../../bitbadges-api/badges";

export function SetCollectionMetadataStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
    addMethod: MetadataAddMethod,
    collectionMetadata: BadgeMetadata,
    setCollectionMetadata: (metadata: BadgeMetadata) => void,
    individualBadgeMetadata: BadgeMetadataMap,
    setIndividualBadgeMetadata: (metadata: BadgeMetadataMap) => void,
    simulatedCollection: BitBadgeCollection,
    existingCollection?: BitBadgeCollection
) {
    return {
        title: 'Set Collection Metadata',
        description: `Provide details about the badge collection.`,
        node: <div>

            {addMethod === MetadataAddMethod.Manual &&
                <div>

                    {<div>
                        <br />

                        <br />
                        <BadgePageHeader metadata={collectionMetadata} />
                        {/* <OverviewTab /> */}
                    </div>}
                </div>
            }



            <MetadataForm
                collection={{
                    ...simulatedCollection,
                    collectionMetadata: collectionMetadata,
                    badgeMetadata: individualBadgeMetadata
                }}
                addMethod={addMethod}
                metadata={collectionMetadata}
                startId={existingCollection?.nextBadgeId || 1}
                endId={simulatedCollection.nextBadgeId - 1}
                setMetadata={setCollectionMetadata as any}
                setNewCollectionMsg={setNewCollectionMsg}
                newCollectionMsg={newCollectionMsg}
                toBeFrozen={!GetPermissions(newCollectionMsg.permissions).CanUpdateUris}
                populateOtherBadges={(badgeIds: IdRange[], key: string, value: any) => {
                    for (const badgeIdRange of badgeIds) {
                        for (let id = badgeIdRange.start; id <= badgeIdRange.end; id++) {
                            let metadata = getMetadataForBadgeId(id, individualBadgeMetadata);
                            metadata = { ...metadata, [key]: value };


                            let keys = Object.keys(individualBadgeMetadata);
                            let values = Object.values(individualBadgeMetadata);
                            for (let i = 0; i < keys.length; i++) {
                                const res = SearchIdRangesForId(id, values[i].badgeIds)
                                const idx = res[0]
                                const found = res[1]
                                console.log("found", id, "at", idx, found, "in", JSON.stringify(values[i].badgeIds));
                                if (found) {
                                    values[i].badgeIds = [...values[i].badgeIds.slice(0, idx), ...RemoveIdsFromIdRange({ start: id, end: id }, values[i].badgeIds[idx]), ...values[i].badgeIds.slice(idx + 1)]
                                    console.log("new ids", JSON.stringify(values[i].badgeIds));
                                }
                            }

                            console.log("new metadata after first loop", JSON.stringify(individualBadgeMetadata));

                            let metadataExists = false;
                            for (let i = 0; i < keys.length; i++) {
                                if (JSON.stringify(values[i].metadata) === JSON.stringify(metadata)) {
                                    metadataExists = true;
                                    values[i].badgeIds = values[i].badgeIds.length > 0 ? InsertRangeToIdRanges({ start: id, end: id }, values[i].badgeIds) : [{ start: id, end: id }];
                                }
                            }

                            console.log("new metadata after metadata exists loop", JSON.stringify(individualBadgeMetadata));

                            let currIdx = 0;
                            individualBadgeMetadata = {};
                            for (let i = 0; i < keys.length; i++) {
                                if (values[i].badgeIds.length === 0) {
                                    continue;
                                }
                                individualBadgeMetadata[currIdx] = values[i];
                                currIdx++;
                            }

                            if (!metadataExists) {
                                individualBadgeMetadata[Object.keys(individualBadgeMetadata).length] = {
                                    metadata: { ...metadata },
                                    badgeIds: [{
                                        start: id,
                                        end: id,
                                    }],
                                }
                            }
                        }
                    }

                    // for (const metadataId of metadataIdsToUpdate) {
                    //     newMetadata[metadataId] = {
                    //         ...newMetadata[metadataId],
                    //         metadata: {
                    //             ...newMetadata[metadataId].metadata,
                    //             [key]: value,
                    //         },
                    //     };
                    // }

                    setIndividualBadgeMetadata(individualBadgeMetadata);
                }}
            />
        </div>,
        disabled: (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
            || (addMethod === MetadataAddMethod.UploadUrl && (newCollectionMsg.badgeUris[0]?.uri.indexOf('{id}') == -1))
            || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
    }
}