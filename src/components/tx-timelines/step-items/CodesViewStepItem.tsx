import { InfoCircleOutlined } from '@ant-design/icons';
import { BitBadgesCollection, CodesAndPasswords } from 'bitbadgesjs-sdk';
import { EmptyStepItem, NEW_COLLECTION_ID } from '../../../bitbadges-api/contexts/TxTimelineContext';

import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { useCollection } from '../../../bitbadges-api/contexts/collections/CollectionsContext';
import { neverHasManager } from '../../../bitbadges-api/utils/manager';
import { CodesPasswordsTab } from '../../codes/CodesPasswordsTab';
import { generateCodesFromSeed } from '../../collection-page/transferability/OffChainTransferabilityTab';
import { getMaxUses } from '../../../integrations/integrations';


//TODO: Eventually deprecate this to the use fetchPrivateParams
export const getCodesAndPasswordsFromCollection = (collection: Readonly<BitBadgesCollection<bigint>>): CodesAndPasswords[] => {
  const approvalDetails = collection?.collectionApprovals.map((x) => x.details) ?? [];

  const codesAndPasswords: CodesAndPasswords[] = [];
  for (const details of approvalDetails) {
    if (!details) {
      codesAndPasswords.push({ codes: [], password: '', cid: '' });
      continue;
    }

    const { challengeDetails, offChainClaims } = details;
    const claim = offChainClaims?.length ? offChainClaims[0] : undefined;
    if (!challengeDetails) {
      codesAndPasswords.push({ codes: [], password: '', cid: '' });
      continue;
    }

    const { preimages, seedCode } = challengeDetails?.leavesDetails;

    const numCodes = getMaxUses(claim?.plugins ?? []);
    const codes = seedCode ? generateCodesFromSeed(seedCode, numCodes) : preimages ?? [];

    codesAndPasswords.push({
      codes: codes,
      password: '',
      cid: ''
    });
  }

  return codesAndPasswords;
};

export function CodesViewStepItem() {
  const collection = useCollection(NEW_COLLECTION_ID);
  const chain = useChainContext();

  if (!collection) {
    return EmptyStepItem;
  }

  const codesAndPasswords = getCodesAndPasswordsFromCollection(collection);
  if (codesAndPasswords.every((x) => x.codes.length === 0 || x.password) || !collection) {
    return EmptyStepItem;
  }

  const noManager = neverHasManager(collection);
  const showWarning = noManager || collection.managerTimeline.some((x) => x.manager !== chain.cosmosAddress);

  return {
    title: 'View Codes / Passwords',
    description: (
      <div className="secondary-text">
        <InfoCircleOutlined /> For the code or password-based claims that you have created, you have the option to view, save, and download the codes
        now. Moving forward, they will only be viewable to whoever the current collection manager is.{' '}
        <span style={{ color: '#FF5733' }}>
          {showWarning ? 'Since no manager was selected, this is the only time you will be able to see these codes.' : ''}
        </span>
      </div>
    ),
    node: () => (
      <div className="flex-center flex-column">
        <br />
        <CodesPasswordsTab collectionId={NEW_COLLECTION_ID} codesAndPasswords={codesAndPasswords} />
      </div>
    )
  };
}
