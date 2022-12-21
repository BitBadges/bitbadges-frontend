import store from '../redux/store';
import axios from 'axios';
import { userActions } from '../redux/userSlice';
import { NODE_URL } from '../constants';
import { generateEndpointBroadcast, generatePostBodyBroadcast } from 'bitbadgesjs-provider';
import { GetPermissions, Permissions } from './permissions';
import { GetAccountRoute, GetAccountByNumberRoute, GetBadgeBalanceRoute, GetBadgeRoute, GetBalanceRoute } from './routes';
import { GetBadgeResponse, GetBalanceResponse } from './types';


export async function getAccountInformation(
    bech32Address: string,
    updateUserInformation: boolean = true,
) {
    const accountObject = await axios.get(NODE_URL + GetAccountRoute(bech32Address))
        .then((res) => res.data)
        .catch((err) => {
            if (err.response.data.code === 5) {
                return {
                    account: {
                        address: bech32Address,
                    }
                }
            }

            return Promise.reject();
        });

    const accountInformation = accountObject.account;

    if (updateUserInformation) {
        store.dispatch(userActions.setSequence(accountInformation.sequence));
        store.dispatch(userActions.setAddress(accountInformation.address));
        store.dispatch(userActions.setPublicKey(accountInformation.pub_key?.key));
        store.dispatch(userActions.setAccountNumber(accountInformation.account_number));
        store.dispatch(userActions.setIsRegistered(!!accountInformation.account_number));

        // store.dispatch(userActions.setUserCreatedBadges(issuedBadges));
        // store.dispatch(userActions.setUserReceivedBadges(receivedBadges));
        // store.dispatch(userActions.setUserPendingBadges(pendingBadges));
        // store.dispatch(userActions.setUserBalancesMap(newUserBalancesMap));
        // store.dispatch(userActions.setNumPending(numPendingCount));
        // store.dispatch(userActions.setProfileInfo(profileInfo));
    }

    return accountInformation;
}

export async function getBalance(
    bech32Address: string
) {
    const balance = await axios.get(NODE_URL + GetBalanceRoute(bech32Address))
        .then((res) => res.data);

    if (balance.error) {
        return Promise.reject(balance.error);
    }


    return balance;
}


export async function getBadge(
    badgeId: number
): Promise<GetBadgeResponse> {
    const badgeDataResponse = await axios.get(NODE_URL + GetBadgeRoute(badgeId))
        .then((res) => res.data);

    if (badgeDataResponse.error) {
        console.error("ERROR: ", badgeDataResponse.error);
        return Promise.reject(badgeDataResponse.error);
    }

    const badgeData = badgeDataResponse.badge;
    badgeData.id = badgeId;

    // Convert the permissions (uint) to a Permissions object
    badgeData.permissions = GetPermissions(badgeData.permissions);


    //TODO: Replace manager info with actual account information (i.e. Cosmos address)
    // const managerAccountInfo = await axios.get(NODE_URL + GetAccountByNumberRoute(badgeData.manager))
    //     .then((res) => res.data);

    // badgeData.manager = managerAccountInfo;

    //TODO: Normalize subasset supplys with defaultsubassetsupply
    //TODO: todo when I update mint page
    //This is just hardcoded right now
    badgeData.subassetSupplys.push({
        balance: badgeData.defaultSubassetSupply,
        idRanges: [
            {
                start: 0,
                end: badgeData.nextSubassetId - 1
            }
        ]
    });

    return {
        badge: badgeData,
    };
}

export async function getBadgeBalance(
    badgeId: number,
    accountNumber: number
): Promise<GetBalanceResponse> {
    const balance = await axios.get(NODE_URL + GetBadgeBalanceRoute(badgeId, accountNumber))
        .then((res) => res.data);

    if (balance.error) {
        console.error("ERROR: ", balance.error);
        return Promise.reject(balance.error);
    }

    return balance;
}
