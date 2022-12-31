import { Col, Row, Typography } from "antd"
import { Address } from "../address/Address"
import Blockies from 'react-blockies';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BadgeAvatar } from "../badges/BadgeAvatar";
import { BitBadgeCollection, BitBadgesUserInfo } from "../../bitbadges-api/types";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

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
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <Blockies scale={3} seed={user.address ? user.address.toLowerCase() : ''} />
                            <Address fontSize={14} chain={user.chain} hideChain address={user.address} />
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <Blockies scale={3} seed={user.address ? user.address.toLowerCase() : ''} />
                            <Address fontSize={14} chain={user.chain} hideChain address={user.address} />
                        </div>


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
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <Blockies scale={3} seed={user.address ? user.address.toLowerCase() : ''} />
                            <Address fontSize={14} chain={user.chain} hideChain address={user.address} />
                        </div>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <Blockies scale={3} seed={user.address ? user.address.toLowerCase() : ''} />
                            <Address fontSize={14} chain={user.chain} hideChain address={user.address} />
                        </div>

                    </>
                })}
            </Col>
        </Row>
        <br />
        <div style={{ textAlign: 'center' }}>
            <Typography.Text style={{ fontSize: 16, textAlign: 'center' }} strong>{'Transferring x' + amount + ' of the following badges (IDs ' + startId + ' - ' + endId + '):'}</Typography.Text>
        </div>
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
        }}
        >
            {badge && endId - startId + 1 > 0
                && endId >= 0 &&
                startId >= 0
                && new Array(endId - startId + 1).fill(0).map((_, idx) => {
                    return <div key={idx} style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                    >
                        <BadgeAvatar
                            badge={badge}
                            metadata={badge.badgeMetadata[idx + startId]}
                            badgeId={idx + startId}
                        />
                    </div>
                })}
        </div >
    </>
}