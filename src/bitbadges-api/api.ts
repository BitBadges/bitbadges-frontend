import { notification } from 'antd';
import { AddAddressToSurveyRouteRequestBody, AddAddressToSurveyRouteSuccessResponse, AddAnnouncementRouteRequestBody, AddAnnouncementRouteSuccessResponse, AddApprovalDetailsToOffChainStorageRouteRequestBody, AddApprovalDetailsToOffChainStorageRouteSuccessResponse, AddBalancesToOffChainStorageRouteRequestBody, AddBalancesToOffChainStorageRouteSuccessResponse, AddMetadataToIpfsRouteRequestBody, AddMetadataToIpfsRouteSuccessResponse, AddReviewForCollectionRouteRequestBody, AddReviewForCollectionRouteSuccessResponse, AddReviewForUserRouteRequestBody, AddReviewForUserRouteSuccessResponse, BigIntify, BitBadgesAPI, BroadcastTxRouteRequestBody, BroadcastTxRouteSuccessResponse, CheckSignInStatusRequestBody, CheckSignInStatusRequestSuccessResponse, CreateBlockinAuthCodeRouteRequestBody, CreateBlockinAuthCodeRouteSuccessResponse, DeleteAddressMappingsRouteRequestBody, DeleteAddressMappingsRouteSuccessResponse, DeleteAnnouncementRouteRequestBody, DeleteAnnouncementRouteSuccessResponse, DeleteBlockinAuthCodeRouteRequestBody, DeleteBlockinAuthCodeRouteSuccessResponse, DeleteReviewRouteRequestBody, DeleteReviewRouteSuccessResponse, ErrorResponse, FetchMetadataDirectlyRouteRequestBody, FetchMetadataDirectlyRouteSuccessResponse, GetAccountRouteRequestBody, GetAccountRouteSuccessResponse, GetAccountsRouteRequestBody, GetAccountsRouteSuccessResponse, GetAddressMappingsRouteRequestBody, GetAddressMappingsRouteSuccessResponse, GetAllCodesAndPasswordsRouteRequestBody, GetAllCodesAndPasswordsRouteSuccessResponse, GetApprovalsRouteRequestBody, GetApprovalsRouteSuccessResponse, GetBadgeActivityRouteRequestBody, GetBadgeActivityRouteSuccessResponse, GetBadgeBalanceByAddressRouteRequestBody, GetBadgeBalanceByAddressRouteSuccessResponse, GetBlockinAuthCodeRouteRequestBody, GetBlockinAuthCodeRouteSuccessResponse, GetBrowseCollectionsRouteRequestBody, GetBrowseCollectionsRouteSuccessResponse, GetChallengeTrackersRouteRequestBody, GetChallengeTrackersRouteSuccessResponse, GetCodeForPasswordRouteRequestBody, GetCodeForPasswordRouteSuccessResponse, GetCollectionBatchRouteRequestBody, GetCollectionBatchRouteSuccessResponse, GetCollectionByIdRouteRequestBody, GetCollectionRouteSuccessResponse, GetMetadataForCollectionRouteRequestBody, GetMetadataForCollectionRouteSuccessResponse, GetOwnersForBadgeRouteRequestBody, GetOwnersForBadgeRouteSuccessResponse, GetSearchRouteRequestBody, GetSearchRouteSuccessResponse, GetSignInChallengeRouteRequestBody, GetSignInChallengeRouteSuccessResponse, GetStatusRouteRequestBody, GetStatusRouteSuccessResponse, GetTokensFromFaucetRouteRequestBody, GetTokensFromFaucetRouteSuccessResponse, NumberType, RefreshMetadataRouteRequestBody, RefreshMetadataRouteSuccessResponse, SendClaimAlertsRouteRequestBody, SendClaimAlertsRouteSuccessResponse, SignOutRequestBody, SignOutSuccessResponse, SimulateTxRouteRequestBody, SimulateTxRouteSuccessResponse, UpdateAccountInfoRouteRequestBody, UpdateAccountInfoRouteSuccessResponse, UpdateAddressMappingsRouteRequestBody, UpdateAddressMappingsRouteSuccessResponse, VerifySignInRouteRequestBody, VerifySignInRouteSuccessResponse } from 'bitbadgesjs-utils';
import Joi from 'joi';
import { BACKEND_URL } from '../constants';

export type DesiredNumberType = bigint;
export const ConvertFunction = BigIntify;

const BitBadgesApi = new BitBadgesAPI({
  apiUrl: BACKEND_URL,
  convertFunction: BigIntify
});

async function handleApiError(error: any): Promise<void> {
  console.error(error);

  if (error && error.response && error.response.data) {
    const data: ErrorResponse = error.response.data;

    notification.error({
      message: "Oops! We ran into an error!",
      description: data.message ? data.message : "Unknown error",
    });
  } else {
    notification.error({
      message: "Oops! We ran into an error!",
      description: error.message ? error.message : "Unknown error: " + error,
    });
  }


  return Promise.reject(error);
}

function assertPositiveInteger(num: NumberType) {
  try {
    BigInt(num);
  } catch (e) {
    throw new Error(`Number is not a valid integer: ${num}`);
  }

  if (BigInt(num) <= 0) {
    throw new Error(`Number is not a positive integer: ${num}`);
  }
}

export async function getStatus(requestBody?: GetStatusRouteRequestBody): Promise<GetStatusRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getStatus(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getSearchResults(searchValue: string, requestBody?: GetSearchRouteRequestBody): Promise<GetSearchRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getSearchResults(searchValue, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getCollections(requestBody: GetCollectionBatchRouteRequestBody): Promise<GetCollectionBatchRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getCollections(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getCollectionById(collectionId: NumberType, requestBody: GetCollectionByIdRouteRequestBody, fetchAllMetadata = false): Promise<GetCollectionRouteSuccessResponse<DesiredNumberType>> {
  try {
    const responseData = await BitBadgesApi.getCollectionById(collectionId, requestBody, fetchAllMetadata);
    return responseData;
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getOwnersForBadge(collectionId: NumberType, badgeId: NumberType, requestBody: GetOwnersForBadgeRouteRequestBody): Promise<GetOwnersForBadgeRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);
    assertPositiveInteger(badgeId);

    return (await BitBadgesApi.getOwnersForBadge(collectionId, badgeId, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getMetadataForCollection(collectionId: NumberType, requestBody: GetMetadataForCollectionRouteRequestBody): Promise<GetMetadataForCollectionRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    return (await BitBadgesApi.getMetadataForCollection(collectionId, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getBadgeBalanceByAddress(collectionId: NumberType, cosmosAddress: string, requestBody?: GetBadgeBalanceByAddressRouteRequestBody): Promise<GetBadgeBalanceByAddressRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    return (await BitBadgesApi.getBadgeBalanceByAddress(collectionId, cosmosAddress, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}
export async function getBadgeActivity(collectionId: NumberType, badgeId: NumberType, requestBody: GetBadgeActivityRouteRequestBody): Promise<GetBadgeActivityRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);
    assertPositiveInteger(badgeId);

    return (await BitBadgesApi.getBadgeActivity(collectionId, badgeId, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function refreshMetadata(collectionId: NumberType, requestBody?: RefreshMetadataRouteRequestBody): Promise<RefreshMetadataRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    return (await BitBadgesApi.refreshMetadata(collectionId, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getAllPasswordsAndCodes(collectionId: NumberType, requestBody?: GetAllCodesAndPasswordsRouteRequestBody): Promise<GetAllCodesAndPasswordsRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    return (await BitBadgesApi.getAllPasswordsAndCodes(collectionId, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getCodeForPassword(collectionId: NumberType, cid: string, password: string, requestBody?: GetCodeForPasswordRouteRequestBody): Promise<GetCodeForPasswordRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    return (await BitBadgesApi.getCodeForPassword(collectionId, cid, password, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addAnnouncement(collectionId: NumberType, requestBody: AddAnnouncementRouteRequestBody): Promise<AddAnnouncementRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    return (await BitBadgesApi.addAnnouncement(collectionId, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function deleteReview(reviewId: string, requestBody?: DeleteReviewRouteRequestBody): Promise<DeleteReviewRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.deleteReview(reviewId, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function deleteAnnouncement(announcementId: string, requestBody?: DeleteAnnouncementRouteRequestBody): Promise<DeleteAnnouncementRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.deleteAnnouncement(announcementId, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addReviewForCollection(collectionId: NumberType, requestBody: AddReviewForCollectionRouteRequestBody): Promise<AddReviewForCollectionRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    return (await BitBadgesApi.addReviewForCollection(collectionId, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getAccounts(requestBody: GetAccountsRouteRequestBody): Promise<GetAccountsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const res = await BitBadgesApi.getAccounts(requestBody);

    return res;
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getAccountApi(addressOrUsername: string, requestBody: GetAccountRouteRequestBody): Promise<GetAccountRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getAccount(addressOrUsername, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addReviewForUser(addressOrUsername: string, requestBody: AddReviewForUserRouteRequestBody): Promise<AddReviewForUserRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.addReviewForUser(addressOrUsername, requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function updateAccountInfo(requestBody: UpdateAccountInfoRouteRequestBody<DesiredNumberType>): Promise<UpdateAccountInfoRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.updateAccountInfo(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addBalancesToOffChainStorage(requestBody: AddBalancesToOffChainStorageRouteRequestBody): Promise<AddBalancesToOffChainStorageRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.addBalancesToOffChainStorage(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addMetadataToIpfs(requestBody: AddMetadataToIpfsRouteRequestBody): Promise<AddMetadataToIpfsRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.addMetadataToIpfs(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addApprovalDetailsToOffChainStorage(requestBody: AddApprovalDetailsToOffChainStorageRouteRequestBody): Promise<AddApprovalDetailsToOffChainStorageRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.addApprovalDetailsToOffChainStorage(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getSignInChallenge(requestBody: GetSignInChallengeRouteRequestBody): Promise<GetSignInChallengeRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getSignInChallenge(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function verifySignIn(requestBody: VerifySignInRouteRequestBody): Promise<VerifySignInRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.verifySignIn(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function checkIfSignedIn(requestBody: CheckSignInStatusRequestBody): Promise<CheckSignInStatusRequestSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.checkIfSignedIn(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function signOut(requestBody?: SignOutRequestBody): Promise<SignOutSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.signOut(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getBrowseCollections(requestBody?: GetBrowseCollectionsRouteRequestBody): Promise<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getBrowseCollections(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function broadcastTx(requestBody: BroadcastTxRouteRequestBody | string): Promise<BroadcastTxRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.broadcastTx(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function simulateTx(requestBody: SimulateTxRouteRequestBody | string): Promise<SimulateTxRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.simulateTx(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function fetchMetadataDirectly(requestBody: FetchMetadataDirectlyRouteRequestBody): Promise<FetchMetadataDirectlyRouteSuccessResponse<DesiredNumberType>> {
  try {
    const error = requestBody.uris.find(uri => Joi.string().uri().required().validate(uri).error);
    if (error) {
      throw `Invalid URIs`;
    }

    return (await BitBadgesApi.fetchMetadataDirectly(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getTokensFromFaucet(requestBody?: GetTokensFromFaucetRouteRequestBody): Promise<GetTokensFromFaucetRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getTokensFromFaucet(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function updateAddressMappings(requestBody?: UpdateAddressMappingsRouteRequestBody<DesiredNumberType>): Promise<UpdateAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.updateAddressMappings(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getAddressMappings(requestBody?: GetAddressMappingsRouteRequestBody): Promise<GetAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getAddressMappings(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function deleteAddressMappings(requestBody?: DeleteAddressMappingsRouteRequestBody): Promise<DeleteAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.deleteAddressMappings(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getApprovalTrackers(requestBody?: GetApprovalsRouteRequestBody): Promise<GetApprovalsRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getApprovalTrackers(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getChallengeTrackers(requestBody?: GetChallengeTrackersRouteRequestBody): Promise<GetChallengeTrackersRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.getChallengeTrackers(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function createAuthCode(requestBody?: CreateBlockinAuthCodeRouteRequestBody): Promise<CreateBlockinAuthCodeRouteSuccessResponse> {
  try {
    return (await BitBadgesApi.createAuthCode(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getAuthCode(requestBody?: GetBlockinAuthCodeRouteRequestBody): Promise<GetBlockinAuthCodeRouteSuccessResponse> {
  try {
    return (await BitBadgesApi.getAuthCode(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function deleteAuthCode(requestBody?: DeleteBlockinAuthCodeRouteRequestBody): Promise<DeleteBlockinAuthCodeRouteSuccessResponse> {
  try {
    return (await BitBadgesApi.deleteAuthCode(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function verifySignInGeneric(requestBody: VerifySignInRouteRequestBody): Promise<VerifySignInRouteSuccessResponse<DesiredNumberType>> {
  try {
    return (await BitBadgesApi.verifySignInGeneric(requestBody));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}
export async function addAddressToSurvey(mappingId: string, requestBody: AddAddressToSurveyRouteRequestBody): Promise<AddAddressToSurveyRouteSuccessResponse> {
  try {
    return (await BitBadgesApi.addAddressToSurvey(mappingId, requestBody.address));
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function sendClaimAlert(requestBody: SendClaimAlertsRouteRequestBody<bigint>): Promise<SendClaimAlertsRouteSuccessResponse<bigint>> {
  try {
    return await BitBadgesApi.sendClaimAlert(requestBody);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

/** Update Helper Functions for Pagination and Dynamic Fetches */
/** Update Helper Functions for Pagination and Dynamic Fetches */
export async function updateUserSeenActivity() {
  return await BitBadgesApi.updateAccountInfo({ seenActivity: Date.now() }); // Authenticated route, no need to pass in the address
}

// // Gets metadata batches for a collection starting from startBatchId ?? 0 and incrementing METADATA_PAGE_LIMIT times
// export async function fetchAndUpdateMetadata(collection: BitBadgesCollection<bigint>, metadataFetchOptions: MetadataFetchOptions) {
//   const promises = [];
//   promises.push(BitBadgesApi.getMetadataForCollection(collection.collectionId, { metadataToFetch: metadataFetchOptions }));

//   const metadataResponses = await Promise.all(promises);

//   for (const metadataRes of metadataResponses) {
//     if (metadataRes.collectionMetadata) {
//       const isCollectionMetadataResEmpty = Object.keys(metadataRes.collectionMetadata).length === 0;
//       collection.cachedCollectionMetadata = !isCollectionMetadataResEmpty ? metadataRes.collectionMetadata : collection.cachedCollectionMetadata;
//     }

//     if (metadataRes.badgeMetadata) {
//       const vals = Object.values(metadataRes.badgeMetadata);
//       for (const val of vals) {
//         if (!val) continue;
//         collection.cachedBadgeMetadata = updateBadgeMetadata(collection.cachedBadgeMetadata, val);
//       }
//     }
//   }

//   return collection;
// }
