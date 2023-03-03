import { DeleteOutlined } from "@ant-design/icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Avatar, Col, Empty, Pagination, Row, Tooltip, Typography } from "antd";
import { useState } from "react";
import { BitBadgeCollection, BitBadgesUserInfo, Transfers } from "../../bitbadges-api/types";
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
    deletable,
}: {
    from: BitBadgesUserInfo[]
    transfers: (Transfers & { toAddressInfo: BitBadgesUserInfo[] })[],
    collection: BitBadgeCollection;
    fontColor?: string;
    toCodes?: string[];
    hideAddresses?: boolean;
    hideBalances?: boolean;
    setTransfers: (transfers: (Transfers & { toAddressInfo: BitBadgesUserInfo[] })[]) => void;
    deletable?: boolean;
}) {
    const [transfersPage, setTransfersPage] = useState(0);
    const accounts = useAccountsContext();

    return <div>
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

                const to = transfer.toAddressInfo;
                accounts.fetchAccounts(to.map((user) => user.cosmosAddress));

                const badgeIds = balance.badgeIds.map(({ start, end }) => { return { start: Number(start), end: Number(end) } })
                const toLength = to.length > 0 ? to.length : toCodes?.length ? toCodes.length : 0;
                const amount = Number(balance.balance) * toLength;

                return <div key={index}>
                    <div style={{}}>
                        {!hideBalances && <div>
                            <div style={{ fontSize: 15, textAlign: 'center' }}>
                                <span style={{ color: amount < 0 ? 'red' : undefined }}>

                                    Transferring <b>x{amount}</b> of IDs

                                    {badgeIds.map((idRange, idx) => {
                                        return <span key={idx}>
                                            {idx !== 0 ? ', ' : ' '} {idRange.start == idRange.end ? `${idRange.start}` : `${idRange.start}-${idRange.end}`}
                                        </span>
                                    })}
                                </span>


                            </div>
                            <div style={{ fontSize: 15, textAlign: 'center' }}>
                                <span style={{ color: amount < 0 ? 'red' : undefined }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Typography.Text style={{ fontSize: 15, textAlign: 'center', color: fontColor }}>{toLength > 1 ? `x${amount / toLength} to each of the ${toLength} recipient${toLength > 1 ? 's' : ""}` : ''}</Typography.Text>
                                    </div>

                                </span>
                            </div>
                        </div>}
                        {
                            collection &&
                            <BadgeAvatarDisplay
                                showBalance={!hideBalances}
                                showIds
                                collection={collection}
                                badgeIds={badgeIds}
                                userBalance={{
                                    balances: [{
                                        balance: amount,
                                        badgeIds: badgeIds
                                    }],
                                    approvals: []
                                }} size={40} />
                        }

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
                                                <AddressWithBlockies
                                                    fontColor={fontColor}
                                                    address={user.address}
                                                    addressName={user.name}
                                                    fontSize={14}
                                                    blockiesScale={3}
                                                />
                                            </>
                                        })}
                                        {!!toCodes?.length && toCodes?.length > 0 &&
                                            <>
                                                <Text
                                                    copyable
                                                    style={{
                                                        color: fontColor ? fontColor : undefined,
                                                    }}
                                                    strong
                                                >
                                                    {'First User To Enter Code'}
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