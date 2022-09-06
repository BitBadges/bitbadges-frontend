import store from '../redux/store';

// import { testSiwe, signAndVerifySiwe } from './siwe';
import axios from 'axios';
import { userActions } from '../redux/userSlice';
import { NODE_URL, PRIVATE_API_URL } from '../constants';
import { message } from 'antd';
import { useChainContext } from '../chain_handlers_frontend/ChainContext';

export async function getBadgeDataForAddress(
    chain: string,
    userAddress: string,
    isSignedInUser: boolean
) {
    let badgesToFetch: any[] = [];
    let userNonce,
        issuedBadges,
        receivedBadges,
        pendingBadges,
        likedBadges,
        managingBadges;
    let numPendingCount = 0;
    let newUserBalancesMap: any = {};

    await axios
        .post(`${NODE_URL}/users`, {
            chain,
            address: userAddress,
        })
        .then((res) => {
            userNonce = res.data.nonce;
            issuedBadges = res.data.created;
            managingBadges = res.data.managing;

            badgesToFetch.push(...res.data.created);

            let received = Object.keys(res.data.balances);
            let pending = [];

            for (const badgeKey of Object.keys(res.data.balances)) {
                newUserBalancesMap[badgeKey] = newUserBalancesMap[badgeKey]
                    ? newUserBalancesMap[badgeKey]
                    : {};

                newUserBalancesMap[badgeKey].received =
                    res.data.balances[badgeKey];
            }

            for (const approval of res.data.approvals) {
                const badgeKey = approval.badgeId;

                newUserBalancesMap[badgeKey] = newUserBalancesMap[badgeKey]
                    ? newUserBalancesMap[badgeKey]
                    : {};

                newUserBalancesMap[badgeKey].approvals = newUserBalancesMap[
                    badgeKey
                ].approvals
                    ? newUserBalancesMap[badgeKey].approvals
                    : [];

                newUserBalancesMap[badgeKey].approvals.push(approval);
            }

            for (const obj of res.data.inPending) {
                newUserBalancesMap[obj.badgeId] = newUserBalancesMap[
                    obj.badgeId
                ]
                    ? newUserBalancesMap[obj.badgeId]
                    : {};

                newUserBalancesMap[obj.badgeId].inPending = newUserBalancesMap[
                    obj.badgeId
                ].inPending
                    ? newUserBalancesMap[obj.badgeId].inPending
                    : [];

                newUserBalancesMap[obj.badgeId].inPending.push(obj);
                pending.push(obj.badgeId);
            }

            for (const obj of res.data.outPending) {
                newUserBalancesMap[obj.badgeId] = newUserBalancesMap[
                    obj.badgeId
                ]
                    ? newUserBalancesMap[obj.badgeId]
                    : {};

                newUserBalancesMap[obj.badgeId].outPending = newUserBalancesMap[
                    obj.badgeId
                ].outPending
                    ? newUserBalancesMap[obj.badgeId].outPending
                    : [];

                newUserBalancesMap[obj.badgeId].outPending.push(obj);
                pending.push(obj.badgeId);
            }

            pending = [...new Set(pending)];

            numPendingCount += res.data.inPending.length;

            receivedBadges = received;
            pendingBadges = pending;

            badgesToFetch.push(...received);
            badgesToFetch.push(...pending);
        });

    let profileInfo: any = {};
    await axios
        .post(`${PRIVATE_API_URL}/users`, {
            chain,
            address: userAddress,
        })
        .then((res) => {
            profileInfo = res.data;
            likedBadges = profileInfo.likes;
            badgesToFetch.push(...profileInfo.likes);
        });

    badgesToFetch = [...new Set(badgesToFetch)];
    if (badgesToFetch.length !== 0) {
        await axios
            .post(`${NODE_URL}/badges/getByIds`, {
                badgeIds: badgesToFetch,
            })
            .then((res) => {
                let newBadgeMap: any = {};
                for (const badge of res.data.badges) {
                    newBadgeMap[badge._id] = {
                        metadata: badge.metadata,
                        permissions: badge.permissions,
                        supply: badge.supply,
                        manager: badge.manager,
                        mintApprovals: badge.mintApprovals,
                        mintRequests: badge.mintRequests,
                        _id: badge._id,
                    };
                }
                store.dispatch(userActions.setBadgeMap(newBadgeMap));
            });
    }

    if (isSignedInUser) {
        store.dispatch(userActions.setNonce(userNonce));
        store.dispatch(userActions.setUserCreatedBadges(issuedBadges));
        store.dispatch(userActions.setUserReceivedBadges(receivedBadges));
        store.dispatch(userActions.setUserPendingBadges(pendingBadges));
        store.dispatch(userActions.setUserBalancesMap(newUserBalancesMap));
        store.dispatch(userActions.setNumPending(numPendingCount));
        store.dispatch(userActions.setProfileInfo(profileInfo));
    }

    return {
        issued: issuedBadges,
        received: receivedBadges,
        pending: pendingBadges,
        liked: likedBadges,
        managing: managingBadges,
        profileInfo,
    };
}

export async function signAndSubmitTxn(route: string, data: any) {
    // const currState = store.getState();

    // const address = chain.address

    // const txnParams = txnParamsMap[route];


    // const transaction = data;
    // console.log(transaction)

    // console.log(transaction);
    // console.log(txnParams)
    // console.log(transaction)
    // console.log(userSigner); //TODO: userSigner is undefined
    // const signature = await userSigner._signTypedData(
    //     EIP712_BITBADGES_DOMAIN,
    //     txnParams.eip712Types,
    //     transaction
    // );

    // const body = {
    //     authentication: {
    //         chain,
    //         address,
    //         signature,
    //     },
    //     transaction,
    // };

    // let error = false;
    // await axios
    //     .post(`${NODE_URL}${route}`, body)
    //     .then(() => {
    //         message.success(`Successfully submitted transaction.`);
    //     })
    //     .catch((err) => {
    //         message.error(
    //             `Failed to Submit Transaction: ${err.response.data.error}`
    //         );
    //         error = true;
    //     });

    // if (error) {
    //     return error;
    // } else {
    //     getBadgeDataForAddress(chain, address, true);
    //     return error;
    // }
}

export async function signAndSubmitPrivateApiTxn(route: any, data: any) {
    const currState = store.getState();
    const chain = currState.user.chain;
    const address = currState.user.address;

    const transaction = {
        data,
    };

    // const signature = await userSigner._signTypedData(
    //     EIP712_BITBADGES_DOMAIN,
    //     txnParams.eip712Types,
    //     transaction
    // );
    // const { signedIn, resAddress } = await testSiwe(address);
    // if (!signedIn || address !== resAddress) {
    //     await signAndVerifySiwe();
    // }

    const body = {
        authentication: {
            chain,
            address,
            // signature,
        },
        transaction,
    };

    let error = false;
    await axios
        .post(`${PRIVATE_API_URL}${route}`, body, { withCredentials: true })
        .then(() => {
            message.success(`Successfully submitted transaction.`);
        })
        .catch((err) => {
            message.error(
                `Failed to Submit Transaction: ${err.response.data.error}`
            );
            error = true;
        });

    if (error) {
        return error;
    } else {
        getBadgeDataForAddress(chain, address, true);
        return error;
    }
}
