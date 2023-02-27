import { Collapse, Divider, Typography } from "antd";
import CollapsePanel from "antd/lib/collapse/CollapsePanel";
import { BadgeMetadata, BitBadgeCollection, ClaimItem } from "../../../bitbadges-api/types";
import { MINT_ACCOUNT, PRIMARY_BLUE, PRIMARY_TEXT, SECONDARY_TEXT } from "../../../constants";
import { downloadJson } from "../../../utils/downloadJson";
import { TransferDisplay } from "../../transfers/TransferDisplay";

const { Text } = Typography;

export function DownloadCodesStepItem(
    claimItems: ClaimItem[],
    collectionMetadata: BadgeMetadata,
    collection: BitBadgeCollection,
    claimIdNumber: number
) {
    return {
        title: `Download Codes`,
        description: `IMPORTANT: You are in charge of storing and distributing the ${claimItems.length / 2} claim code${claimItems.length / 2 > 1 ? 's' : ' you have generated'}. If you lose these codes, they cannot be recovered!`,
        node: <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
            <>
                <br />
                <button
                    style={{
                        backgroundColor: 'inherit',
                        color: SECONDARY_TEXT,
                    }}
                    onClick={() => {
                        const today = new Date();

                        const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                        const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                        downloadJson({
                            claimNumber: claimIdNumber,
                            codes: claimItems.map((leaf, idx) => {
                                if (idx % 2 === 1) {
                                    return undefined;
                                }
                                return {
                                    code: leaf.fullCode,
                                    amount: leaf.amount,
                                    badgeIds: leaf.badgeIds,
                                    message: `The code ${leaf.fullCode} is redeemable for ${leaf.amount} badge${leaf.amount > 1 ? 's' : ''} (IDs: ${leaf.badgeIds.map((id) => { return id.start + ' to ' + id.end }).join(', ')}) in the ${collectionMetadata.name} collection.`
                                }
                            }).filter((code) => { return code !== undefined }),
                        }, `codes-${collectionMetadata.name}-${dateString}-${timeString}.json`);
                    }}
                    className="opacity link-button"
                >
                    Click here to download a text file with all the codes.
                </button>
                <Divider />
                {claimItems.length > 0 && <>
                    <Collapse accordion style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE, margin: 0 }}>
                        {claimItems.map((leaf, index) => {
                            let currIndex = index;
                            if (index % 2 === 1) {
                                return <></>
                            }

                            currIndex = index / 2;

                            return <CollapsePanel header={<div style={{ margin: 0, color: PRIMARY_TEXT, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                                    <Text style={{ color: PRIMARY_TEXT }}>
                                        {`Code #${currIndex + 1}`}
                                    </Text>
                                </div>
                                <div>

                                </div>
                            </div>}
                                key={index} style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>
                                <div style={{ color: PRIMARY_TEXT, backgroundColor: PRIMARY_BLUE }}>
                                    <>
                                        <Text strong style={{ color: PRIMARY_TEXT, fontSize: 16 }}>
                                            Code
                                        </Text>
                                        <br />
                                        <Text copyable strong style={{ color: PRIMARY_TEXT, fontSize: 16, }}>
                                            {leaf.fullCode}
                                        </Text>
                                        <Divider />
                                    </>
                                    <TransferDisplay
                                        collection={collection}
                                        fontColor={PRIMARY_TEXT}
                                        from={[
                                            MINT_ACCOUNT
                                        ]}
                                        transfers={[
                                            {
                                                toAddresses: [],
                                                toAddressInfo: [],
                                                balances: [
                                                    {
                                                        balance: leaf.amount,
                                                        badgeIds: leaf.badgeIds,
                                                    }
                                                ],
                                            },
                                        ]}
                                        toCodes={[leaf.fullCode]}
                                        setTransfers={() => { }}
                                    />

                                    <Divider />
                                </div>
                            </CollapsePanel>
                        })}
                    </Collapse>
                    <Divider />
                </>
                }
            </>
        </div >
    }
}