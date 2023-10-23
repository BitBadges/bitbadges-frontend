import { useChainContext } from "../../../bitbadges-api/contexts/ChainContext";
import { useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { AddressDisplayList } from "../../address/AddressDisplayList";
import { BadgeAvatarDisplay } from "../../badges/BadgeAvatarDisplay";
import { SwitchForm } from "../form-items/SwitchForm";

export enum MintType {
  AddressList = 'Address List',
  BitBadge = 'BitBadge',
  Attestation = 'Attestation',
}

export function ChooseBadgeTypeStepItem() {
  const txTimelineContext = useTxTimelineContext();
  const mintType = txTimelineContext.mintType;
  const setMintType = txTimelineContext.setMintType;
  const chain = useChainContext();

  return {
    title: 'Choose Type',
    description: '',
    node: <div>
      <SwitchForm
        options={[
          {
            title: 'Address List',
            message: <>Create a list of addresses.</>,
            isSelected: mintType === MintType.AddressList,
            additionalNode: <>
              <b>Example</b>
              <AddressDisplayList users={[chain.address, "cosmos1kfr2xajdvs46h0ttqadu50nhu8x4v0tcfn4p0x", "0xb48B65D09aaCe9d3EBDE4De409Ef18556eb53085"]} />
            </>
          },
          {
            title: 'Badge Collection',
            message: 'Create a collection of badges (tokens) which can be owned, transferred, and traded. Each badge can be customized to have its own unique properties.',
            isSelected: mintType === MintType.BitBadge,
            additionalNode: <>
              <b>Example</b> <BadgeAvatarDisplay collectionId={1n} badgeIds={[{ start: 1n, end: 10n }]} showIds />
            </>
          },
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
  }
}