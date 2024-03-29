import { UintRangeArray } from 'bitbadgesjs-sdk';
import { useChainContext } from '../../../bitbadges-api/contexts/ChainContext';
import { useTxTimelineContext } from '../../../bitbadges-api/contexts/TxTimelineContext';
import { AddressDisplayList } from '../../address/AddressDisplayList';
import { BadgeAvatarDisplay } from '../../badges/BadgeAvatarDisplay';
import { GenericFormStepWrapper } from '../form-items/GenericFormStepWrapper';
import { SwitchForm } from '../form-items/SwitchForm';

export enum MintType {
  AddressList = 'Address List',
  BitBadge = 'BitBadge'
}

export function ChooseBadgeTypeStepItem() {
  const txTimelineContext = useTxTimelineContext();
  const mintType = txTimelineContext.mintType;
  const setMintType = txTimelineContext.setMintType;
  const chain = useChainContext();

  return {
    title: 'Choose Type',
    description: '',
    node: () => (
      <GenericFormStepWrapper
        documentationLink="https://docs.bitbadges.io/overview/how-it-works/badges-vs-address-lists"
        node={() => (
          <div>
            <SwitchForm
              options={[
                {
                  title: 'Address List',
                  message: <>Create a list of addresses.</>,
                  isSelected: mintType === MintType.AddressList,
                  additionalNode: () => (
                    <>
                      <b>Example</b>
                      <AddressDisplayList
                        users={[
                          chain.address,
                          'cosmos1kfr2xajdvs46h0ttqadu50nhu8x4v0tcfn4p0x',
                          '0xb48B65D09aaCe9d3EBDE4De409Ef18556eb53085',
                          '6H2af68Yyg6j7N4XeQKmkZFocYQgv6yYoU3Xk491efa5'
                        ]}
                      />
                    </>
                  )
                },
                {
                  title: 'Badge Collection',
                  message:
                    'Create a collection of badges (tokens) which can be owned and transferred. Each badge can be customized to have its own unique properties like transferability, metadata, supply, and more.',
                  isSelected: mintType === MintType.BitBadge,
                  additionalNode: () => (
                    <>
                      <b>Example</b> <BadgeAvatarDisplay collectionId={1n} badgeIds={UintRangeArray.From([{ start: 1n, end: 10n }])} showIds />
                    </>
                  )
                }
              ]}
              onSwitchChange={(idx) => {
                if (idx === 1) {
                  setMintType(MintType.BitBadge);
                } else {
                  setMintType(MintType.AddressList);
                }
              }}
            />
          </div>
        )}
      />
    )
  };
}
