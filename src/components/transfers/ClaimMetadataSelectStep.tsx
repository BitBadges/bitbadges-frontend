import { Form } from 'antd';
import { ApprovalInfoDetails } from 'bitbadgesjs-sdk';
import { GenericTextFormInput, GenericMarkdownFormInput } from '../tx-timelines/form-items/MetadataForm';

export function ClaimMetadataSelect({
  approvalDetails,
  setApprovalDetails
}: {
  approvalDetails: ApprovalInfoDetails<bigint>;
  setApprovalDetails: (approvalDetails: ApprovalInfoDetails<bigint>) => void;
}) {
  return <>{ClaimMetadataSelectSelectStep(approvalDetails, setApprovalDetails).description}</>;
}

export function ClaimMetadataSelectSelectStep(
  approvalDetails: ApprovalInfoDetails<bigint>,
  //React set state
  setApprovalDetails: (approvalDetails: ApprovalInfoDetails<bigint>) => void
) {
  const name = approvalDetails.name;
  const description = approvalDetails.description;

  const setName = (name: string) => {
    setApprovalDetails(new ApprovalInfoDetails({ ...approvalDetails, name }));
  };

  const setDescription = (description: string) => {
    setApprovalDetails(new ApprovalInfoDetails({ ...approvalDetails, description }));
  };

  return {
    title: 'Metadata',
    description: (
      <div>
        <>
          <br />
          <Form colon={false} layout="vertical" className="p-4">
            <div
              style={{
                marginBottom: 20,
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
              <GenericTextFormInput label="Name" value={name} setValue={setName} placeholder="Give this approval a name" />
              <GenericMarkdownFormInput
                label="Description"
                value={description}
                setValue={setDescription}
                placeholder="Describe this approval. How will it be used? Who can use it?"
              />
            </div>
          </Form>
        </>
      </div>
    )
  };
}
