import { InsertRangeToIdRanges, RemoveIdsFromIdRange, SearchIdRangesForId } from "./idRanges";
import { BadgeMetadata, BadgeMetadataMap, IdRange } from "./types"

//Updates a metadata map by updating the metadata for a range of badge IDs
export const updateMetadataMap = (currMetadataMap: BadgeMetadataMap, metadata: BadgeMetadata, badgeIds: IdRange, uri: string) => {
    let currentMetadata = metadata;

    let keys = Object.keys(currMetadataMap);
    let values = Object.values(currMetadataMap);

    const startBadgeId = badgeIds.start;
    const endBadgeId = badgeIds.end;

    for (let i = 0; i < keys.length; i++) {
        const [idx, found] = SearchIdRangesForId(startBadgeId, values[i].badgeIds)

        if (found) {
            values[i].badgeIds = [...values[i].badgeIds.slice(0, idx), ...RemoveIdsFromIdRange({ start: startBadgeId, end: endBadgeId }, values[i].badgeIds[idx]), ...values[i].badgeIds.slice(idx + 1)]
        }
    }


    let currMetadataMapExists = false;
    for (let i = 0; i < keys.length; i++) {
        if (JSON.stringify(values[i].metadata) === JSON.stringify(currentMetadata)) {
            currMetadataMapExists = true;
            values[i].badgeIds = values[i].badgeIds.length > 0 ? InsertRangeToIdRanges({ start: startBadgeId, end: endBadgeId }, values[i].badgeIds) : [{ start: startBadgeId, end: endBadgeId }];
        }
    }

    let currIdx = 0;
    currMetadataMap = {};
    for (let i = 0; i < keys.length; i++) {
        if (values[i].badgeIds.length === 0) {
            continue;
        }
        currMetadataMap[currIdx] = values[i];
        currIdx++;
    }

    if (!currMetadataMapExists) {
        currMetadataMap[Object.keys(currMetadataMap).length] = {
            metadata: { ...currentMetadata },
            badgeIds: [{
                start: startBadgeId,
                end: endBadgeId,
            }],
            uri: uri
        }
    }

    return currMetadataMap;
}

//Popuate other badges with some updated metadata
//If metadataToSet is provided, we are overwriting all metadata for the badgeIds (i.e. setting metadata for all badgeIds to metadataToSet)
//Otherwise, we are updating a specific key value pair within each badge's existing metadata
export const populateFieldsOfOtherBadges = (individualBadgeMetadata: BadgeMetadataMap, badgeIds: IdRange[], key: string, value: any, metadataToSet?: BadgeMetadata) => {
    for (const badgeIdRange of badgeIds) {
        //If we are overwriting all metadata, we can just update the metadata map for all badge IDs to metadataToSet
        if (metadataToSet) {
            individualBadgeMetadata = updateMetadataMap(individualBadgeMetadata, metadataToSet, badgeIdRange, 'Manual');
        } else {
            //Otherwise, we are updating a specific key value pair for each
            for (let id = badgeIdRange.start; id <= badgeIdRange.end; id++) {
                let newMetadata = {} as BadgeMetadata;
                const values = Object.values(individualBadgeMetadata);
                const idRangeToUpdate = { start: id, end: id };

                for (let i = 0; i < values.length; i++) {
                    //Find the idx where id is in the badgeIds array
                    const [idx, found] = SearchIdRangesForId(id, values[i].badgeIds)
                    if (found) {
                        //If multiple sequential badge IDs have the same metadata and are in the ranges we want to update,
                        //we can batch update all these together
                        const foundIdRange = values[i].badgeIds[idx];
                        const endIdToUpdate = Math.min(foundIdRange.end, badgeIdRange.end);
                        idRangeToUpdate.end = endIdToUpdate;

                        id = endIdToUpdate; //Set id to the end of the range we are updating so we can skip to the next range (will be incremented by 1 at the end of the loop)

                        newMetadata = { ...values[i].metadata, [key]: value };
                        break;
                    }
                }

                individualBadgeMetadata = updateMetadataMap(individualBadgeMetadata, newMetadata, idRangeToUpdate, 'Manual');
            }
        }
    }

    return individualBadgeMetadata;
}