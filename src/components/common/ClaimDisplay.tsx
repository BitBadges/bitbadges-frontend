import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Input, Row, Tooltip, Typography } from "antd";
import { SHA256 } from "crypto-js";
import { useState } from "react";
import { getBlankBalance } from "../../bitbadges-api/balances";
import { parseClaim } from "../../bitbadges-api/claims";
import { BitBadgeCollection, ClaimItem, Claims, DistributionMethod, SupportedChain } from "../../bitbadges-api/types";
import { useChainContext } from "../../chain/ChainContext";
import { MAX_DATE_TIMESTAMP, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT } from "../../constants";
import { AddressDisplay } from "../address/AddressDisplay";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";
import { BlockinDisplay } from "../blockin/BlockinDisplay";
import { BalanceDisplay } from "./BalanceDisplay";
import { TransferDisplay } from "./TransferDisplay";

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

    let endTimestamp = claim.timeRange.end;
    let validForever = claim.timeRange.end >= MAX_DATE_TIMESTAMP;

    const endDateString = validForever ? `Forever` : new Date(
        endTimestamp * 1000
    ).toLocaleDateString();

    const startDateString = new Date(
        claim.timeRange.start * 1000
    ).toLocaleDateString();

    const currLeaf: ClaimItem = parseClaim(currCode);

    if (claim.balances.length === 0) return <></>

    return <Card
        // title={<h1>Claim</h1>}
        style={{
            minWidth: 400,
            margin: 8,
            textAlign: 'center',
            backgroundColor: PRIMARY_BLUE,
            color: PRIMARY_TEXT,
            border: `1px solid white`,
        }}
    >
        <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >
            {/* <h1>Claim #{claimId}</h1> */}
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
                <h3><ClockCircleOutlined /> Open from {startDateString} until {endDateString}</h3>
            </Row>
            <BalanceDisplay
                message={'Badges Left Available to Claim'}
                collection={collection}
                balance={{
                    approvals: [],
                    balances: claim.balances
                }}
            />
            <br />

            {/* <Row style={{ display: 'flex', justifyContent: 'center' }} >
                <h3>Only {Math.floor(claim.balance.balance / claim.amountPerClaim)} more users can claim!</h3>
            </Row> */}
            {Number(claim.type) === 0 && <>
                {/* <h3>Whitelist ({collection.claims[claimId]?.leaves?.length})</h3> */}
                <div style={{ alignItems: 'center', justifyContent: 'center', overflow: 'auto' }} >

                    {collection.claims[claimId]?.distributionMethod === DistributionMethod.Codes ?
                        <>
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
                            {currCode.length > 0 && <>
                                <Divider />

                                <div style={{ color: PRIMARY_TEXT }}>
                                    <TransferDisplay
                                        collection={collection}
                                        fontColor={PRIMARY_TEXT}
                                        from={[
                                            MINT_ACCOUNT
                                        ]}
                                        to={[]}
                                        toCodes={[currLeaf.code]}
                                        amount={currLeaf.amount}
                                        badgeIds={currLeaf.badgeIds}
                                    />
                                    <Divider />
                                </div>
                            </>}


                            <Button disabled={!chain.connected} type='primary' onClick={() => openModal(currCode)} style={{ width: '100%' }}>Claim via Code</Button>
                        </>
                        :
                        <>
                            {!chain.connected && <BlockinDisplay hideLogo />}
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
                                        <p>See your available claims below</p>
                                    </div>}
                                </div>}
                            {collection.claims[claimId]?.leaves?.map((x) => {
                                const currLeaf: ClaimItem = parseClaim(x);
                                if (currLeaf.address != chain.cosmosAddress) return <></>

                                if (collection.usedClaims.find((x) => x === SHA256(currLeaf.fullCode).toString())) return <></>

                                return <>
                                    <Divider />
                                    <hr />
                                    <TransferDisplay
                                        collection={collection}
                                        fontColor={PRIMARY_TEXT}
                                        from={[
                                            MINT_ACCOUNT
                                        ]}
                                        to={[{
                                            address: currLeaf.address,
                                            accountNumber: 0,
                                            cosmosAddress: currLeaf.address,
                                            chain: SupportedChain.COSMOS,
                                        }]}
                                        toCodes={[]}
                                        amount={currLeaf.amount}
                                        badgeIds={currLeaf.badgeIds}
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