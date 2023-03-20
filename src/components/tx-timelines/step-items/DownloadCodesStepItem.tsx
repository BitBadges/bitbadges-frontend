import { Divider, Typography } from "antd";
import { BadgeMetadata, BitBadgeCollection, ClaimItem } from "../../../bitbadges-api/types";
import { PRIMARY_TEXT, SECONDARY_TEXT } from "../../../constants";
import { downloadJson } from "../../../utils/downloadJson";

const { Text } = Typography;

export function DownloadCodesStepItem(
    claimItems: ClaimItem[],
    collectionMetadata: BadgeMetadata,
    collection: BitBadgeCollection,
    startClaimId: number,
) {
    return {
        title: `Download Codes`,
        description: `IMPORTANT: You are responsible for storing and distributing the passwords and codes you have created. If you lose them, they cannot be recovered!`,
        node: <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
            <>
                <br />
                {claimItems.find(x => x.codes.length > 0) && <div>
                    <button
                        style={{
                            backgroundColor: 'inherit',
                            color: PRIMARY_TEXT,
                        }}
                        onClick={() => {
                            const today = new Date();

                            const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
                            const timeString = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;

                            downloadJson({
                                claims: claimItems.map((claimItem, idx) => {
                                    return {
                                        claimId: startClaimId + idx,
                                        codes: claimItem.hasPassword ? undefined : claimItem.codes,
                                        numCodes: claimItem.hasPassword ? undefined : claimItem.numCodes,
                                        password: claimItem.hasPassword ? claimItem.password : undefined,
                                        numPasswordUses: claimItem.hasPassword ? claimItem.numCodes : undefined,
                                    }
                                }),
                            }, `claims-${collectionMetadata.name}-${dateString}-${timeString}.json`);
                        }}
                        className="opacity link-button"
                    >
                        Click here to download a file with all your codes and passwords. Keep this file safe and secure!
                    </button>
                    <Divider />
                </div>}

                {claimItems.find(x => x.hasPassword) && <>

                    <Text strong style={{ color: PRIMARY_TEXT, fontSize: 24 }}>
                        Passwords
                    </Text>
                    <br />
                    {claimItems.map((x, idx) => {
                        if (x.hasPassword) {
                            return <div>
                                Password for Claim ID #{startClaimId + idx}: {claimItems.find(x => x.hasPassword)?.password}
                            </div>
                        }
                        return null;
                    })}
                </>}
                <br />
                <br />
                {claimItems.find(x => x.codes.length > 0) && <>
                    <Text strong style={{ color: PRIMARY_TEXT, fontSize: 24 }}>
                        Codes
                    </Text>
                    <br />
                    {claimItems.map((x, idx) => {
                        if (x.codes.length > 0 && !x.hasPassword) {
                            return <div>
                                Codes for Claim ID #{startClaimId + idx} ({x.codes.length}):
                                <br />
                                {x.codes.map((code, idx) => {
                                    return <div key={idx}>
                                        {idx + 1}. {code}
                                    </div>
                                })}
                            </div>
                        }
                        return null;
                    })}
                </>}
            </>
        </div >
    }
}