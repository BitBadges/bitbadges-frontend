import { useTxTimelineContext } from "../../../bitbadges-api/contexts/TxTimelineContext";
import { SwitchForm } from "../form-items/SwitchForm";


export function CollectionTypeSelect() {
  const txTimelineContext = useTxTimelineContext();
  const customCollection = txTimelineContext.customCollection;
  const setCustomCollection = txTimelineContext.setCustomCollection;

  return {
    title: 'Custom Collection?',
    description: '',
    node: <div>
      <SwitchForm
        options={[
          {
            title: 'Template',
            message: <>Choose from a list of template collections that have already been created and implement best practices / standards..</>,
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
}