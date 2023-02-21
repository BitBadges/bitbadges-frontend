import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Row, Typography } from "antd";
import { getBlankBalance } from "../../bitbadges-api/balances";
import { BitBadgeCollection, BitBadgesUserInfo, IdRange } from "../../bitbadges-api/types";
import { AddressWithBlockies } from "../address/AddressWithBlockies";
import { BadgeAvatarDisplay } from "./BadgeAvatarDisplay";

const { Text } = Typography

export function TransferDisplay({
    from,
    to,
    collection,
    amount,
    badgeIds,
    fontColor,
    toCodes,
    hideAddresses,
    hideBalances
}: {
    from: BitBadgesUserInfo[];
    to: BitBadgesUserInfo[];
    collection: BitBadgeCollection;
    amount: number;
    badgeIds: IdRange[];
    fontColor?: string;
    toCodes?: string[];
    hideAddresses?: boolean;
    hideBalances?: boolean;
}) {
    // const maximum = badge?.nextBadgeId - 1 || 0;

    const toLength = to.length > 0 ? to.length : toCodes?.length ? toCodes.length : 0;
    return <div style={{ minWidth: 600 }}>
        {!hideBalances && <div>
            <div style={{ fontSize: 15, textAlign: 'center' }}>
                <span style={{ color: amount < 0 ? 'red' : undefined }}>

                    <b>x{amount}</b> of IDs

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
            <BadgeAvatarDisplay showBalance={!hideBalances} showIds collection={collection} badgeIds={badgeIds} userBalance={{
                balances: [{
                    balance: amount,
                    badgeIds: badgeIds
                }],
                approvals: []
            }} size={50} />
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
                            return <>
                                {index !== 0 && <br color='white' />}
                                <AddressWithBlockies
                                    fontColor={fontColor}
                                    address={user.address}
                                    fontSize={14}
                                    blockiesScale={3}
                                />
                            </>
                        })}
                        {toCodes?.length && toCodes?.length > 0 &&
                            <>
                                <Text
                                    copyable={{ text: 'First Users Who Enter Codes' }}
                                    style={{
                                        color: fontColor ? fontColor : undefined,
                                    }}
                                    strong
                                >
                                    {'First Users Who Enter Codes'}
                                </Text>
                            </>}
                    </Col>
                </Row>
            </div>
        }
    </div >
}