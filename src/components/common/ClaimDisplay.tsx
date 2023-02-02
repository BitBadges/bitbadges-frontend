import { useEffect, useState } from "react";
import { BitBadgeCollection, ClaimItem, Claims, DistributionMethod, SupportedChain, UserBalance } from "../../bitbadges-api/types"
import { MAX_DATE_TIMESTAMP, MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from "../../constants";
import { useChainContext } from "../../chain/ChainContext";
import { Button, Row, Tooltip, Divider, Card, Typography, Input } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { TransferDisplay } from "./TransferDisplay";
import { parseClaim } from "../../bitbadges-api/claims";

export function ClaimDisplay({
    claim,
    collection,
    setCollection,
    openModal,
    claimId,
}: {
    claim: Claims,
    collection: BitBadgeCollection,
    setCollection: (collection: BitBadgeCollection) => void,
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

    return <Card
        // title={<h1>Claim</h1>}
        style={{
            minWidth: 400,
            margin: 8,
            textAlign: 'center',
            backgroundColor: PRIMARY_BLUE,
            color: PRIMARY_TEXT,
            border: `1px solid gray`,
        }}
    >
        <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >

            {collection.claims[claimId]?.leaves.length === 0 &&
                <Row style={{ display: 'flex', justifyContent: 'center' }} >
                    <h2>
                        Claim x{claim.amountPerClaim} of each of the badges below:
                        {claim.badgeIds.map((id, idx) => {
                            console.log(id)
                            return <BadgeAvatarDisplay
                                key={idx}
                                badgeCollection={collection}
                                setBadgeCollection={setCollection}
                                startId={Number(id.start)}
                                endId={Number(id.end)}
                                userBalance={{} as UserBalance}
                                size={50}
                            />
                        })}
                        {claim.incrementIdsBy > 0 && <Typography.Text style={{ color: PRIMARY_TEXT }} strong>*Note that IDs increment by {claim.incrementIdsBy} each claim, so you are not guaranteed this exact ID!</Typography.Text>}
                    </h2>
                </Row>}

            <Row style={{ display: 'flex', justifyContent: 'center' }} >
                <h3><ClockCircleOutlined /> Open from {startDateString} until {endDateString}</h3>
            </Row>
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
                            <Divider />

                            <div style={{ color: PRIMARY_TEXT }}>
                                <TransferDisplay
                                    badge={collection}
                                    setBadgeCollection={setCollection}
                                    fontColor={PRIMARY_TEXT}
                                    from={[
                                        MINT_ACCOUNT
                                    ]}
                                    to={[]}
                                    toCodes={[currLeaf.code]}
                                    amount={currLeaf.amount}
                                    startId={currLeaf.badgeIds[0]?.start}
                                    endId={currLeaf.badgeIds[0]?.end}
                                />
                                <Divider />
                            </div>


                            <Button disabled={!chain.connected} type='primary' onClick={() => openModal(currCode)} style={{ width: '100%' }}>Claim via Code</Button>
                        </>
                        :

                        <>
                            {collection.claims[claimId]?.leaves?.map((x) => {
                                const currLeaf: ClaimItem = parseClaim(x);

                                return <>
                                    <hr />
                                    <TransferDisplay
                                        badge={collection}
                                        setBadgeCollection={setCollection}
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
                                        startId={currLeaf.badgeIds[0]?.start}
                                        endId={currLeaf.badgeIds[0]?.end}
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