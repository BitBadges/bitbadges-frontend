import { Col, Row, Typography } from "antd"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BitBadgeCollection, BitBadgesUserInfo, UserBalance } from "../../bitbadges-api/types";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { AddressWithBlockies } from "../address/AddressWithBlockies";

const { Text } = Typography

export function TransferDisplay({
    from,
    to,
    badge,
    setBadgeCollection,
    amount,
    startId,
    endId,
    fontColor,
    toCodes,
}: {
    from: BitBadgesUserInfo[];
    to: BitBadgesUserInfo[];
    badge?: BitBadgeCollection;
    setBadgeCollection?: (badge: BitBadgeCollection) => void;
    amount: number;
    startId: number;
    endId: number;
    fontColor?: string;
    toCodes?: string[];
}) {
    return <>
        <Row>
            <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <b>From</b>
            </Col>
            <Col span={2} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            </Col>
            <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <b>{to.length ? 'To' : ''}</b>
                <b>{toCodes?.length ? 'Claim Code(s)' : ''}</b>
            </Col>
        </Row>
        <Row>
            <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                {from.map((user, index) => {
                    return <>
                        {index !== 0 && <hr color='white' />}
                        <AddressWithBlockies
                            fontColor={fontColor}
                            address={user.address}
                            chain={user.chain}
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
                        {index !== 0 && <hr color='white' />}
                        <AddressWithBlockies
                            fontColor={fontColor}
                            address={user.address}
                            chain={user.chain}
                            fontSize={14}
                            blockiesScale={3}
                        />
                        <AddressWithBlockies
                            fontColor={fontColor}
                            address={user.address}
                            chain={user.chain}
                            fontSize={14}
                            blockiesScale={3}
                        />
                    </>
                })}
                {toCodes?.map((code, index) => {
                    return <>
                        {index !== 0 && <hr color='white' />}
                        <Text
                            copyable={{ text: code }}
                            style={{
                                color: fontColor ? fontColor : undefined,
                            }}
                            strong
                        >
                            {code}
                        </Text>
                    </>
                })}

            </Col>
        </Row>
        <br />
        <div style={{ textAlign: 'center' }}>
            <Typography.Text style={{ fontSize: 16, textAlign: 'center', color: fontColor }} strong>{'x' + amount + ' of the badges below (IDs ' + startId + ' - ' + endId + '):'}</Typography.Text>
        </div>
        {badge && setBadgeCollection &&
            <BadgeAvatarDisplay badgeCollection={badge} startId={startId} endId={endId} userBalance={{} as UserBalance} setBadgeCollection={setBadgeCollection} />
        }
    </>
}