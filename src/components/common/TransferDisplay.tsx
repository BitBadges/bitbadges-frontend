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
    updateCollectionMetadata
}: {
    from: BitBadgesUserInfo[];
    to: BitBadgesUserInfo[];
    collection: BitBadgeCollection;
    amount: number;
    badgeIds: IdRange[];
    fontColor?: string;
    toCodes?: string[];
    hideAddresses?: boolean;
    updateCollectionMetadata: (startBadgeId: number) => void;
}) {
    // const maximum = badge?.nextBadgeId - 1 || 0;
    return <div style={{ minWidth: 600 }}>
        {badgeIds?.map((range, index) => {
            const startId = range.start;
            const endId = range.end;
            const toLength = to.length > 0 ? to.length : toCodes?.length ? toCodes.length : 0;

            return <div key={index} >
                <div style={{ textAlign: 'center' }}>
                    <Typography.Text style={{ fontSize: 16, textAlign: 'center', color: fontColor }} strong>{`x${amount * toLength} of each badge (IDs ${startId} to ${endId})`}</Typography.Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Typography.Text style={{ fontSize: 16, textAlign: 'center', color: fontColor }} strong>{toLength > 1 ? ` (x${amount} to each recipient)` : ''}</Typography.Text>
                </div>
                {collection &&
                    <BadgeAvatarDisplay showIds collection={collection} startId={startId} endId={endId} userBalance={getBlankBalance()} updateCollectionMetadata={updateCollectionMetadata} />
                }
            </div>
        })}

        {!hideAddresses && <div>
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
                            {index !== 0 && <br color='white' />}
                            <AddressWithBlockies
                                fontColor={fontColor}
                                address={user.address}
                                chain={user.chain}
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
    </div>
}