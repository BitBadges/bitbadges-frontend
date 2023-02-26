import { MetadataAddMethod } from "../../../bitbadges-api/types";
import { SwitchForm } from "../form-items/SwitchForm";

export function MetadataStorageSelectStepItem(
    addMethod: MetadataAddMethod,
    setAddMethod: (addMethod: MetadataAddMethod) => void
) {
    return {
        title: 'Metadata Storage',
        description: `Choose how to store metadata for the badges in this collection.`,
        node: <SwitchForm
            noSelectUntilClick
            options={[
                {
                    title: 'Self-Hosted (Advanced)',
                    message: `Select this option if you want to store and host the metadata yourself. You will provide a custom URI that is used to fetch the metadata.`,
                    isSelected: addMethod === MetadataAddMethod.UploadUrl,
                },
                {
                    title: 'IPFS (Recommended)',
                    message: `We will handle the storage of the metadata for you! We do this using the InterPlanetary File System (IPFS).`,
                    isSelected: addMethod === MetadataAddMethod.Manual,
                },
            ]}
            onSwitchChange={(idx) => {
                if (idx === 1) {
                    setAddMethod(MetadataAddMethod.Manual);
                } else if (idx === 0) {
                    setAddMethod(MetadataAddMethod.UploadUrl);
                }
            }}
        />,
        disabled: addMethod === MetadataAddMethod.None
    }
}