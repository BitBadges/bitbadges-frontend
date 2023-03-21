import { ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Card, Input, Row, Tooltip } from "antd";
import { useState } from "react";
import { BitBadgeCollection, ClaimItem } from "../../bitbadges-api/types";
import { MAX_DATE_TIMESTAMP, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from "../../constants";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { useChainContext } from "../../contexts/ChainContext";
import { AddressDisplay } from "../address/AddressDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { TransferDisplay } from "../transfers/TransferDisplay";

export function ClaimDisplay({
    claim,
    collection,
    openModal,
    claimId,
}: {
    claim: ClaimItem,
    collection: BitBadgeCollection,
    openModal: (claimItem: ClaimItem, code?: string, whitelistIndex?: number) => void,
    claimId: number
}) {
    const chain = useChainContext();
    const [currCode, setCurrCode] = useState("");

    const accounts = useAccountsContext();

    let endTimestamp = claim.timeRange.end;
    let validForever = claim.timeRange.end >= MAX_DATE_TIMESTAMP;

    const endDateString = validForever ? `Forever` : new Date(
        endTimestamp * 1000
    ).toLocaleDateString() + ' ' + new Date(
        endTimestamp * 1000
    ).toLocaleTimeString();

    const startDateString = new Date(
        claim.timeRange.start * 1000
    ).toLocaleDateString() + ' ' + new Date(
        claim.timeRange.start * 1000
    ).toLocaleTimeString();

    let isExpired = false;
    let hasStarted = false;

    if (Date.now() > claim.timeRange.start * 1000) {
        hasStarted = true;
    }

    if (Date.now() > endTimestamp * 1000) {
        isExpired = true;
    }

    let timeStr = '';
    if (isExpired) {
        timeStr = 'This claim has expired!';
    } else if (!hasStarted) {
        timeStr = 'Open from ' + startDateString + ' to ' + endDateString;
    } else if (validForever) {
        timeStr = 'This claim never expires!';
    } else {
        timeStr = 'This claim expires at ' + endDateString;
    }

    if (claim.balances.length === 0) return <></>



    let errorMessage = '';
    let cantClaim = false;
    let notConnected = false;
    let whitelistIndex: number | undefined = undefined;
    if (!chain.connected) {
        cantClaim = true;
        notConnected = true;
        errorMessage = 'Please connect your wallet!';
    } else if (claim.hasPassword && !chain.loggedIn) {
        cantClaim = true;
        notConnected = true;
        errorMessage = 'Please sign in with your wallet!';
    } else if (claim.limitPerAccount === 2 && collection.usedClaims.addresses && collection.usedClaims[`${claimId}`]?.addresses[chain.cosmosAddress] >= 1) {
        cantClaim = true;
        errorMessage = 'You have already claimed!';
    } else if (collection.usedClaims[`${claimId}`]?.codes && collection.usedClaims[`${claimId}`].codes[currCode] > 0) {
        cantClaim = true;
        errorMessage = 'This code has already been used!';
    }

    if (claim.limitPerAccount === 1) {
        const addresses = claim.addresses;
        //Get count of chain.cosmosAddress in addresses
        const max = addresses.filter(x => x === chain.cosmosAddress).length;
        let currUsed = 0;
        if (collection.usedClaims.addresses) {
            currUsed = collection.usedClaims[`${claimId}`].addresses[chain.cosmosAddress]
        }

        if (currUsed >= max) {
            cantClaim = true;
            errorMessage = 'You do not have any claims left!';

        } else {
            let targetIndex = currUsed;
            let count = 0;
            for (let i = 0; i < claim.addresses.length; i++) {
                const address = claim.addresses[i];
                if (count === targetIndex) {
                    whitelistIndex = i;
                }

                if (address === chain.cosmosAddress) {
                    count++;
                }
            }
        }
    }




    return <>
        <Card
            style={{
                width: 550,
                margin: 8,
                textAlign: 'center',
                backgroundColor: PRIMARY_BLUE,
                color: PRIMARY_TEXT,
                border: `1px solid white`,
            }}
        >
            <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >
                <Row style={{ display: 'flex', justifyContent: 'center' }} >
                    <h1 style={{ color: PRIMARY_TEXT }}>{'Claim #' + (claimId + 1)}</h1>
                </Row>
                <Row style={{ display: 'flex', justifyContent: 'center' }} >
                    <h3 style={{ color: PRIMARY_TEXT }}><ClockCircleOutlined /> {timeStr}</h3>
                </Row>
                <BalanceDisplay
                    message={'Unclaimed Badges Left'}
                    collection={collection}
                    balance={{
                        approvals: [],
                        balances: claim.balances
                    }}
                    size={35}
                />
                <hr />
                <BalanceDisplay
                    message={'Current Claim'}
                    collection={collection}

                    balance={{
                        approvals: [],
                        balances: [
                            {
                                balance: claim.amount,
                                badgeIds: claim.badgeIds,
                            }
                        ]
                    }}
                    size={35}
                />

                {claim.incrementIdsBy > 0 && <div>
                    <br />
                    <Row style={{ display: 'flex', justifyContent: 'center' }} >
                        <p style={{ color: PRIMARY_TEXT }}>
                            <WarningOutlined style={{ color: 'orange' }} /> Each time a user claims, the claimable badge IDs increment by {claim.incrementIdsBy}. {"So if other claims are processed before yours, you will receive different badge IDs than the ones displayed."}
                        </p>
                    </Row>
                    <br />
                </div>}

                <div style={{ alignItems: 'center', justifyContent: 'center', overflow: 'auto' }} >
                    {notConnected ? <>
                        <hr />
                        <br />
                        <BlockinDisplay hideLogo />
                    </> : <>
                        {claim.codeRoot &&
                            <>
                                <hr />
                                <h3 style={{ color: PRIMARY_TEXT }}>Enter {claim.hasPassword ? 'Password' : 'Code'} to Claim</h3>
                                <Input
                                    placeholder={`Enter ${claim.hasPassword ? 'Password' : 'Code'}`}
                                    value={currCode}
                                    onChange={(e: any) => {
                                        setCurrCode(e.target.value);
                                    }}
                                    style={{
                                        backgroundColor: PRIMARY_BLUE,
                                        color: PRIMARY_TEXT,
                                        textAlign: 'center'
                                    }}
                                />
                            </>
                        }

                        {claim.whitelistRoot &&
                            <>
                                <hr />
                                <br />
                                {!claim.addresses.find(y => y.includes(chain.cosmosAddress))
                                    ? <div>
                                        <h3 style={{ color: PRIMARY_TEXT }}>You are not on the whitelist.</h3>
                                        <div className='flex-between' style={{ justifyContent: 'center' }}>
                                            <AddressDisplay
                                                fontColor={PRIMARY_TEXT}
                                                userInfo={{
                                                    address: chain.address,
                                                    accountNumber: chain.accountNumber,
                                                    cosmosAddress: chain.cosmosAddress,
                                                    chain: chain.chain,
                                                }} />
                                        </div>
                                    </div> :
                                    <div>
                                        {chain.connected && <div>
                                            <h3 style={{ color: PRIMARY_TEXT }}>You have been whitelisted!</h3>
                                        </div>}
                                    </div>}

                                {[claim].map((x) => {
                                    // const address = 
                                    if (!x.addresses.find(y => y.includes(chain.cosmosAddress))) return <></>

                                    // if (collection.usedClaims.find((x) => x === SHA256(claim.fullCode).toString())) return <></>
                                    accounts.fetchAccounts([chain.cosmosAddress]);
                                    return accounts.accounts[accounts.cosmosAddresses[chain.cosmosAddress]] && <>

                                        <TransferDisplay
                                            hideBalances
                                            collection={collection}
                                            fontColor={PRIMARY_TEXT}
                                            from={[
                                                MINT_ACCOUNT
                                            ]}
                                            transfers={[
                                                {
                                                    toAddresses: [accounts.accounts[accounts.cosmosAddresses[chain.cosmosAddress]]?.accountNumber],
                                                    balances: [{
                                                        balance: claim.amount,
                                                        badgeIds: claim.badgeIds,
                                                    }],
                                                    toAddressInfo: [accounts.accounts[accounts.cosmosAddresses[chain.cosmosAddress]]],
                                                }
                                            ]}
                                            setTransfers={() => { }}
                                        />
                                    </>
                                })}
                            </>
                        }
                    </>}

                    <br />
                    <br />

                    <Tooltip style={{ width: '100%', display: 'flex' }} title={errorMessage}>
                        <Button disabled={cantClaim} type='primary' onClick={() => openModal(claim, currCode, whitelistIndex)} style={{ width: '100%' }}>Claim</Button>
                    </Tooltip>

                    {claim.limitPerAccount === 2 && <div style={{ color: SECONDARY_TEXT, textAlign: 'center' }}>
                        <p>*Only one claim allowed per account</p>
                    </div>}
                </div>
            </div>
        </Card >
    </>
}
