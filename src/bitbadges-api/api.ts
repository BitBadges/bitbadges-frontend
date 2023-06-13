import { notification } from 'antd';
import axiosApi from 'axios';
import { AddAnnouncementRoute, AddAnnouncementRouteRequestBody, AddAnnouncementRouteSuccessResponse, AddBalancesToIpfsRoute, AddBalancesToIpfsRouteRequestBody, AddBalancesToIpfsRouteSuccessResponse, AddClaimToIpfsRoute, AddClaimToIpfsRouteRequestBody, AddClaimToIpfsRouteSuccessResponse, AddMetadataToIpfsRoute, AddMetadataToIpfsRouteRequestBody, AddMetadataToIpfsRouteSuccessResponse, AddReviewForCollectionRoute, AddReviewForCollectionRouteRequestBody, AddReviewForCollectionRouteSuccessResponse, AddReviewForUserRoute, AddReviewForUserRouteRequestBody, AddReviewForUserRouteSuccessResponse, BigIntify, BitBadgesCollection, BroadcastTxRoute, BroadcastTxRouteRequestBody, BroadcastTxRouteSuccessResponse, ErrorResponse, FetchMetadataDirectlyRoute, FetchMetadataDirectlyRouteRequestBody, FetchMetadataDirectlyRouteSuccessResponse, GetAccountRoute, GetAccountRouteRequestBody, GetAccountRouteSuccessResponse, GetAccountsRoute, GetAccountsRouteRequestBody, GetAccountsRouteSuccessResponse, GetAllCodesAndPasswordsRouteRequestBody, GetAllCodesAndPasswordsRouteSuccessResponse, GetAllPasswordsAndCodesRoute, GetBadgeActivityRoute, GetBadgeActivityRouteRequestBody, GetBadgeActivityRouteSuccessResponse, GetBadgeBalanceByAddressRoute, GetBadgeBalanceByAddressRouteRequestBody, GetBadgeBalanceByAddressRouteSuccessResponse, GetBrowseCollectionsRoute, GetBrowseCollectionsRouteRequestBody, GetBrowseCollectionsRouteSuccessResponse, GetClaimCodeViaPasswordRoute, GetClaimCodeViaPasswordRouteRequestBody, GetClaimCodeViaPasswordRouteSuccessResponse, GetCollectionBatchRoute, GetCollectionBatchRouteRequestBody, GetCollectionBatchRouteSuccessResponse, GetCollectionByIdRoute, GetCollectionByIdRouteRequestBody, GetCollectionRouteSuccessResponse, GetMetadataForCollectionRoute, GetMetadataForCollectionRouteRequestBody, GetMetadataForCollectionRouteSuccessResponse, GetOwnersForBadgeRoute, GetOwnersForBadgeRouteRequestBody, GetOwnersForBadgeRouteSuccessResponse, GetSearchRoute, GetSearchRouteRequestBody, GetSearchRouteSuccessResponse, GetSignInChallengeRoute, GetSignInChallengeRouteRequestBody, GetSignInChallengeRouteSuccessResponse, GetStatusRoute, GetStatusRouteRequestBody, GetStatusRouteSuccessResponse, GetTokensFromFaucetRoute, GetTokensFromFaucetRouteRequestBody, GetTokensFromFaucetRouteSuccessResponse, MetadataFetchOptions, NumberType, RefreshMetadataRoute, RefreshMetadataRouteRequestBody, RefreshMetadataRouteSuccessResponse, SignOutRequestBody, SignOutRoute, SignOutSuccessResponse, SimulateTxRoute, SimulateTxRouteRequestBody, SimulateTxRouteSuccessResponse, UpdateAccountInfoRoute, UpdateAccountInfoRouteRequestBody, UpdateAccountInfoRouteSuccessResponse, VerifySignInRoute, VerifySignInRouteRequestBody, VerifySignInRouteSuccessResponse, convertAddAnnouncementRouteSuccessResponse, convertAddBalancesToIpfsRouteSuccessResponse, convertAddClaimToIpfsRouteSuccessResponse, convertAddMetadataToIpfsRouteSuccessResponse, convertAddReviewForCollectionRouteSuccessResponse, convertAddReviewForUserRouteSuccessResponse, convertBitBadgesCollection, convertBroadcastTxRouteSuccessResponse, convertFetchMetadataDirectlyRouteSuccessResponse, convertGetAccountRouteSuccessResponse, convertGetAccountsRouteSuccessResponse, convertGetAllCodesAndPasswordsRouteSuccessResponse, convertGetBadgeActivityRouteSuccessResponse, convertGetBadgeBalanceByAddressRouteSuccessResponse, convertGetBrowseCollectionsRouteSuccessResponse, convertGetClaimCodeViaPasswordRouteSuccessResponse, convertGetCollectionBatchRouteSuccessResponse, convertGetCollectionRouteSuccessResponse, convertGetMetadataForCollectionRouteSuccessResponse, convertGetOwnersForBadgeRouteSuccessResponse, convertGetSearchRouteSuccessResponse, convertGetSignInChallengeRouteSuccessResponse, convertGetStatusRouteSuccessResponse, convertGetTokensFromFaucetRouteSuccessResponse, convertRefreshMetadataRouteSuccessResponse, convertSignOutSuccessResponse, convertSimulateTxRouteSuccessResponse, convertUpdateAccountInfoRouteSuccessResponse, convertVerifySignInRouteSuccessResponse, getMaxMetadataId, updateBadgeMetadata } from 'bitbadgesjs-utils';
import Joi from 'joi';
import { BACKEND_URL } from '../constants';
import { stringify } from '../utils/preserveJson';

//TODO: Double check and assert request types and bodies are valid (e.g. positive integers, valid addresses, etc.). Much better to catch errors here than in the backend.

export type DesiredNumberType = bigint;
export const ConvertFunction = BigIntify;

export const axios = axiosApi.create({
  withCredentials: true,
  headers: {
    "Content-type": "application/json",
  },
});

async function handleApiError(error: any): Promise<ErrorResponse> {
  if (error && error.response && error.response.data) {
    const data: ErrorResponse = error.response.data;
    return data;
  } else {
    notification.error({
      message: "Oops! We ran into an error.",
      description: error.message ? error.message : "Unknown error",
    });

    return {
      message: error.message ? error.message : "Unknown error",
      error: error,
    };
  }
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
      responseData.collection = await fetchAndUpdateMetadata(responseData.collection, {
        metadataIds: [{ start: 0, end: getMaxMetadataId(_collection) }],
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

export async function getClaimCodeViaPassword(collectionId: NumberType, claimId: NumberType, password: string, requestBody?: GetClaimCodeViaPasswordRouteRequestBody): Promise<GetClaimCodeViaPasswordRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    const response = await axios.post<GetClaimCodeViaPasswordRouteSuccessResponse<string>>(`${BACKEND_URL}${GetClaimCodeViaPasswordRoute(collectionId, claimId, password)}`, requestBody);
    return convertGetClaimCodeViaPasswordRouteSuccessResponse(response.data, ConvertFunction);
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

export async function updateAccountInfo(requestBody: UpdateAccountInfoRouteRequestBody): Promise<UpdateAccountInfoRouteSuccessResponse<DesiredNumberType>> {
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

export async function addClaimToIpfs(requestBody: AddClaimToIpfsRouteRequestBody): Promise<AddClaimToIpfsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const response = await axios.post<AddClaimToIpfsRouteSuccessResponse<string>>(`${BACKEND_URL}${AddClaimToIpfsRoute()}`, requestBody);
    return convertAddClaimToIpfsRouteSuccessResponse(response.data, ConvertFunction);
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
    const error = Joi.string().uri().required().validate(requestBody.uri).error;
    if (error) {
      throw new Error(`Invalid URI: ${requestBody.uri}`);
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
      collection.collectionMetadata = !isCollectionMetadataResEmpty ? metadataRes.collectionMetadata : collection.collectionMetadata;
    }

    if (metadataRes.badgeMetadata) {
      const vals = Object.values(metadataRes.badgeMetadata);
      for (const val of vals) {
        if (!val) continue;
        collection.badgeMetadata = updateBadgeMetadata(collection.badgeMetadata, val);
      }
    }
  }

  return collection;
}