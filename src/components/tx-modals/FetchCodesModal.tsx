import { Empty } from 'antd';
import { CodesAndPasswords } from 'bitbadgesjs-sdk';
import React, { useEffect, useState } from 'react';
import { getCollections } from '../../bitbadges-api/api';
import { useChainContext } from '../../bitbadges-api/contexts/ChainContext';
import { NEW_COLLECTION_ID } from '../../bitbadges-api/contexts/TxTimelineContext';
import { useCollection } from '../../bitbadges-api/contexts/collections/CollectionsContext';
import { INFINITE_LOOP_MODE } from '../../constants';
import { getPluginDetails } from '../../integrations/integrations';
import { CodesPasswordsTab } from '../codes/CodesPasswordsTab';
import { generateCodesFromSeed } from '../collection-page/transferability/OffChainTransferabilityTab';
import { GenericModal } from '../display/GenericModal';

export function FetchCodesModal({
  visible,
  setVisible,
  children,
  collectionId,
  approvalId,
  passwordModal
}: {
  collectionId: bigint;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  children?: React.ReactNode;
  approvalId?: string;
  passwordModal?: boolean;
}) {
  const chain = useChainContext();
  const collection = useCollection(collectionId);

  const [codesAndPasswords, setCodesAndPasswords] = useState<CodesAndPasswords[] | undefined>(undefined);
  const [fetched, setFetched] = useState(false);

  //TOOD: Eventually deprecate this in favor of fetchPrivateParams only
  useEffect(() => {
    if (!visible) return;
    if (!collection) return;
    if (INFINITE_LOOP_MODE) console.log('useEffect: fetch codes modal ');

    if (collectionId && chain.connected && chain.loggedIn && visible && !fetched) {
      const getAll = async () => {
        const collectionRes = await getCollections({ collectionsToFetch: [{ collectionId: collectionId, fetchPrivateParams: true }] });

        const codesAndPasswords = [];

        for (let i = 0; i < collection.collectionApprovals.length; i++) {
          const approval = collection.collectionApprovals[i];
          const approvalWithPrivateParams = collectionRes.collections[0].collectionApprovals[i];
          const approvalWithPrivateParamsDetails = approvalWithPrivateParams.details;
          const claim =
            approvalWithPrivateParamsDetails?.offChainClaims && approvalWithPrivateParamsDetails?.offChainClaims?.length
              ? approvalWithPrivateParamsDetails?.offChainClaims[0]
              : undefined;
          const plugins = claim?.plugins ?? [];

          const numCodes = getPluginDetails('codes', plugins)?.publicParams.numCodes ?? 0;
          const seedCode = getPluginDetails('codes', plugins)?.privateParams.seedCode;
          const codes = seedCode
            ? generateCodesFromSeed(seedCode, numCodes)
            : getPluginDetails('codes', plugins)?.privateParams.codes?.map((x) => x) ?? [];
          const password = getPluginDetails('password', plugins)?.privateParams.password ?? '';

          const cid = approval.uri?.split('/').pop();
          codesAndPasswords.push({
            cid: cid ?? '',
            codes: passwordModal ? [] : codes ?? [],
            password: passwordModal ? password ?? '' : ''
          });
        }

        setCodesAndPasswords(codesAndPasswords);
        setFetched(true);
      };
      getAll();
    }
  }, [collectionId, chain, visible, collection, fetched, passwordModal]);

  return (
    <GenericModal title="Distribute" visible={visible} setVisible={setVisible} style={{ minWidth: '90%' }} requireConnected requireLoggedIn>
      <div className="flex-center">
        {collectionId === NEW_COLLECTION_ID ? (
          <Empty
            description={<span className="secondary-text">{'Not supported for previews.'}</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 32 }}
          />
        ) : (
          <>
            <CodesPasswordsTab collectionId={collectionId} codesAndPasswords={codesAndPasswords} approvalId={approvalId} />
          </>
        )}
      </div>
      {children}
    </GenericModal>
  );
}
