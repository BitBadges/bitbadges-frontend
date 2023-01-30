import { useEffect, useState } from "react";
import { BitBadgeCollection, Claims, SupportedChain, UserBalance } from "../../bitbadges-api/types"
import { MAX_DATE_TIMESTAMP, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from "../../constants";
import { getFromIpfs } from "../../chain/backend_connectors";
import { useChainContext } from "../../chain/ChainContext";
import { Button, Row, Tooltip, Divider, Card, Typography } from "antd";
import { CreateTxMsgClaimBadgeModal } from "../txModals/CreateTxMsgClaimBadge";
import MerkleTree from "merkletreejs";
import { SHA256 } from "crypto-js";
import { ClockCircleOutlined } from "@ant-design/icons";
import { AddressDisplay, AddressDisplayList } from "../address/AddressDisplay";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { ClaimMerkleTree } from "../../pages/badges/[collectionId]";

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
    const [modalVisible, setModalVisible] = useState(false);

    let endTimestamp = claim.timeRange.end;
    let validForever = claim.timeRange.end >= MAX_DATE_TIMESTAMP;

    const endDateString = validForever ? `Forever` : new Date(
        endTimestamp * 1000
    ).toLocaleDateString();

    const startDateString = new Date(
        claim.timeRange.start * 1000
    ).toLocaleDateString();




    return <Card
        // title={<h1>Claim</h1>}
        style={{
            width: 400,
            margin: 8,
            textAlign: 'center',
            backgroundColor: PRIMARY_BLUE,
            color: PRIMARY_TEXT,
            border: `1px solid gray`,
        }}
    >
        <div style={{ textAlign: 'center', alignItems: 'center', justifyContent: 'center' }} >
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
            </Row>

            <Row style={{ display: 'flex', justifyContent: 'center' }} >
                <h3><ClockCircleOutlined /> Open from {startDateString} until {endDateString}</h3>
            </Row>
            {/* <Row style={{ display: 'flex', justifyContent: 'center' }} >
                <h3>Only {Math.floor(claim.balance.balance / claim.amountPerClaim)} more users can claim!</h3>
            </Row> */}
            {Number(claim.type) === 0 && <>
                <h3>Whitelist ({collection.claims[claimId]?.leaves?.length})</h3>
                <div style={{ alignItems: 'center', justifyContent: 'center', maxHeight: 200, overflow: 'auto' }} >


                    {collection.claims[claimId]?.leaves?.map((x) => {

                        return <>
                            <AddressDisplay
                                fontColor={SECONDARY_TEXT}
                                userInfo={{
                                    cosmosAddress: x,
                                    address: '',
                                    accountNumber: -1,
                                    chain: SupportedChain.COSMOS,
                                }}

                                hideChains
                                key={x}
                            />
                            <Button disabled={!chain.connected} type='primary' onClick={() => openModal(x)} style={{ width: '100%' }}>Claim</Button>
                        </>
                    })}
                </div>
            </>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                <Tooltip placement="bottom" title={!chain.connected ? 'Please connect a wallet to claim!' : Number(claim.type) === 0 && collection.claims[claimId]?.leaves?.indexOf(chain.cosmosAddress) < 0 ? 'You are not on the claim list.' : 'Claim these badges!'}>
                    <Button disabled={Number(claim.type) === 0 && collection.claims[claimId]?.leaves?.indexOf(chain.cosmosAddress) < 0} type='primary' onClick={() => openModal()} style={{ width: '100%' }}>Claim</Button>
                </Tooltip>
            </div>
        </div>
    </Card>
}