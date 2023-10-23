import { useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
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

  return {
    title: 'Choose Type',
    description: '',
    node: <div>
      <SwitchForm
        options={[
          {
            title: 'Address List',
            message: <>Create a list of addresses.</>,
            isSelected: mintType === MintType.AddressList
          },
          {
            title: 'Badge Collection',
            message: 'Create a collection of badges (tokens) which can be owned, transferred, and traded. Each badge can have its own unique properties.',
            isSelected: mintType === MintType.BitBadge
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