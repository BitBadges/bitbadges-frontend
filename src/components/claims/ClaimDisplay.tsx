import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Input, Row, Tooltip, Typography } from "antd";
import { SHA256 } from "crypto-js";
import { useState } from "react";
import { getBlankBalance } from "../../bitbadges-api/balances";
import { parseClaim } from "../../bitbadges-api/claims";
import { BitBadgeCollection, ClaimItem, Claims, DistributionMethod } from "../../bitbadges-api/types";
import { useChainContext } from "../../contexts/ChainContext";
import { MAX_DATE_TIMESTAMP, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { AddressDisplay } from "../address/AddressDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";
import { TransferDisplay } from "../transfers/TransferDisplay";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";

export function ClaimDisplay({
    claim,
    collection,
    openModal,
    claimId,
}: {
    claim: Claims,
    collection: BitBadgeCollection,
    openModal: (code?: string) => void,
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

    const currLeaf: ClaimItem = parseClaim(currCode);

    if (claim.balances.length === 0) return <></>

    return <Card
        // title={<h1>Claim</h1>}
        style={{
            width: 600,

            margin: 8,
            textAlign: 'center',
            backgroundColor: PRIMARY_BLUE,
            color: PRIMARY_TEXT,
            border: `1px solid white`,
        }}
    >
        <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >
            <h1>Claim #{claimId + 1}</h1>
            <h3>Type:{' '}
                {claim.distributionMethod === DistributionMethod.Whitelist && 'Whitelist'}
                {claim.distributionMethod === DistributionMethod.Codes && 'Codes'}
                {claim.distributionMethod === DistributionMethod.FirstComeFirstServe && 'First Come, First Serve'}
            </h3>
            {collection.claims[claimId]?.leaves?.length === 0 &&
                <Row style={{ display: 'flex', justifyContent: 'center' }} >
                    <h2>
                        Claim x{claim.amountPerClaim} of each of the badges below:
                        <BadgeAvatarDisplay
                            collection={collection}
                            badgeIds={claim.badgeIds}
                            userBalance={getBlankBalance()}
                            size={50}
                            showIds
                        />
                        {claim.incrementIdsBy > 0 && <Typography.Text style={{ color: PRIMARY_TEXT }} strong>*Note that IDs increment by {claim.incrementIdsBy} each claim, so you are not guaranteed this exact ID!</Typography.Text>}
                    </h2>
                </Row>}

            <Row style={{ display: 'flex', justifyContent: 'center' }} >
                <h3><ClockCircleOutlined /> Open from {startDateString} to {endDateString}</h3>
            </Row>
            <BalanceDisplay
                message={'Unclaimed Badges'}
                collection={collection}
                balance={{
                    approvals: [],
                    balances: claim.balances
                }}
                size={35}
            />
            <br />

            {Number(claim.type) === 0 && <>
                <div style={{ alignItems: 'center', justifyContent: 'center', overflow: 'auto' }} >

                    {collection.claims[claimId]?.distributionMethod === DistributionMethod.Codes ?
                        <>
                            <hr />
                            <h3>Enter Code to Claim</h3>
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
                            {currCode.length > 0 && currLeaf.badgeIds.length > 0 && <>
                                <Divider />

                                <div style={{ color: PRIMARY_TEXT }}>
                                    <TransferDisplay
                                        transfers={[
                                            {
                                                toAddresses: [],
                                                balances: [{
                                                    balance: currLeaf.amount,
                                                    badgeIds: currLeaf.badgeIds,
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
                                        toCodes={[currLeaf.code]}
                                    />
                                    <Divider />
                                </div>
                            </>}

                            <br />
                            <br />
                            <Button disabled={!chain.connected} type='primary' onClick={() => openModal(currCode)} style={{ width: '100%' }}>Claim</Button>
                        </>
                        :
                        <>
                            <hr />
                            {!chain.connected && <>
                                {claim.distributionMethod === DistributionMethod.Whitelist && <h3>Connect your wallet to see if you are on the whitelist!</h3>}
                                {/* {claim.distributionMethod !== DistributionMethod.Whitelist && <h3>Connect your wallet to claim!</h3>} */}
                                <BlockinDisplay hideLogo />
                            </>}
                            {chain.connected && !collection.claims[claimId]?.leaves?.find((x) => {
                                if (parseClaim(x).address === chain.cosmosAddress) {
                                    if (collection.usedClaims.find((y) => y === SHA256(parseClaim(x).fullCode).toString())) {
                                        return false;
                                    }
                                    return true;
                                }
                                return false;
                            }) ? <div>
                                <h3>No claims found for the connected address</h3>
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
                                        <h3>You have been whitelisted!</h3>
                                    </div>}
                                </div>}
                            {collection.claims[claimId]?.leaves?.map((x) => {
                                const currLeaf: ClaimItem = parseClaim(x);
                                if (currLeaf.address != chain.cosmosAddress) return <></>

                                if (collection.usedClaims.find((x) => x === SHA256(currLeaf.fullCode).toString())) return <></>
                                accounts.fetchAccounts([currLeaf.address]);
                                return accounts.accounts[accounts.cosmosAddresses[currLeaf.address]] && <>

                                    <TransferDisplay
                                        collection={collection}
                                        fontColor={PRIMARY_TEXT}
                                        from={[
                                            MINT_ACCOUNT
                                        ]}
                                        transfers={[
                                            {
                                                toAddresses: [accounts.accounts[accounts.cosmosAddresses[currLeaf.address]]?.accountNumber],
                                                balances: [{
                                                    balance: currLeaf.amount,
                                                    badgeIds: currLeaf.badgeIds,
                                                }],
                                                toAddressInfo: [accounts.accounts[accounts.cosmosAddresses[currLeaf.address]]],
                                            }
                                        ]}
                                        setTransfers={() => { }}
                                        toCodes={[]}
                                    />
                                    <Divider />

                                    <Tooltip placement="bottom" title={!chain.connected ? 'Please connect a wallet to claim!' : 'Claim!'}>
                                        <Button disabled={!chain.connected} type='primary' onClick={() => openModal(x)} style={{ width: '100%' }}>Claim</Button>
                                    </Tooltip>
                                </>
                            })}
                        </>
                    }
                </div>
            </>}
        </div>
    </Card>
}