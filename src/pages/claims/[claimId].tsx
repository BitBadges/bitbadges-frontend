import { Layout } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { BitBadgesApi } from '../../bitbadges-api/api';
import { OffChainClaim } from '../../components/tx-timelines/step-items/OffChainBalancesStepItem';
import { AddressListClaimCardWithModal } from '../lists/[listId]';

const { Content } = Layout;

function AddressCollectionScreen() {
  const router = useRouter();
  const { description, claimId } = router.query;
  const [claim, setClaim] = useState<OffChainClaim<bigint> | undefined>(undefined);

  useEffect(() => {
    if (claimId) {
      BitBadgesApi.getClaims({ claimIds: [claimId as string] }).then((claimsRes) => {
        if (claimsRes.claims.length > 0) {
          setClaim(claimsRes.claims[0]);
        }
      });
    }
  }, [claimId]);

  if (!claim) return <></>;

  return (
    <Content className="full-area" style={{ minHeight: '100vh', padding: 8 }}>
      <div className="flex-center">
        <AddressListClaimCardWithModal
          onSuccess={async () => {
            router.push('/');
          }}
          claim={claim}
          description={description as string}
          unknownPublicState={true}
        />
      </div>
    </Content>
  );
}

export default AddressCollectionScreen;
