import { InfoCircleOutlined } from "@ant-design/icons";
import { CodesAndPasswords } from "bitbadgesjs-utils";
import { EmptyStepItem, MSG_PREVIEW_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { ClaimsTab } from "../../collection-page/ClaimsTab";

export enum MintType {
  AddressList = 'Address List',
  BitBadge = 'BitBadge',
  Attestation = 'Attestation',
}

export function CodesViewStepItem() {
  const collections = useCollectionsContext();

  const approvalDetails = collections.getCollection(MSG_PREVIEW_ID)?.collectionApprovals.map(x => x.approvalCriteria?.merkleChallenge?.details)
  const codesAndPasswords: CodesAndPasswords[] = approvalDetails?.map(x => !x ? { codes: [], password: '', cid: '' } : { codes: x.challengeDetails.leavesDetails.leaves, password: x.challengeDetails.password ?? '', cid: '' }) ?? [];

  if (codesAndPasswords.every(x => x.codes.length === 0)) {
    return EmptyStepItem
  }

  const neverHasManger = collections.getCollection(MSG_PREVIEW_ID)?.managerTimeline.every(x => !x.manager);

  return {
    title: 'View Codes / Passwords',
    description: '',
    node:
      <div className='flex-center flex-column'>
        <div className="secondary-text" style={{ color: neverHasManger ? 'orange' : undefined }}>
          <InfoCircleOutlined /> For the code or password-based claims that you have created, you have the option to view, save, and download the codes now.
          Moving forward, they will only be viewable to whoever the current collection manager is. {neverHasManger ? "Since you selected to not have a manager for this collection moving forward, this is the only time you will be able to see these codes." : ""}
        </div>

        <ClaimsTab
          collectionId={MSG_PREVIEW_ID}
          codesAndPasswords={codesAndPasswords}
          isModal

        />
      </div>
  }
}