import { MessageMsgNewCollection } from "bitbadgesjs-transactions";
import { InsertRangeToIdRanges, RemoveIdsFromIdRange, SearchIdRangesForId } from "../../../bitbadges-api/idRanges";
import { GetPermissions } from "../../../bitbadges-api/permissions";
import { BadgeMetadata, BadgeMetadataMap, BitBadgeCollection, IdRange, MetadataAddMethod } from "../../../bitbadges-api/types";
import { BadgePageHeader } from "../../collection-page/BadgePageHeader";
import { MetadataForm } from "../form-items/MetadataForm";

export function SetCollectionMetadataStepItem(
    newCollectionMsg: MessageMsgNewCollection,
    setNewCollectionMsg: (msg: MessageMsgNewCollection) => void,
    addMethod: MetadataAddMethod,
    collectionMetadata: BadgeMetadata,
    setCollectionMetadata: (metadata: BadgeMetadata) => void,
    individualBadgeMetadata: BadgeMetadataMap,
    setIndividualBadgeMetadata: (metadata: BadgeMetadataMap) => void,
    simulatedCollection: BitBadgeCollection,
    existingCollection?: BitBadgeCollection,
    updateMetadataForManualUris?: () => void,
    updateMetadataForBadgeIds?: (badgeIds: number[]) => void,
    hideCollectionSelect?: boolean
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
                hideCollectionSelect={hideCollectionSelect}
                updateMetadataForManualUris={updateMetadataForManualUris}
                updateMetadataForBadgeIds={updateMetadataForBadgeIds}
                addMethod={addMethod}
                metadata={collectionMetadata}
                startId={existingCollection?.nextBadgeId || 1}
                endId={simulatedCollection.nextBadgeId - 1}
                setMetadata={setCollectionMetadata as any}
                setNewCollectionMsg={setNewCollectionMsg}
                newCollectionMsg={newCollectionMsg}
                toBeFrozen={!GetPermissions(newCollectionMsg.permissions).CanUpdateUris}
                populateOtherBadges={(badgeIds: IdRange[], key: string, value: any, metadataToSet?: BadgeMetadata) => {
                    for (const badgeIdRange of badgeIds) {
                        for (let id = badgeIdRange.start; id <= badgeIdRange.end; id++) {
                            let newMetadata = {} as BadgeMetadata;
                            let keys = Object.keys(individualBadgeMetadata);
                            let values = Object.values(individualBadgeMetadata);
                            const idRangeToUpdate = { start: id, end: id };
                            for (let i = 0; i < values.length; i++) {
                                const res = SearchIdRangesForId(id, values[i].badgeIds)
                                const idx = res[0]
                                const found = res[1]
                                if (found) {
                                    for (let j = id + 1; j <= badgeIdRange.end; j++) {
                                        const res = SearchIdRangesForId(j, values[i].badgeIds)
                                        const found = res[1]
                                        if (found) {
                                            idRangeToUpdate.end = j;
                                            id = j;
                                        } else {
                                            break;
                                        }
                                    }
                                    values[i].badgeIds = [...values[i].badgeIds.slice(0, idx), ...RemoveIdsFromIdRange(idRangeToUpdate, values[i].badgeIds[idx]), ...values[i].badgeIds.slice(idx + 1)]

                                    newMetadata = { ...values[i].metadata, [key]: value };
                                    if (metadataToSet) {
                                        newMetadata = { ...metadataToSet };
                                    }

                                    break;
                                }
                            }

                            let metadata = newMetadata;

                            let metadataExists = false;
                            for (let i = 0; i < keys.length; i++) {
                                if (JSON.stringify(values[i].metadata) === JSON.stringify(metadata)) {
                                    metadataExists = true;
                                    values[i].badgeIds = values[i].badgeIds.length > 0 ? InsertRangeToIdRanges(idRangeToUpdate, values[i].badgeIds) : [idRangeToUpdate];
                                }
                            }

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
                                    badgeIds: [idRangeToUpdate],
                                    uri: 'Manual'
                                }
                            }
                        }
                    }

                    setIndividualBadgeMetadata(individualBadgeMetadata);
                }}
            />
        </div>,
        disabled: (addMethod === MetadataAddMethod.Manual && !(collectionMetadata?.name))
            || (addMethod === MetadataAddMethod.UploadUrl && (!(newCollectionMsg.collectionUri) || !(newCollectionMsg.badgeUris.length)))
            || (addMethod === MetadataAddMethod.CSV && !(collectionMetadata?.name))
    }
}