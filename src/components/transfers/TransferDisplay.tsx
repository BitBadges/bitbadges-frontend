import { DeleteOutlined } from "@ant-design/icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Avatar, Col, Empty, Pagination, Row, Tooltip, Typography } from "antd";
import { useState } from "react";
import { BitBadgeCollection, BitBadgesUserInfo, TransfersExtended } from "../../bitbadges-api/types";
import { PRIMARY_TEXT } from "../../constants";
import { useAccountsContext } from "../../contexts/AccountsContext";
import { AddressWithBlockies } from "../address/AddressWithBlockies";
import { BalanceDisplay } from "../balances/BalanceDisplay";

const { Text } = Typography

export function TransferDisplay({
    transfers,
    collection,
    from,
    fontColor,
    hideAddresses,
    hideBalances,
    setTransfers,
    deletable,
}: {
    from: BitBadgesUserInfo[]
    transfers: TransfersExtended[],
    collection: BitBadgeCollection;
    fontColor?: string;
    hideAddresses?: boolean;
    hideBalances?: boolean;
    setTransfers: (transfers: TransfersExtended[]) => void;
    deletable?: boolean;
}) {
    const [transfersPage, setTransfersPage] = useState(0);
    const accounts = useAccountsContext();

    return <div style={{ marginTop: 4 }}    >
        {transfers.length === 0 ? <div style={{ textAlign: 'center' }}>
            <Empty description='None'
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

        {transfers.map((transfer, index) => {
            if (index !== transfersPage) return <></>;

            const to = transfer.toAddressInfo ? transfer.toAddressInfo : [];
            if (to.length) accounts.fetchAccounts(to.map((user) => user.cosmosAddress));

            const toLength = to.length > 0 ? to.length : transfer.numCodes ? transfer.numCodes : 0;
            let hasPassword = transfer.password ? true : false;
            console.log("TRANSFERRRR", transfer, toLength);

            return <div key={index}>
                <div style={{}}>
                    {!hideBalances && <div>
                        {
                            collection && <>
                                <BalanceDisplay
                                    message={'Badges Transferred'}
                                    collection={collection}
                                    balance={{
                                        balances: transfer.balances,
                                        approvals: []
                                    }}
                                    numRecipients={toLength}
                                    numIncrements={transfer.numIncrements}
                                    incrementBy={transfer.incrementBy}
                                />
                            </>
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
                                    {!!transfer.numCodes && transfer.numCodes > 0 &&
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
        }
    </div>

}