import { DeleteOutlined } from "@ant-design/icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Avatar, Col, Empty, Pagination, Row, Tooltip, Typography } from "antd";
import { useState } from "react";
import { BitBadgeCollection, BitBadgesUserInfo, IdRange, Transfers, TransfersExtended } from "../../bitbadges-api/types";
import { PRIMARY_TEXT } from "../../constants";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { AddressWithBlockies } from "../address/AddressWithBlockies";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";

const { Text } = Typography

export function TransferDisplay({
    transfers,
    collection,
    from,
    fontColor,
    toCodes,
    hideAddresses,
    hideBalances,
    setTransfers,
    distributionMethod,
    deletable,
}: {
    from: BitBadgesUserInfo[]
    transfers: TransfersExtended[],
    collection: BitBadgeCollection;
    fontColor?: string;
    toCodes?: string[];
    hideAddresses?: boolean;
    hideBalances?: boolean;
    setTransfers: (transfers: TransfersExtended[]) => void;
    deletable?: boolean;
    distributionMethod?: string;
}) {
    const [transfersPage, setTransfersPage] = useState(0);
    const accounts = useAccountsContext();

    return <div style={{ marginTop: 4 }}    >
        {transfers.length === 0 ? <div style={{ textAlign: 'center' }}>
            <Empty description='No Transfers Added'
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ marginTop: 20, color: PRIMARY_TEXT }}
            />
        </div> :
            <div style={{ textAlign: 'center' }}>
                <Pagination defaultCurrent={1}
                    total={transfers.length}
                    onChange={(page) => {
                        setTransfersPage(page - 1);
                    }}
                    pageSize={1}
                    hideOnSinglePage
                    showSizeChanger={false}
                />
            </div>}
        <br />




        {transfers.map((transfer, _index) => {
            if (_index !== transfersPage) return <></>;
            console.log("TRANSFER", transfer);

            //TODO: Handle balances[] in one
            return transfer.balances.map((balance, index) => {

                const origTo = transfer.toAddressInfo ? transfer.toAddressInfo : [];
                const to: BitBadgesUserInfo[] = [];
                for (const user of origTo) {
                    if (user) to.push(user);
                }
                if (to.length) accounts.fetchAccounts(to.map((user) => user.cosmosAddress));

                let badgeIds = balance.badgeIds.map(({ start, end }) => { return { start: Number(start), end: Number(end) } })

                const toLength = to.length > 0 ? to.length : toCodes?.length ? toCodes.length : 0;
                let amount = Number(balance.balance) * toLength;
                let amountPerRecipient = Number(balance.balance);
                let allBadgeIds: IdRange[] = JSON.parse(JSON.stringify(badgeIds));
                let hasPassword = transfer.password ? true : false;

                if (transfer.numIncrements) {
                    amount = amount / transfer.numIncrements;
                    amountPerRecipient = amount;

                    if (transfer.incrementBy) {
                        for (const badgeIdRange of allBadgeIds) {
                            badgeIdRange.end = badgeIdRange.end + (transfer.incrementBy * (transfer.numIncrements - 1));
                        }
                    }
                }



                return <div key={index}>
                    <div style={{}}>
                        {!hideBalances && <div>
                            <div style={{ fontSize: 15, textAlign: 'center' }}>
                                <span style={{ color: amount < 0 ? 'red' : undefined }}>

                                    Transferring <b>x{amount}</b> of IDs

                                    {allBadgeIds.map((idRange, idx) => {
                                        return <span key={idx}>
                                            {idx !== 0 ? ', ' : ' '} {idRange.start == idRange.end ? `${idRange.start}` : `${idRange.start}-${idRange.end}`}
                                        </span>
                                    })}
                                </span>


                            </div>
                            <div style={{ fontSize: 15, textAlign: 'center' }}>
                                <span style={{ color: amount < 0 ? 'red' : undefined }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Typography.Text style={{ fontSize: 15, textAlign: 'center', color: fontColor }}>{toLength > 1 ? `x${amountPerRecipient} to each of the ${toLength} recipient${toLength > 1 ? 's' : ""}` : ''} </Typography.Text>
                                    </div>

                                </span>
                            </div>
                            <div style={{ fontSize: 15, textAlign: 'center' }}>
                                <span style={{ color: amount < 0 ? 'red' : undefined }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Typography.Text style={{ fontSize: 15, textAlign: 'center', color: fontColor }}>
                                            {transfer.incrementBy ? `Starting with x${amountPerRecipient} of IDs ${badgeIds.map((idRange, idx) => {
                                                return ' ' + idRange.start + '-' + idRange.end
                                            }).join(', ')} and incrementing IDs by ${transfer.incrementBy} each claim` : ''}
                                        </Typography.Text>
                                    </div>

                                </span>
                            </div>
                            {
                                collection &&
                                <BadgeAvatarDisplay
                                    showBalance={!hideBalances}
                                    showIds
                                    collection={collection}
                                    badgeIds={allBadgeIds}
                                    userBalance={{
                                        balances: [{
                                            balance: amount,
                                            badgeIds: allBadgeIds
                                        }],
                                        approvals: []
                                    }} size={40} />
                            }
                        </div>}

                        {
                            !hideAddresses && <div style={{ color: fontColor }}>
                                <br />
                                <Row>
                                    <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontSize: 20 }}>
                                        <b>From</b>
                                    </Col>
                                    <Col span={2} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                                    </Col>
                                    <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontSize: 20 }}>
                                        {/* <b>{to.length ? 'To' : ''}</b> */}
                                        <b>To</b>
                                        {/* <b>{toCodes?.length ? 'Claim Code(s)' : ''}</b> */}
                                    </Col>
                                </Row>
                                <Row>
                                    <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        {from.map((user, index) => {
                                            return <>
                                                {index !== 0 && <br color='white' />}
                                                <AddressWithBlockies
                                                    fontColor={fontColor}
                                                    address={user.address}
                                                    addressName={user.name}
                                                    fontSize={14}
                                                    blockiesScale={3}
                                                />
                                            </>
                                        })}
                                    </Col>
                                    <Col span={2} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FontAwesomeIcon icon={faArrowRight} />
                                    </Col>

                                    <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                        {to.map((user, index) => {
                                            console.log(user);
                                            return <>
                                                {index !== 0 && <br color='white' />}
                                                {user && <AddressWithBlockies
                                                    fontColor={fontColor}
                                                    address={user.address}
                                                    addressName={user.name}
                                                    fontSize={14}
                                                    blockiesScale={3}
                                                />}
                                            </>
                                        })}
                                        {!!toCodes?.length && toCodes?.length > 0 &&
                                            <>
                                                <Text
                                                    style={{
                                                        color: fontColor ? fontColor : undefined,
                                                    }}
                                                    strong
                                                >
                                                    {hasPassword ? "Users to Enter Correct Password" : `First ${toLength} To Claim`}
                                                </Text>
                                            </>}
                                    </Col>
                                </Row>
                            </div>
                        }
                    </div >
                    {deletable && <div style={{ textAlign: 'center' }}>
                        <br />
                        <Avatar
                            className='screen-button'
                            style={{ cursor: 'pointer', fontSize: 14 }}
                            onClick={() => {
                                setTransfers(transfers.filter((_, index) => index !== transfersPage));
                            }}>
                            <Tooltip title='Delete Transfer'>
                                <DeleteOutlined />
                            </Tooltip>
                        </Avatar>
                        <br />
                    </div>}
                </div>
            })
        })}
    </div>

}