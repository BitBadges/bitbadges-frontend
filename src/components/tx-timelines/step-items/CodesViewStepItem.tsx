import { InfoCircleOutlined } from "@ant-design/icons";
import { CodesAndPasswords } from "bitbadgesjs-utils";
import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { useCollectionsContext } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { ClaimsTab } from "../../collection-page/ClaimsTab";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";

export function CodesViewStepItem() {
  const collections = useCollectionsContext();
  const collection = collections.getCollection(NEW_COLLECTION_ID);

  const approvalDetails = collections.getCollection(NEW_COLLECTION_ID)?.collectionApprovals.map(x => x.details);
  const codesAndPasswords: CodesAndPasswords[] = approvalDetails?.map(x => !x ? { codes: [], password: '', cid: '' } : { codes: x.challengeDetails.leavesDetails.preimages ?? [], password: x.challengeDetails.password ?? '', cid: '' }) ?? [];

  if (codesAndPasswords.every(x => x.codes.length === 0) || !collection) {
    return EmptyStepItem
  }



  const noManager = neverHasManager(collection);

  return {
    title: 'View Codes / Passwords',
    description: <div className="secondary-text" style={{}}>
      <InfoCircleOutlined /> For the code or password-based claims that you have created, you have the option to view, save, and download the codes now.
      Moving forward, they will only be viewable to whoever the current collection manager is. <span style={{ color: 'orange' }}>{noManager
        ? "Since no manager was selected, this is the only time you will be able to see these codes." : ""}</span>
    </div>,
    node: <div className='flex-center flex-column'>
      <br />
      <ClaimsTab
        collectionId={NEW_COLLECTION_ID}
        codesAndPasswords={codesAndPasswords}
      />
    </div>
  }
}