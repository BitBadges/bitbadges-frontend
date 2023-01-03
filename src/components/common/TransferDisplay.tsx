import { Col, Row, Typography } from "antd"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BitBadgeCollection, BitBadgesUserInfo, UserBalance } from "../../bitbadges-api/types";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { BadgeAvatarDisplay } from "../badges/BadgeAvatarDisplay";
import { AddressWithBlockies } from "../address/AddressWithBlockies";

export function TransferDisplay({
    from,
    to,
    badge,
    amount,
    startId,
    endId
}: {
    from: BitBadgesUserInfo[];
    to: BitBadgesUserInfo[];
    badge: BitBadgeCollection;
    amount: number;
    startId: number;
    endId: number;
}) {
    return <>
        <Row>
            <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <b>From</b>
            </Col>
            <Col span={2} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            </Col>
            <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <b>To</b>
            </Col>
        </Row>
        <Row>
            <Col span={11} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                {from.map((user, index) => {
                    return <>
                        {index !== 0 && <hr color='white' />}
                        <AddressWithBlockies
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
                            address={user.address}
                            chain={user.chain}
                            fontSize={14}
                            blockiesScale={3}
                        />
                        <AddressWithBlockies
                            address={user.address}
                            chain={user.chain}
                            fontSize={14}
                            blockiesScale={3}
                        />
                    </>
                })}
            </Col>
        </Row>
        <br />
        <div style={{ textAlign: 'center' }}>
            <Typography.Text style={{ fontSize: 16, textAlign: 'center' }} strong>{'Transferring x' + amount + ' of the following badges (IDs ' + startId + ' - ' + endId + '):'}</Typography.Text>
        </div>
        <BadgeAvatarDisplay badgeCollection={badge} startId={startId} endId={endId} userBalance={{} as UserBalance} />
    </>
}