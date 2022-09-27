import store from '../redux/store';

// import { testSiwe, signAndVerifySiwe } from './siwe';
import axios from 'axios';
import { userActions } from '../redux/userSlice';
import { NODE_URL } from '../constants';
import { generateEndpointBroadcast, generatePostBodyBroadcast } from 'bitbadgesjs-provider';

const GetAccountRoute = (bech32address: string) => {
    return `/cosmos/auth/v1beta1/accounts/${bech32address}`;
}

const GetBalanceRoute = (bech32address: string) => {
    return `/cosmos/bank/balances/${bech32address}`;
}

const GetBadgeRoute = (badgeId: number) => {
    return `/bitbadges/bitbadgeschain/badges/get_badge/${badgeId}`;
}

const GetBadgeBalanceRoute = (badgeId: number, accountNumber: number) => {
    return `/bitbadges/bitbadgeschain/badges/get_balance/${badgeId}/${accountNumber}`;
}

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
) {
    const balance = await axios.get(NODE_URL + GetBadgeRoute(badgeId))
        .then((res) => res.data);

    if (balance.error) {
        return Promise.reject(balance.error);
    }

    return balance;
}

export async function getBadgeBalance(
    badgeId: number,
    accountNumber: number
) {
    const balance = await axios.get(NODE_URL + GetBadgeBalanceRoute(badgeId, accountNumber))
        .then((res) => res.data);

    if (balance.error) {
        return Promise.reject(balance.error);
    }

    return balance;
}

export async function getSenderInformation(getPublicKey: (cosmosAddress: string) => Promise<string>) {
    const currState = store.getState();
    const accountInformation = currState.user;
    let publicKey = accountInformation.publicKey;

    if (accountInformation.address && !publicKey) {
        console.log("TEST")
        publicKey = await getPublicKey(accountInformation.address);
        //TODO: store in local storage
        store.dispatch(userActions.setPublicKey(publicKey));
    } else if (!accountInformation.address) {
        return Promise.reject("No address found");
    }

    return {
        accountAddress: accountInformation.address,
        sequence: accountInformation.sequence,
        accountNumber: accountInformation.accountNumber,
        pubkey: publicKey
    }
}

export async function broadcastTransaction(txRaw: any) {
    // Broadcast it
    const postOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: generatePostBodyBroadcast(txRaw),
    }

    let broadcastPost = await fetch(
        `http://localhost:1317${generateEndpointBroadcast()}`,
        postOptions,
    )
    console.log("Broadcasting Tx...")
    let res = await broadcastPost.json()
    console.log("Tx Response:", res)

    getAccountInformation('cosmos1uqxan5ch2ulhkjrgmre90rr923932w38tn33gu', true) //TODO: should we await here? increment just sequence? async mempool txs listener to update upon finalization
}