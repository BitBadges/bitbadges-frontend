import { ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Input, Row, Tooltip } from "antd";
import { useState } from "react";
import { BitBadgeCollection, ClaimItem } from "../../bitbadges-api/types";
import { MAX_DATE_TIMESTAMP, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from "../../constants";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { useChainContext } from "../../contexts/ChainContext";
import { AddressDisplay } from "../address/AddressDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { TransferDisplay } from "../transfers/TransferDisplay";


//TODO: IncrementIdsBy
export function ClaimDisplay({
    claim,
    collection,
    openModal,
    claimId
}: {
    claim: ClaimItem,
    collection: BitBadgeCollection,
    openModal: (claimItem: ClaimItem, code?: string) => void,
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

    const claimItem = claim;

    //TODO: need to handle other limits per account
    const alreadyClaimed = claimItem.limitPerAccount === 2 && collection.usedClaims.addresses?.length > 0 ? collection.usedClaims.addresses[chain.cosmosAddress] >= 1 : false

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
                {/* <h1 style={{ color: PRIMARY_TEXT }}>Claim #{claimId + 1}</h1> */}
                {/* <h3 style={{ color: PRIMARY_TEXT }}>Type:{' '}
                    {claim.distributionMethod === DistributionMethod.Whitelist && 'Whitelist'}
                    {claim.distributionMethod === DistributionMethod.Codes && 'Codes'}
                    {claim.distributionMethod === DistributionMethod.FirstComeFirstServe && 'First Come, First Serve'}
                </h3> */}

                <Row style={{ display: 'flex', justifyContent: 'center' }} >
                    <h3 style={{ color: PRIMARY_TEXT }}><ClockCircleOutlined /> {timeStr}</h3>
                </Row>
                <BalanceDisplay
                    message={'Badges Left to Claim'}
                    collection={collection}
                    balance={{
                        approvals: [],
                        balances: claimItem.balances
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
                                balance: claimItem.amount,
                                badgeIds: claimItem.badgeIds,
                            }
                        ]
                    }}
                    size={35}
                />


                {claimItem.incrementIdsBy > 0 && <div>
                    <br />
                    <Row style={{ display: 'flex', justifyContent: 'center' }} >
                        <p style={{ color: PRIMARY_TEXT }}>
                            <WarningOutlined style={{ color: 'orange' }} /> Each processed claim increments the claimable badge IDs by {claimItem.incrementIdsBy}. {"If other users' claims get processed before yours, you may receive a different badge ID than the one displayed above."}

                        </p>
                    </Row>
                    <br />
                </div>}
                {/* <BalanceDisplay
                    message={'Unclaimed Badges'}
                    collection={collection}
                    balance={{
                        approvals: [],
                        balances: claim.balances
                    }}
                    size={35}
                />
                <br /> */}
                <div style={{ alignItems: 'center', justifyContent: 'center', overflow: 'auto' }} >

                    {claimItem.codeRoot &&
                        <>
                            {claimItem.hasPassword ?
                                <>
                                    {!chain.connected || !chain.loggedIn ? <>
                                        {< h3 style={{ color: PRIMARY_TEXT }}>Connect your wallet and sign in to claim!</h3>}
                                        {/* {claim.distributionMethod !== DistributionMethod.Whitelist && <h3>Connect your wallet to claim!</h3>} */}
                                        <BlockinDisplay hideLogo />
                                        <br />
                                    </>
                                        : <></>}
                                </>
                                : <>
                                    {!chain.connected && <>
                                        {<h3 style={{ color: PRIMARY_TEXT }}>Connect your wallet to claim!</h3>}
                                        {/* {claim.distributionMethod !== DistributionMethod.Whitelist && <h3>Connect your wallet to claim!</h3>} */}
                                        <BlockinDisplay hideLogo />
                                        <br />
                                    </>
                                    }
                                </>
                            }
                            <hr />
                            <h3 style={{ color: PRIMARY_TEXT }}>Enter {claimItem.hasPassword ? 'Password' : 'Code'} to Claim</h3>
                            <Input
                                placeholder={`Enter ${claimItem.hasPassword ? 'Password' : 'Code'}`}
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
                            <br />
                            <br />
                            <Tooltip style={{ width: '100%', display: 'flex' }} title={alreadyClaimed ? 'You have already claimed. Only one claim allowed per user.' : ''}>
                                <Button disabled={alreadyClaimed || (claimItem.hasPassword ? !chain.connected || !chain.loggedIn : !chain.connected)} type='primary' onClick={() => openModal(claimItem, currCode)} style={{ width: '100%' }}>Claim</Button>
                            </Tooltip>
                        </>
                    }

                    {claimItem.whitelistRoot &&
                        <>
                            <hr />
                            {!chain.connected && <>
                                {<h3 style={{ color: PRIMARY_TEXT }}>Connect your wallet to see if you are on the whitelist!</h3>}
                                {/* {claim.distributionMethod !== DistributionMethod.Whitelist && <h3>Connect your wallet to claim!</h3>} */}
                                <BlockinDisplay hideLogo />
                            </>}
                            {chain.connected && !claim.addresses.find(y => y.includes(chain.cosmosAddress))
                                ? <div>
                                    <h3 style={{ color: PRIMARY_TEXT }}>No claims found for the connected address</h3>
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

                                // if (collection.usedClaims.find((x) => x === SHA256(claimItem.fullCode).toString())) return <></>
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
                                                    balance: claimItem.amount,
                                                    badgeIds: claimItem.badgeIds,
                                                }],
                                                toAddressInfo: [accounts.accounts[accounts.cosmosAddresses[chain.cosmosAddress]]],
                                            }
                                        ]}
                                        setTransfers={() => { }}
                                        toCodes={[]}
                                    />
                                    <Divider />

                                    <Tooltip style={{ width: '100%', display: 'flex' }} title={alreadyClaimed ? 'You have already claimed. Only one claim allowed per user.' : ''}>
                                        <Button disabled={alreadyClaimed || !chain.connected} type='primary' onClick={() => openModal(claimItem, currCode)} style={{ width: '100%' }}>Claim</Button>
                                    </Tooltip>
                                </>
                            })}
                        </>
                    }

                    {!claimItem.whitelistRoot && !claimItem.codeRoot &&
                        <>
                            {!chain.connected && <>
                                {<h3 style={{ color: PRIMARY_TEXT }}>Connect your wallet to claim!</h3>}
                                {/* {claim.distributionMethod !== DistributionMethod.Whitelist && <h3>Connect your wallet to claim!</h3>} */}
                                <BlockinDisplay hideLogo />
                            </>}
                            <br />

                            <Tooltip style={{ width: '100%', display: 'flex' }} title={alreadyClaimed ? 'You have already claimed. Only one claim allowed per user.' : ''}>
                                <Button disabled={alreadyClaimed || !chain.connected} type='primary' onClick={() => openModal(claimItem, '')} style={{ width: '100%' }}>Claim</Button> </Tooltip>
                        </>
                    }
                    {claim.limitPerAccount === 2 && <div style={{ color: SECONDARY_TEXT, textAlign: 'center' }}>
                        <p>*Only one claim allowed per account</p>
                    </div>}
                </div>
            </div>
        </Card >
    </>
}
