import {
  BigIntify,
  BitBadgesAddressList,
  BlockinAndGroup,
  ClaimIntegrationPrivateParamsType,
  ClaimIntegrationPublicParamsType,
  NumberType
} from 'bitbadgesjs-sdk';
import { AndGroup } from 'blockin';
import { useEffect, useState } from 'react';
import { getAddressLists } from '../bitbadges-api/api';
import { useChainContext } from '../bitbadges-api/contexts/ChainContext';
import { AssetConditionGroupUI } from '../pages/auth/codegen';
import { AssetConditionGroupSelect } from '../pages/auth/linkgen';
import { ClaimIntegrationPlugin } from './integrations';

const MustOwnCreateNode = ({
  publicParams,
  privateParams,
  setParams
}: {
  publicParams: ClaimIntegrationPublicParamsType<'mustOwnBadges'>;
  privateParams: ClaimIntegrationPrivateParamsType<'mustOwnBadges'>;
  setParams: (
    publicParams: ClaimIntegrationPublicParamsType<'mustOwnBadges'>,
    privateParams: ClaimIntegrationPrivateParamsType<'mustOwnBadges'>
  ) => void;
}) => {
  const assetConditionGroup = new BlockinAndGroup(publicParams.ownershipRequirements as AndGroup<NumberType>).convert(
    BigIntify
  ) as BlockinAndGroup<bigint>;

  const MustOwnSelect = (
    <div style={{ textAlign: 'center' }}>
      <br />
      <AssetConditionGroupSelect
        assetOwnershipRequirements={assetConditionGroup}
        setAssetOwnershipRequirements={(ownershipRequirements) => {
          setParams({ ...publicParams, ownershipRequirements }, privateParams);
        }}
      />
    </div>
  );

  return MustOwnSelect;
};

const DetailsUi = ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'mustOwnBadges'> }) => {
  const assetConditionGroup = new BlockinAndGroup(publicParams.ownershipRequirements as AndGroup<NumberType>).convert(
    BigIntify
  ) as BlockinAndGroup<bigint>;

  const [lists, setLists] = useState<BitBadgesAddressList<bigint>[]>([]);
  const chain = useChainContext();

  useEffect(() => {
    //Recursively search for 'assets' field in nested JSON
    const listIds = (assetConditionGroup: BlockinAndGroup<bigint>): string[] => {
      let ids: string[] = [];
      assetConditionGroup.$and.forEach((group) => {
        if (group instanceof BlockinAndGroup) {
          ids = ids.concat(listIds(group));
        } else if ((group as any).assets) {
          for (const asset of (group as any).assets) {
            if (asset.collectionId === 'BitBadges Lists') {
              ids.push(...asset.assetIds);
            }
          }
        }
      });
      return ids;
    };

    const listIdsArr = listIds(assetConditionGroup);
    if (listIdsArr.length > 0) {
      getAddressLists({
        listsToFetch: listIdsArr.map((x) => {
          return { listId: x };
        })
      }).then((lists) => {
        setLists(lists.addressLists);
      });
    }
  }, [assetConditionGroup]);

  return (
    <div className="full-width">
      <div>Must meet specific badge / list requirements</div>
      <AssetConditionGroupUI assetConditionGroup={assetConditionGroup} bulletNumber={1} parentBullet={''} address={chain.address} lists={lists} />
    </div>
  );
};

export const MustOwnPluginDetails: ClaimIntegrationPlugin<'mustOwnBadges'> = {
  id: 'mustOwnBadges',
  metadata: {
    name: 'Ownership Requirements',
    description: 'Users must meet certain ownership requirements to claim.',
    image: 'https://avatars.githubusercontent.com/u/86890740',
    createdBy: 'BitBadges',
    stateless: true,
    scoped: true,
    onChainCompatible: true
  },
  stateString: () => '',
  createNode: MustOwnCreateNode,
  detailsString: ({ publicParams }: { publicParams: ClaimIntegrationPublicParamsType<'mustOwnBadges'> }) => {
    return <DetailsUi publicParams={publicParams} />;
  },
  getBlankPrivateParams() {
    return {};
  },
  getBlankPublicParams() {
    return { ownershipRequirements: { $and: [] } };
  },
  getBlankPublicState() {
    return {};
  }
};
