import { notification } from 'antd';
import axiosApi from 'axios';
import { AddAnnouncementRoute, AddAnnouncementRouteRequestBody, AddAnnouncementRouteSuccessResponse, AddBalancesToIpfsRoute, AddBalancesToIpfsRouteRequestBody, AddBalancesToIpfsRouteSuccessResponse, AddMerkleChallengeToIpfsRoute, AddMerkleChallengeToIpfsRouteRequestBody, AddMerkleChallengeToIpfsRouteSuccessResponse, AddMetadataToIpfsRoute, AddMetadataToIpfsRouteRequestBody, AddMetadataToIpfsRouteSuccessResponse, AddReviewForCollectionRoute, AddReviewForCollectionRouteRequestBody, AddReviewForCollectionRouteSuccessResponse, AddReviewForUserRoute, AddReviewForUserRouteRequestBody, AddReviewForUserRouteSuccessResponse, BigIntify, BitBadgesCollection, BroadcastTxRoute, BroadcastTxRouteRequestBody, BroadcastTxRouteSuccessResponse, CheckIfSignedInRoute, CheckSignInStatusRequestBody, CheckSignInStatusRequestSuccessResponse, CreateAddressMappingRoute, CreateAddressMappingsRouteRequestBody, CreateAddressMappingsRouteSuccessResponse, DeleteAnnouncementRoute, DeleteAnnouncementRouteRequestBody, DeleteAnnouncementRouteSuccessResponse, DeleteReviewRoute, DeleteReviewRouteRequestBody, DeleteReviewRouteSuccessResponse, ErrorResponse, FetchMetadataDirectlyRoute, FetchMetadataDirectlyRouteRequestBody, FetchMetadataDirectlyRouteSuccessResponse, GetAccountRoute, GetAccountRouteRequestBody, GetAccountRouteSuccessResponse, GetAccountsRoute, GetAccountsRouteRequestBody, GetAccountsRouteSuccessResponse, GetAddressMappingsRoute, GetAddressMappingsRouteRequestBody, GetAddressMappingsRouteSuccessResponse, GetAllCodesAndPasswordsRouteRequestBody, GetAllCodesAndPasswordsRouteSuccessResponse, GetAllPasswordsAndCodesRoute, GetApprovalsRoute, GetApprovalsRouteRequestBody, GetApprovalsRouteSuccessResponse, GetBadgeActivityRoute, GetBadgeActivityRouteRequestBody, GetBadgeActivityRouteSuccessResponse, GetBadgeBalanceByAddressRoute, GetBadgeBalanceByAddressRouteRequestBody, GetBadgeBalanceByAddressRouteSuccessResponse, GetBrowseCollectionsRoute, GetBrowseCollectionsRouteRequestBody, GetBrowseCollectionsRouteSuccessResponse, GetCollectionBatchRoute, GetCollectionBatchRouteRequestBody, GetCollectionBatchRouteSuccessResponse, GetCollectionByIdRoute, GetCollectionByIdRouteRequestBody, GetCollectionRouteSuccessResponse, GetMerkleChallengeCodeViaPasswordRoute, GetMerkleChallengeCodeViaPasswordRouteRequestBody, GetMerkleChallengeCodeViaPasswordRouteSuccessResponse, GetMerkleChallengeTrackerRoute, GetMerkleChallengeTrackersRouteRequestBody, GetMerkleChallengeTrackersRouteSuccessResponse, GetMetadataForCollectionRoute, GetMetadataForCollectionRouteRequestBody, GetMetadataForCollectionRouteSuccessResponse, GetOwnersForBadgeRoute, GetOwnersForBadgeRouteRequestBody, GetOwnersForBadgeRouteSuccessResponse, GetSearchRoute, GetSearchRouteRequestBody, GetSearchRouteSuccessResponse, GetSignInChallengeRoute, GetSignInChallengeRouteRequestBody, GetSignInChallengeRouteSuccessResponse, GetStatusRoute, GetStatusRouteRequestBody, GetStatusRouteSuccessResponse, GetTokensFromFaucetRoute, GetTokensFromFaucetRouteRequestBody, GetTokensFromFaucetRouteSuccessResponse, MetadataFetchOptions, NumberType, RefreshMetadataRoute, RefreshMetadataRouteRequestBody, RefreshMetadataRouteSuccessResponse, SignOutRequestBody, SignOutRoute, SignOutSuccessResponse, SimulateTxRoute, SimulateTxRouteRequestBody, SimulateTxRouteSuccessResponse, UpdateAccountInfoRoute, UpdateAccountInfoRouteRequestBody, UpdateAccountInfoRouteSuccessResponse, VerifySignInRoute, VerifySignInRouteRequestBody, VerifySignInRouteSuccessResponse, convertAddAnnouncementRouteSuccessResponse, convertAddBalancesToIpfsRouteSuccessResponse, convertAddMerkleChallengeToIpfsRouteSuccessResponse, convertAddMetadataToIpfsRouteSuccessResponse, convertAddReviewForCollectionRouteSuccessResponse, convertAddReviewForUserRouteSuccessResponse, convertBitBadgesCollection, convertBroadcastTxRouteSuccessResponse, convertCheckSignInStatusRequestSuccessResponse, convertCreateAddressMappingsRouteSuccessResponse, convertDeleteAnnouncementRouteSuccessResponse, convertDeleteReviewRouteSuccessResponse, convertFetchMetadataDirectlyRouteSuccessResponse, convertGetAccountRouteSuccessResponse, convertGetAccountsRouteSuccessResponse, convertGetAddressMappingsRouteSuccessResponse, convertGetAllCodesAndPasswordsRouteSuccessResponse, convertGetApprovalsRouteSuccessResponse, convertGetBadgeActivityRouteSuccessResponse, convertGetBadgeBalanceByAddressRouteSuccessResponse, convertGetBrowseCollectionsRouteSuccessResponse, convertGetCollectionBatchRouteSuccessResponse, convertGetCollectionRouteSuccessResponse, convertGetMerkleChallengeCodeViaPasswordRouteSuccessResponse, convertGetMerkleChallengeTrackersRouteSuccessResponse, convertGetMetadataForCollectionRouteSuccessResponse, convertGetOwnersForBadgeRouteSuccessResponse, convertGetSearchRouteSuccessResponse, convertGetSignInChallengeRouteSuccessResponse, convertGetStatusRouteSuccessResponse, convertGetTokensFromFaucetRouteSuccessResponse, convertRefreshMetadataRouteSuccessResponse, convertSignOutSuccessResponse, convertSimulateTxRouteSuccessResponse, convertUpdateAccountInfoRouteSuccessResponse, convertVerifySignInRouteSuccessResponse, getCurrentValueIdxForTimeline, getMaxMetadataId, updateBadgeMetadata } from 'bitbadgesjs-utils';
import Joi from 'joi';
import { BACKEND_URL } from '../constants';
import { stringify } from '../utils/preserveJson';

export type DesiredNumberType = bigint;
export const ConvertFunction = BigIntify;

export const axios = axiosApi.create({
  withCredentials: true,
  headers: {
    "Content-type": "application/json",
  },
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
      description: error.message ? error.message : "Unknown error",
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
    const response = await axios.post<GetStatusRouteSuccessResponse<string>>(`${BACKEND_URL}${GetStatusRoute()}`, requestBody);
    return convertGetStatusRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getSearchResults(searchValue: string, requestBody?: GetSearchRouteRequestBody): Promise<GetSearchRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetSearchRouteSuccessResponse<string>>(`${BACKEND_URL}${GetSearchRoute(searchValue)}`, requestBody);
    return convertGetSearchRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getCollections(requestBody: GetCollectionBatchRouteRequestBody): Promise<GetCollectionBatchRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetCollectionBatchRouteSuccessResponse<string>>(`${BACKEND_URL}${GetCollectionBatchRoute()}`, requestBody);
    return convertGetCollectionBatchRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getCollectionById(collectionId: NumberType, requestBody: GetCollectionByIdRouteRequestBody, fetchAllMetadata = false): Promise<GetCollectionRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    const response = await axios.post<GetCollectionRouteSuccessResponse<string>>(`${BACKEND_URL}${GetCollectionByIdRoute(collectionId)}`, requestBody);
    const responseData = convertGetCollectionRouteSuccessResponse(response.data, ConvertFunction);

    if (fetchAllMetadata) {
      const _collection = convertBitBadgesCollection(responseData.collection, BigIntify);
      const currentBadgeMetadataIdx = getCurrentValueIdxForTimeline(_collection.badgeMetadataTimeline);
      const currentBadgeMetadata = _collection.badgeMetadataTimeline[Number(currentBadgeMetadataIdx)].badgeMetadata;
      responseData.collection = await fetchAndUpdateMetadata(responseData.collection, {
        metadataIds: [{ start: 0, end: getMaxMetadataId(currentBadgeMetadata) }],
      });
    }

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

    const response = await axios.post<GetOwnersForBadgeRouteSuccessResponse<string>>(`${BACKEND_URL}${GetOwnersForBadgeRoute(collectionId, badgeId)}`, requestBody);
    return convertGetOwnersForBadgeRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getMetadataForCollection(collectionId: NumberType, requestBody: GetMetadataForCollectionRouteRequestBody): Promise<GetMetadataForCollectionRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    const response = await axios.post<GetMetadataForCollectionRouteSuccessResponse<string>>(`${BACKEND_URL}${GetMetadataForCollectionRoute(collectionId)}`, requestBody);
    return convertGetMetadataForCollectionRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getBadgeBalanceByAddress(collectionId: NumberType, cosmosAddress: string, requestBody?: GetBadgeBalanceByAddressRouteRequestBody): Promise<GetBadgeBalanceByAddressRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    const response = await axios.post<GetBadgeBalanceByAddressRouteSuccessResponse<string>>(`${BACKEND_URL}${GetBadgeBalanceByAddressRoute(collectionId, cosmosAddress)}`, requestBody);
    return convertGetBadgeBalanceByAddressRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getBadgeActivity(collectionId: NumberType, badgeId: NumberType, requestBody: GetBadgeActivityRouteRequestBody): Promise<GetBadgeActivityRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);
    assertPositiveInteger(badgeId);
    const response = await axios.post<GetBadgeActivityRouteSuccessResponse<string>>(`${BACKEND_URL}${GetBadgeActivityRoute(collectionId, badgeId)}`, requestBody);
    return convertGetBadgeActivityRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function refreshMetadata(collectionId: NumberType, requestBody?: RefreshMetadataRouteRequestBody): Promise<RefreshMetadataRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    const response = await axios.post<RefreshMetadataRouteSuccessResponse<string>>(`${BACKEND_URL}${RefreshMetadataRoute(collectionId)}`, requestBody);
    return convertRefreshMetadataRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getAllPasswordsAndCodes(collectionId: NumberType, requestBody?: GetAllCodesAndPasswordsRouteRequestBody): Promise<GetAllCodesAndPasswordsRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    const response = await axios.post<GetAllCodesAndPasswordsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetAllPasswordsAndCodesRoute(collectionId)}`, requestBody);
    return convertGetAllCodesAndPasswordsRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getMerkleChallengeCodeViaPassword(collectionId: NumberType, cid: string, password: string, requestBody?: GetMerkleChallengeCodeViaPasswordRouteRequestBody): Promise<GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    const response = await axios.post<GetMerkleChallengeCodeViaPasswordRouteSuccessResponse<string>>(`${BACKEND_URL}${GetMerkleChallengeCodeViaPasswordRoute(collectionId, cid, password)}`, requestBody);
    return convertGetMerkleChallengeCodeViaPasswordRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addAnnouncement(collectionId: NumberType, requestBody: AddAnnouncementRouteRequestBody): Promise<AddAnnouncementRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    const response = await axios.post<AddAnnouncementRouteSuccessResponse<string>>(`${BACKEND_URL}${AddAnnouncementRoute(collectionId)}`, requestBody);
    return convertAddAnnouncementRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function deleteReview(reviewId: string, requestBody?: DeleteReviewRouteRequestBody): Promise<DeleteReviewRouteSuccessResponse<DesiredNumberType>> {
  try {

    const response = await axios.post<DeleteReviewRouteSuccessResponse<string>>(`${BACKEND_URL}${DeleteReviewRoute(reviewId)}`, requestBody);
    return convertDeleteReviewRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function deleteAnnouncement(announcementId: string, requestBody?: DeleteAnnouncementRouteRequestBody): Promise<DeleteAnnouncementRouteSuccessResponse<DesiredNumberType>> {
  try {

    const response = await axios.post<DeleteAnnouncementRouteSuccessResponse<string>>(`${BACKEND_URL}${DeleteAnnouncementRoute(announcementId)}`, requestBody);
    return convertDeleteAnnouncementRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}


export async function addReviewForCollection(collectionId: NumberType, requestBody: AddReviewForCollectionRouteRequestBody): Promise<AddReviewForCollectionRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    const response = await axios.post<AddReviewForCollectionRouteSuccessResponse<string>>(`${BACKEND_URL}${AddReviewForCollectionRoute(collectionId)}`, requestBody);
    return convertAddReviewForCollectionRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getAccounts(requestBody: GetAccountsRouteRequestBody): Promise<GetAccountsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetAccountsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetAccountsRoute()}`, requestBody);
    return convertGetAccountsRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getAccount(addressOrUsername: string, requestBody: GetAccountRouteRequestBody): Promise<GetAccountRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetAccountRouteSuccessResponse<string>>(`${BACKEND_URL}${GetAccountRoute(addressOrUsername)}`, requestBody);
    return convertGetAccountRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}


export async function addReviewForUser(addressOrUsername: string, requestBody: AddReviewForUserRouteRequestBody): Promise<AddReviewForUserRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<AddReviewForUserRouteSuccessResponse<string>>(`${BACKEND_URL}${AddReviewForUserRoute(addressOrUsername)}`, requestBody);
    return convertAddReviewForUserRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function updateAccountInfo(requestBody: UpdateAccountInfoRouteRequestBody<DesiredNumberType>): Promise<UpdateAccountInfoRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<UpdateAccountInfoRouteSuccessResponse<string>>(`${BACKEND_URL}${UpdateAccountInfoRoute()}`, requestBody);
    return convertUpdateAccountInfoRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addBalancesToIpfs(requestBody: AddBalancesToIpfsRouteRequestBody): Promise<AddBalancesToIpfsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<AddBalancesToIpfsRouteSuccessResponse<string>>(`${BACKEND_URL}${AddBalancesToIpfsRoute()}`, requestBody);
    return convertAddBalancesToIpfsRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addMetadataToIpfs(requestBody: AddMetadataToIpfsRouteRequestBody): Promise<AddMetadataToIpfsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<AddMetadataToIpfsRouteSuccessResponse<string>>(`${BACKEND_URL}${AddMetadataToIpfsRoute()}`, requestBody);
    return convertAddMetadataToIpfsRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function addMerkleChallengeToIpfs(requestBody: AddMerkleChallengeToIpfsRouteRequestBody): Promise<AddMerkleChallengeToIpfsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<AddMerkleChallengeToIpfsRouteSuccessResponse<string>>(`${BACKEND_URL}${AddMerkleChallengeToIpfsRoute()}`, requestBody);
    return convertAddMerkleChallengeToIpfsRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getSignInChallenge(requestBody: GetSignInChallengeRouteRequestBody): Promise<GetSignInChallengeRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetSignInChallengeRouteSuccessResponse<string>>(`${BACKEND_URL}${GetSignInChallengeRoute()}`, requestBody);
    return convertGetSignInChallengeRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function verifySignIn(requestBody: VerifySignInRouteRequestBody): Promise<VerifySignInRouteSuccessResponse<DesiredNumberType>> {
  try {
    const body = stringify(requestBody);
    const response = await axios.post<VerifySignInRouteSuccessResponse<string>>(`${BACKEND_URL}${VerifySignInRoute()}`, body);
    return convertVerifySignInRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function checkIfSignedIn(requestBody: CheckSignInStatusRequestBody): Promise<CheckSignInStatusRequestSuccessResponse<DesiredNumberType>> {
  try {
    const body = stringify(requestBody);
    const response = await axios.post<CheckSignInStatusRequestSuccessResponse<string>>(`${BACKEND_URL}${CheckIfSignedInRoute()}`, body);
    return convertCheckSignInStatusRequestSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function signOut(requestBody?: SignOutRequestBody): Promise<SignOutSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<SignOutSuccessResponse<string>>(`${BACKEND_URL}${SignOutRoute()}`, requestBody);
    return convertSignOutSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getBrowseCollections(requestBody?: GetBrowseCollectionsRouteRequestBody): Promise<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetBrowseCollectionsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetBrowseCollectionsRoute()}`, requestBody);
    return convertGetBrowseCollectionsRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function broadcastTx(requestBody: BroadcastTxRouteRequestBody | string): Promise<BroadcastTxRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<BroadcastTxRouteSuccessResponse<string>>(`${BACKEND_URL}${BroadcastTxRoute()}`, requestBody);
    return convertBroadcastTxRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function simulateTx(requestBody: SimulateTxRouteRequestBody | string): Promise<SimulateTxRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<SimulateTxRouteSuccessResponse<string>>(`${BACKEND_URL}${SimulateTxRoute()}`, requestBody);
    return convertSimulateTxRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function fetchMetadataDirectly(requestBody: FetchMetadataDirectlyRouteRequestBody): Promise<FetchMetadataDirectlyRouteSuccessResponse<DesiredNumberType>> {
  try {
    const error = requestBody.uris.find(uri => Joi.string().uri().required().validate(uri).error);
    if (error) {
      throw new Error(`Invalid URIs`);
    }

    const response = await axios.post<FetchMetadataDirectlyRouteSuccessResponse<string>>(`${BACKEND_URL}${FetchMetadataDirectlyRoute()}`, requestBody);
    return convertFetchMetadataDirectlyRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getTokensFromFaucet(requestBody?: GetTokensFromFaucetRouteRequestBody): Promise<GetTokensFromFaucetRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetTokensFromFaucetRouteSuccessResponse<string>>(`${BACKEND_URL}${GetTokensFromFaucetRoute()}`, requestBody);
    return convertGetTokensFromFaucetRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function createAddressMappings(requestBody?: CreateAddressMappingsRouteRequestBody): Promise<CreateAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<CreateAddressMappingsRouteSuccessResponse<string>>(`${BACKEND_URL}${CreateAddressMappingRoute()}`, requestBody);
    return convertCreateAddressMappingsRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getAddressMappings(requestBody?: GetAddressMappingsRouteRequestBody): Promise<GetAddressMappingsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetAddressMappingsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetAddressMappingsRoute()}`, requestBody);
    return convertGetAddressMappingsRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getApprovalTrackers(requestBody?: GetApprovalsRouteRequestBody): Promise<GetApprovalsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetApprovalsRouteSuccessResponse<string>>(`${BACKEND_URL}${GetApprovalsRoute()}`, requestBody);
    return convertGetApprovalsRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

export async function getMerkleChallengeTrackers(requestBody?: GetMerkleChallengeTrackersRouteRequestBody): Promise<GetMerkleChallengeTrackersRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<GetMerkleChallengeTrackersRouteSuccessResponse<string>>(`${BACKEND_URL}${GetMerkleChallengeTrackerRoute()}`, requestBody);
    return convertGetMerkleChallengeTrackersRouteSuccessResponse(response.data, ConvertFunction);
  } catch (error) {
    await handleApiError(error);
    return Promise.reject(error);
  }
}

/** Update Helper Functions for Pagination and Dynamic Fetches */
export async function updateUserSeenActivity() {
  return await updateAccountInfo({ seenActivity: Date.now() }); //Authenticated route so no need to pass in address
}

//Gets metadata batches for a collection starting from startBatchId ?? 0 and incrementing METADATA_PAGE_LIMIT times
export async function fetchAndUpdateMetadata(collection: BitBadgesCollection<bigint>, metadataFetchOptions: MetadataFetchOptions) {
  const promises = [];
  promises.push(getMetadataForCollection(collection.collectionId, { metadataToFetch: metadataFetchOptions }));

  const metadataResponses = await Promise.all(promises);

  for (const metadataRes of metadataResponses) {
    if (metadataRes.collectionMetadata) {
      const isCollectionMetadataResEmpty = Object.keys(metadataRes.collectionMetadata).length === 0;
      collection.cachedCollectionMetadata = !isCollectionMetadataResEmpty ? metadataRes.collectionMetadata : collection.cachedCollectionMetadata;
    }

    if (metadataRes.badgeMetadata) {
      const vals = Object.values(metadataRes.badgeMetadata);
      for (const val of vals) {
        if (!val) continue;
        collection.cachedBadgeMetadata = updateBadgeMetadata(collection.cachedBadgeMetadata, val);
      }
    }
  }

  return collection;
}