import { axios } from './api'
import { BitBadgeCollection, GetMetadataRoute, IdRange, BadgeMetadata, BadgeMetadataMap, updateMetadataMap } from "bitbadgesjs-utils";
import Joi from "joi";
import { BACKEND_URL } from "../constants";

export function validatePositiveNumber(collectionId: number, fieldName?: string) {
  if (collectionId === undefined || collectionId === -1) {
    return Promise.reject((fieldName ? fieldName : 'ID') + " is invalid");
  }

  let error = Joi.number().integer().min(-1).required().validate(collectionId).error
  if (error) {
    return Promise.reject(error);
  }
}

//Gets metadata batches for a collection starting from startBatchId ?? 0 and incrementing METADATA_PAGE_LIMIT times
export async function updateMetadata(collection: BitBadgeCollection, startBatchIds?: number[]) {
  const promises = [];
  if (!startBatchIds) {
    startBatchIds = [0];
  }
  for (let startBatchId of startBatchIds) {
    startBatchId = startBatchId < 0 ? 0 : startBatchId
    promises.push(axios.post(BACKEND_URL + GetMetadataRoute(collection.collectionId), { startBatchId }).then((res) => res.data));
  }

  const metadataResponses = await Promise.all(promises);

  for (const metadataRes of metadataResponses) {
    const isCollectionMetadataResEmpty = Object.keys(metadataRes.collectionMetadata).length === 0;
    collection.collectionMetadata = !isCollectionMetadataResEmpty ? metadataRes.collectionMetadata : collection.collectionMetadata;

    const badgeResValues: {
      badgeIds: IdRange[];
      metadata: BadgeMetadata;
      uri: string;
    }[] = Object.values(metadataRes.badgeMetadata as BadgeMetadataMap);
    for (const val of badgeResValues) {
      for (const badgeId of val.badgeIds) {
        collection.badgeMetadata = updateMetadataMap(collection.badgeMetadata, val.metadata, badgeId, val.uri);
      }
    }
  }

  return collection;
}