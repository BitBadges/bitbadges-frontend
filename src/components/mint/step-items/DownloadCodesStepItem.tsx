import { BadgeMetadata, ClaimItem } from "../../../bitbadges-api/types";
import { PRIMARY_TEXT, SECONDARY_TEXT } from "../../../constants";
import { downloadJson } from "../../../utils/downloadJson";

export function DownloadCodesStepItem(
    claimItems: ClaimItem[],
    collectionMetadata: BadgeMetadata,
) {
    return {
        title: `Download Codes`,
        description: `You are in charge of storing and distributing the ${claimItems.length / 2} claim code${claimItems.length / 2 > 1 ? 's' : ' you have generated'}. Please download them to keep them safe.`,
        node: <div style={{ textAlign: 'center', color: PRIMARY_TEXT }}>
            <>
                <br />
                <div >
                    If you lose these codes, they cannot be recovered!
                </div>
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
                            claimItems
                        }, `codes-${collectionMetadata.name}-${dateString}-${timeString}.json`);
                    }}
                    className="opacity link-button"
                >
                    Click here to download the codes.
                </button>
            </>
        </div>
    }
}