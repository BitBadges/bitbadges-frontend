import { DeleteOutlined } from "@ant-design/icons";
import { Avatar, Col, Empty, Pagination, Row, Tooltip, Typography } from "antd";
import { BitBadgeCollection, BitBadgesUserInfo, TransfersExtended } from "bitbadgesjs-utils";
import { useState } from "react";
import { PRIMARY_TEXT } from '../../constants';
import { useAccountsContext } from "../../contexts/AccountsContext";
import { AddressDisplayList } from "../address/AddressDisplay";
import { BalanceDisplay } from "../balances/BalanceDisplay";

const { Text } = Typography

//TransferDisplay handles normal Transfers[] as well as TransfersExtended[] for the mint proces
export function TransferDisplay({
    transfers,
    collection,
    from,
    fontColor,
    hideAddresses,
    hideBalances,
    setTransfers,
    deletable,
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent
}: {
    from: BitBadgesUserInfo[]
    transfers: TransfersExtended[],
    collection: BitBadgeCollection;
    fontColor?: string;
    hideAddresses?: boolean;
    hideBalances?: boolean;
    setTransfers: (transfers: TransfersExtended[]) => void;
    deletable?: boolean;
    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent?: (badgeIds: number[]) => void;
}) {
    const accounts = useAccountsContext();
    const [page, setPage] = useState(0);
    console.log(from, transfers)

    return <div style={{ marginTop: 4 }}    >
        {
            transfers.length === 0 ? <div style={{ textAlign: 'center' }}>
                <Empty description='None'
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ marginTop: 20, color: PRIMARY_TEXT }}
                />
            </div> : <div style={{ textAlign: 'center' }}>
                <Pagination defaultCurrent={1}
                    total={transfers.length}
                    onChange={(page) => {
                        setPage(page - 1);
                    }}
                    pageSize={1}
                    hideOnSinglePage
                    showSizeChanger={false}
                />
            </div>
        }
        <br />

        {transfers.map((transfer, index) => {
            if (index !== page) return <></>;

            const to = transfer.toAddressInfo ? transfer.toAddressInfo : [];
            console.log("FETCHING")
            if (to.length) {
              
              accounts.fetchAccounts(to.map((user) => user.cosmosAddress));
            }

            const toLength = to.length > 0 ? to.length : transfer.numCodes ? transfer.numCodes : 0;
            const hasPassword = transfer.password ? true : false;

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
                                    updateMetadataForBadgeIdsDirectlyFromUriIfAbsent={updateMetadataForBadgeIdsDirectlyFromUriIfAbsent}
                                />
                            </>
                        }
                    </div>}

                    {
                        !hideAddresses && <div style={{ color: fontColor }}>
                            <br />

                            <Row>
                                <Col md={11} sm={24} xs={24} style={{ textAlign: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                    <AddressDisplayList
                                        users={from}
                                        toLength={toLength}
                                        hideAccountNumber
                                        darkMode
                                        title={'From'}
                                        fontSize={18}
                                        fontColor={fontColor}
                                        center
                                    />
                                </Col>
                                <Col md={2} xs={1} sm={1} style={{ textAlign: 'center', justifyContent: 'center', minHeight: 20 }}>
                                    {/* <FontAwesomeIcon icon={faArrowRight} /> */}
                                </Col>

                                <Col md={11} sm={24} xs={24} style={{ textAlign: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                    <AddressDisplayList
                                        users={to}
                                        toLength={toLength}
                                        hideAccountNumber
                                        darkMode
                                        title={'To'}
                                        fontSize={18}
                                        fontColor={fontColor}
                                        center
                                    />
                                    {!!transfer.numCodes && transfer.numCodes > 0 &&
                                        <>
                                            <Text
                                                style={{
                                                    color: fontColor ? fontColor : undefined,
                                                }}
                                                strong
                                            >
                                                {hasPassword ? `First ${toLength} Users to Enter Correct Password` : `First ${toLength} To Claim`}
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
                            setTransfers(transfers.filter((_, index) => index !== page));
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