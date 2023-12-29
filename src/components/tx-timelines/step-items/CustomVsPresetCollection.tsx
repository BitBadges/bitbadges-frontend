import { useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { GenericFormStepWrapper } from "../form-items/GenericFormStepWrapper";
import { SwitchForm } from "../form-items/SwitchForm";


export function CollectionTypeSelect() {
  const txTimelineContext = useTxTimelineContext();
  const customCollection = txTimelineContext.customCollection;
  const setCustomCollection = txTimelineContext.setCustomCollection;

  return {
    title: 'Custom Collection?',
    description: '',
    node: () => <GenericFormStepWrapper
      documentationLink="https://docs.bitbadges.io/overview/ecosystem/bitbadges-follow-protocol"  
    node={
        () => <div>
        <SwitchForm
        
          options={[
            {
              title: 'Template',
              message: <>Choose from a list of template collections that have already been created.</>,
              isSelected: !customCollection,
            },
            {
              title: 'Custom',
              message: 'Create a collection from scratch. You can customize it however you want.',
              isSelected: customCollection,
            },
          ]}
          onSwitchChange={(idx) => {
            setCustomCollection(idx === 1);
          }}

        />
      </div>
      }
    />
  }
}