import { notification } from 'antd';
import {
  AddApprovalDetailsToOffChainStorageRouteRequestBody,
  AddApprovalDetailsToOffChainStorageRouteSuccessResponse,
  AddBalancesToOffChainStorageRouteRequestBody,
  AddBalancesToOffChainStorageRouteSuccessResponse,
  AddMetadataToIpfsRouteRequestBody,
  AddMetadataToIpfsRouteSuccessResponse,
  AddReviewForCollectionRouteRequestBody,
  AddReviewForCollectionRouteSuccessResponse,
  AddReviewForUserRouteRequestBody,
  AddReviewForUserRouteSuccessResponse,
  BigIntify,
  BitBadgesAPI,
  BroadcastTxRouteRequestBody,
  BroadcastTxRouteSuccessResponse,
  CheckSignInStatusRequestBody,
  CheckSignInStatusRequestSuccessResponse,
  CreateBlockinAuthCodeRouteRequestBody,
  CreateBlockinAuthCodeRouteSuccessResponse,
  DeleteAddressListsRouteRequestBody,
  DeleteAddressListsRouteSuccessResponse,
  DeleteBlockinAuthCodeRouteRequestBody,
  DeleteBlockinAuthCodeRouteSuccessResponse,
  DeleteReviewRouteRequestBody,
  DeleteReviewRouteSuccessResponse,
  ErrorResponse,
  FetchMetadataDirectlyRouteRequestBody,
  FetchMetadataDirectlyRouteSuccessResponse,
  FilterBadgesInCollectionRequestBody,
  FilterBadgesInCollectionSuccessResponse,
  GenericBlockinVerifyRouteRequestBody,
  GenericBlockinVerifyRouteSuccessResponse,
  GetAccountsRouteRequestBody,
  GetAccountsRouteSuccessResponse,
  GetAddressListsRouteRequestBody,
  GetAddressListsRouteSuccessResponse,
  GetAllCodesAndPasswordsRouteRequestBody,
  GetAllCodesAndPasswordsRouteSuccessResponse,
  GetBadgeActivityRouteRequestBody,
  GetBadgeActivityRouteSuccessResponse,
  GetBadgeBalanceByAddressRouteRequestBody,
  GetBadgeBalanceByAddressRouteSuccessResponse,
  GetBlockinAuthCodeRouteRequestBody,
  GetBlockinAuthCodeRouteSuccessResponse,
  GetBrowseCollectionsRouteRequestBody,
  GetBrowseCollectionsRouteSuccessResponse,
  GetClaimAlertsForCollectionRouteRequestBody,
  GetClaimAlertsForCollectionRouteSuccessResponse,
  CheckAndCompleteClaimRouteRequestBody,
  CheckAndCompleteClaimRouteSuccessResponse,
  GetCollectionBatchRouteRequestBody,
  GetCollectionBatchRouteSuccessResponse,
  GetCollectionForProtocolRouteRequestBody,
  GetCollectionForProtocolRouteSuccessResponse,
  GetFollowDetailsRouteRequestBody,
  GetFollowDetailsRouteSuccessResponse,
  GetOwnersForBadgeRouteRequestBody,
  GetOwnersForBadgeRouteSuccessResponse,
  GetProtocolsRouteRequestBody,
  GetProtocolsRouteSuccessResponse,
  GetSearchRouteRequestBody,
  GetSearchRouteSuccessResponse,
  GetSignInChallengeRouteRequestBody,
  GetSignInChallengeRouteSuccessResponse,
  GetStatusRouteSuccessResponse,
  GetTokensFromFaucetRouteRequestBody,
  GetTokensFromFaucetRouteSuccessResponse,
  NumberType,
  RefreshMetadataRouteRequestBody,
  RefreshMetadataRouteSuccessResponse,
  RefreshStatusRouteSuccessResponse,
  SendClaimAlertsRouteRequestBody,
  SendClaimAlertsRouteSuccessResponse,
  SignOutRequestBody,
  SignOutSuccessResponse,
  SimulateTxRouteRequestBody,
  SimulateTxRouteSuccessResponse,
  UpdateAccountInfoRouteRequestBody,
  UpdateAccountInfoRouteSuccessResponse,
  UpdateAddressListsRouteRequestBody,
  UpdateAddressListsRouteSuccessResponse,
  VerifySignInRouteRequestBody,
  VerifySignInRouteSuccessResponse
} from 'bitbadgesjs-sdk';
import Joi from 'joi';
import { BACKEND_URL } from '../constants';

export type DesiredNumberType = bigint;
export const ConvertFunction = BigIntify;

export const BitBadgesApi = new BitBadgesAPI({
  apiUrl: BACKEND_URL,
  convertFunction: BigIntify
  //apiKey: none specified since we auto-allwo CORS from the .io domain
});

async function handleApiError(error: any): Promise<void> {
  console.error(error);

  if (error?.response?.data) {
    const data: ErrorResponse = error.response.data;

    //if localhost, show errors but not on actual site
    notification.error({
      message: 'Oops! We ran into an error!',
      description: data.errorMessage ? data.errorMessage : 'Unknown error'
    });
  } else {
    notification.error({
      message: 'Oops! We ran into an error!',
      description: error.errorMessage ? error.errorMessage : error.message ? error.message : 'Unknown error: ' + error
    });
  }

  await Promise.reject(error);
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

export async function getStatus(): Promise<GetStatusRouteSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.getStatus();
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getSearchResults(
  searchValue: string,
  requestBody?: GetSearchRouteRequestBody
): Promise<GetSearchRouteSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.getSearchResults(searchValue, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getCollections(
  requestBody: GetCollectionBatchRouteRequestBody
): Promise<GetCollectionBatchRouteSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.getCollections(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getOwnersForBadge(
  collectionId: NumberType,
  badgeId: NumberType,
  requestBody: GetOwnersForBadgeRouteRequestBody
): Promise<GetOwnersForBadgeRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);
    assertPositiveInteger(badgeId);

    return await BitBadgesApi.getOwnersForBadge(collectionId, badgeId, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getBadgeBalanceByAddress(
  collectionId: NumberType,
  cosmosAddress: string,
  requestBody?: GetBadgeBalanceByAddressRouteRequestBody
): Promise<GetBadgeBalanceByAddressRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);

    return await BitBadgesApi.getBadgeBalanceByAddress(collectionId, cosmosAddress, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}
export async function getBadgeActivity(
  collectionId: NumberType,
  badgeId: NumberType,
  requestBody: GetBadgeActivityRouteRequestBody
): Promise<GetBadgeActivityRouteSuccessResponse<DesiredNumberType>> {
  try {
    assertPositiveInteger(collectionId);
    assertPositiveInteger(badgeId);

    return await BitBadgesApi.getBadgeActivity(collectionId, badgeId, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function refreshMetadata(
  collectionId: NumberType,
  requestBody?: RefreshMetadataRouteRequestBody
): Promise<RefreshMetadataRouteSuccessResponse> {
  try {
    assertPositiveInteger(collectionId);

    return await BitBadgesApi.refreshMetadata(collectionId, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getAllPasswordsAndCodes(
  collectionId: NumberType,
  requestBody?: GetAllCodesAndPasswordsRouteRequestBody
): Promise<GetAllCodesAndPasswordsRouteSuccessResponse> {
  try {
    assertPositiveInteger(collectionId);

    return await BitBadgesApi.getAllPasswordsAndCodes(collectionId, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function checkAndCompleteClaim(
  claimId: string,
  cosmosAddress: string,
  requestBody: CheckAndCompleteClaimRouteRequestBody
): Promise<CheckAndCompleteClaimRouteSuccessResponse> {
  try {
    return await BitBadgesApi.checkAndCompleteClaim(claimId, cosmosAddress, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function deleteReview(reviewId: string, requestBody?: DeleteReviewRouteRequestBody): Promise<DeleteReviewRouteSuccessResponse> {
  try {
    return await BitBadgesApi.deleteReview(reviewId, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function addReviewForCollection(
  collectionId: NumberType,
  requestBody: AddReviewForCollectionRouteRequestBody
): Promise<AddReviewForCollectionRouteSuccessResponse> {
  try {
    assertPositiveInteger(collectionId);

    return await BitBadgesApi.addReviewForCollection(collectionId, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getAccounts(requestBody: GetAccountsRouteRequestBody): Promise<GetAccountsRouteSuccessResponse<DesiredNumberType>> {
  try {
    const res = await BitBadgesApi.getAccounts(requestBody);

    return res;
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function addReviewForUser(
  addressOrUsername: string,
  requestBody: AddReviewForUserRouteRequestBody
): Promise<AddReviewForUserRouteSuccessResponse> {
  try {
    return await BitBadgesApi.addReviewForUser(addressOrUsername, requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function updateAccountInfo(requestBody: UpdateAccountInfoRouteRequestBody): Promise<UpdateAccountInfoRouteSuccessResponse> {
  try {
    return await BitBadgesApi.updateAccountInfo(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function addBalancesToOffChainStorage(
  requestBody: AddBalancesToOffChainStorageRouteRequestBody
): Promise<AddBalancesToOffChainStorageRouteSuccessResponse> {
  try {
    return await BitBadgesApi.addBalancesToOffChainStorage(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function addMetadataToIpfs(requestBody: AddMetadataToIpfsRouteRequestBody): Promise<AddMetadataToIpfsRouteSuccessResponse> {
  try {
    return await BitBadgesApi.addMetadataToIpfs(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function addApprovalDetailsToOffChainStorage(
  requestBody: AddApprovalDetailsToOffChainStorageRouteRequestBody
): Promise<AddApprovalDetailsToOffChainStorageRouteSuccessResponse> {
  try {
    return await BitBadgesApi.addApprovalDetailsToOffChainStorage(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getSignInChallenge(
  requestBody: GetSignInChallengeRouteRequestBody
): Promise<GetSignInChallengeRouteSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.getSignInChallenge(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function verifySignIn(requestBody: VerifySignInRouteRequestBody): Promise<VerifySignInRouteSuccessResponse> {
  try {
    return await BitBadgesApi.verifySignIn(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function checkIfSignedIn(requestBody: CheckSignInStatusRequestBody): Promise<CheckSignInStatusRequestSuccessResponse> {
  try {
    return await BitBadgesApi.checkIfSignedIn(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function signOut(requestBody: SignOutRequestBody): Promise<SignOutSuccessResponse> {
  try {
    return await BitBadgesApi.signOut(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getBrowseCollections(
  requestBody?: GetBrowseCollectionsRouteRequestBody
): Promise<GetBrowseCollectionsRouteSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.getBrowseCollections(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function broadcastTx(requestBody: BroadcastTxRouteRequestBody | string): Promise<BroadcastTxRouteSuccessResponse> {
  try {
    return await BitBadgesApi.broadcastTx(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function simulateTx(requestBody: SimulateTxRouteRequestBody | string): Promise<SimulateTxRouteSuccessResponse> {
  try {
    return await BitBadgesApi.simulateTx(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function fetchMetadataDirectly(
  requestBody: FetchMetadataDirectlyRouteRequestBody
): Promise<FetchMetadataDirectlyRouteSuccessResponse<DesiredNumberType>> {
  try {
    const error = requestBody.uris.find((uri) => Joi.string().uri().required().validate(uri).error);
    if (error) {
      throw `Invalid URIs`;
    }

    return await BitBadgesApi.fetchMetadataDirectly(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getTokensFromFaucet(requestBody?: GetTokensFromFaucetRouteRequestBody): Promise<GetTokensFromFaucetRouteSuccessResponse> {
  try {
    return await BitBadgesApi.getTokensFromFaucet(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function updateAddressLists(
  requestBody: UpdateAddressListsRouteRequestBody<DesiredNumberType>
): Promise<UpdateAddressListsRouteSuccessResponse> {
  try {
    return await BitBadgesApi.updateAddressLists(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getAddressLists(requestBody: GetAddressListsRouteRequestBody): Promise<GetAddressListsRouteSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.getAddressLists(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function deleteAddressLists(requestBody: DeleteAddressListsRouteRequestBody): Promise<DeleteAddressListsRouteSuccessResponse> {
  try {
    return await BitBadgesApi.deleteAddressLists(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function createAuthCode(requestBody?: CreateBlockinAuthCodeRouteRequestBody): Promise<CreateBlockinAuthCodeRouteSuccessResponse> {
  try {
    return await BitBadgesApi.createAuthCode(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getAuthCode(requestBody?: GetBlockinAuthCodeRouteRequestBody): Promise<GetBlockinAuthCodeRouteSuccessResponse> {
  try {
    return await BitBadgesApi.getAuthCode(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function deleteAuthCode(requestBody?: DeleteBlockinAuthCodeRouteRequestBody): Promise<DeleteBlockinAuthCodeRouteSuccessResponse> {
  try {
    return await BitBadgesApi.deleteAuthCode(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function verifySignInGeneric(requestBody: GenericBlockinVerifyRouteRequestBody): Promise<GenericBlockinVerifyRouteSuccessResponse> {
  try {
    return await BitBadgesApi.verifySignInGeneric(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function sendClaimAlert(requestBody: SendClaimAlertsRouteRequestBody): Promise<SendClaimAlertsRouteSuccessResponse> {
  try {
    return await BitBadgesApi.sendClaimAlert(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getFollowDetails(
  requestBody: GetFollowDetailsRouteRequestBody
): Promise<GetFollowDetailsRouteSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.getFollowDetails(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getClaimAlerts(
  requestBody: GetClaimAlertsForCollectionRouteRequestBody
): Promise<GetClaimAlertsForCollectionRouteSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.getClaimAlerts(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getRefreshStatus(collectionId: DesiredNumberType): Promise<RefreshStatusRouteSuccessResponse<NumberType>> {
  try {
    return await BitBadgesApi.getRefreshStatus(collectionId);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getProtocol(requestBody: GetProtocolsRouteRequestBody): Promise<GetProtocolsRouteSuccessResponse> {
  try {
    return await BitBadgesApi.getProtocol(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function getCollectionForProtocol(
  requestBody: GetCollectionForProtocolRouteRequestBody
): Promise<GetCollectionForProtocolRouteSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.getCollectionForProtocol(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}

export async function filterBadgesInCollection(
  requestBody: FilterBadgesInCollectionRequestBody
): Promise<FilterBadgesInCollectionSuccessResponse<DesiredNumberType>> {
  try {
    return await BitBadgesApi.filterBadgesInCollection(requestBody);
  } catch (error) {
    await handleApiError(error);
    return await Promise.reject(error);
  }
}
