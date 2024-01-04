import { InfoCircleOutlined } from "@ant-design/icons";
import { CodesAndPasswords } from "bitbadgesjs-utils";
import { EmptyStepItem, NEW_COLLECTION_ID } from "../../../bitbadges-api/contexts/TxTimelineContext";

import { ClaimsTab } from "../../collection-page/ClaimsTab";
import { neverHasManager } from "../../../bitbadges-api/utils/manager";
import { useCollection } from "../../../bitbadges-api/contexts/collections/CollectionsContext";
import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";

export function CodesViewStepItem() {

  const collection = useCollection(NEW_COLLECTION_ID);
  const chain = useChainContext();

  const approvalDetails = collection?.collectionApprovals.map(x => x.details);
  const codesAndPasswords: CodesAndPasswords[] = approvalDetails?.map(x => !x ? { codes: [], password: '', cid: '' } : { codes: x.challengeDetails.leavesDetails.preimages ?? [], password: x.challengeDetails.password ?? '', cid: '' }) ?? [];

  if (codesAndPasswords.every(x => x.codes.length === 0 || x.password) || !collection) {
    return EmptyStepItem
  }



  const noManager = neverHasManager(collection);

  const showWarning = noManager || collection.managerTimeline.some(x => x.manager !== chain.cosmosAddress);

  return {
    title: 'View Codes / Passwords',
    description: <div className="secondary-text" style={{}}>
      <InfoCircleOutlined /> For the code or password-based claims that you have created, you have the option to view, save, and download the codes now.
      Moving forward, they will only be viewable to whoever the current collection manager is. <span style={{ color: '#FF5733' }}>{showWarning
        ? "Since no manager was selected, this is the only time you will be able to see these codes." : ""}
      </span>
    </div>,
    node: () => <div className='flex-center flex-column'>
      <br />
      <ClaimsTab
        collectionId={NEW_COLLECTION_ID}
        codesAndPasswords={codesAndPasswords}
      />
    </div>
  }
}