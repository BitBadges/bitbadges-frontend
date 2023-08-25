import { SwitchForm } from "../form-items/SwitchForm";

export enum MintType {
  AddressList = 'Address List',
  BitBadge = 'BitBadge',
  Attestation = 'Attestation',
}

export function ChooseBadgeTypeStepItem(
  mintType: MintType,
  setMintType: (mintType: MintType) => void,
) {

  return {
    title: 'Choose Type',
    description: '',
    node: <div>
      <SwitchForm
        options={[
          {
            title: 'Address List',
            message: <> Create a simple list of addresses. Can be stored on-chain or off-chain. No tokens or balances.</>,
            isSelected: mintType === MintType.AddressList
          },
          {
            title: 'Badge',
            message: 'This will create a token which can be owned, transferred, and traded, as well as having many other customization options.',
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