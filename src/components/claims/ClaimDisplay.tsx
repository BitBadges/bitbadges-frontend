import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Input, Row, Tooltip } from "antd";
import { useState } from "react";
import { parseClaim } from "../../bitbadges-api/claims";
import { BitBadgeCollection, ClaimItem, Claims, DistributionMethod } from "../../bitbadges-api/types";
import { MAX_DATE_TIMESTAMP, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { useChainContext } from "../../contexts/ChainContext";
import { AddressDisplay } from "../address/AddressDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { TransferDisplay } from "../transfers/TransferDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";


//TODO: IncrementIdsBy
export function ClaimDisplay({
    claim,
    collection,
    openModal,
    claimId,
}: {
    claim: ClaimItem,
    collection: BitBadgeCollection,
    openModal: (claimItem: ClaimItem, code?: string) => void,
    claimId: number,
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

    if (claim.balances.length === 0) return <></>

    const claimItem = claim;

    return <>
        <Card
            style={{
                width: 500,
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
                    <h3 style={{ color: PRIMARY_TEXT }}><ClockCircleOutlined /> Open from {startDateString} to {endDateString}</h3>
                </Row>
                <BalanceDisplay
                    message={'Claimable Badges'}
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

                <br />
                <Row style={{ display: 'flex', justifyContent: 'center' }} >
                    <h3 style={{ color: PRIMARY_TEXT }}>Increment by {claimItem.incrementIdsBy}</h3>
                </Row>
                <br />
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
                            <hr />
                            <h3 style={{ color: PRIMARY_TEXT }}>Enter Code to Claim</h3>
                            <Input
                                placeholder="Enter Code"
                                value={currCode}
                                onChange={(e: any) => {
                                    setCurrCode(e.target.value);
                                }}
                                style={{
                                    backgroundColor: PRIMARY_BLUE,
                                    color: PRIMARY_TEXT,
                                }}
                            />
                            {currCode.length > 0 && claimItem.badgeIds.length > 0 && <>
                                <Divider />

                                <div style={{ color: PRIMARY_TEXT }}>
                                    <TransferDisplay
                                        transfers={[
                                            {
                                                toAddresses: [],
                                                balances: [{
                                                    balance: claimItem.amount,
                                                    badgeIds: claimItem.badgeIds,
                                                }],
                                                toAddressInfo: [],
                                            }
                                        ]}
                                        setTransfers={() => { }}
                                        collection={collection}
                                        fontColor={PRIMARY_TEXT}
                                        from={[
                                            MINT_ACCOUNT
                                        ]}
                                        toCodes={claimItem.codes}
                                    />
                                    <Divider />
                                </div>
                            </>}

                            <br />
                            <br />
                            <Button disabled={!chain.connected} type='primary' onClick={() => openModal(claimItem, currCode)} style={{ width: '100%' }}>Claim</Button>
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

                                    <Tooltip placement="bottom" title={!chain.connected ? 'Please connect a wallet to claim!' : 'Claim!'}>
                                        <Button disabled={!chain.connected} type='primary' onClick={() => openModal(claimItem, '')} style={{ width: '100%' }}>Claim</Button>
                                    </Tooltip>
                                </>
                            })}
                        </>
                    }
                </div>
            </div>
        </Card>
    </>
}
