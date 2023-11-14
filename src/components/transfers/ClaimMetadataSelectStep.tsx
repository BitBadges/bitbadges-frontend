import { Form, Input, Typography } from "antd";
import { ApprovalInfoDetails } from "bitbadgesjs-utils";

export function ClaimMetadataSelect({
  approvalDetails,
  setApprovalDetails,
}: {
  approvalDetails: ApprovalInfoDetails<bigint>,
  setApprovalDetails: (approvalDetails: ApprovalInfoDetails<bigint>) => void,
}) {
  return <>{ClaimMetadataSelectSelectStep(approvalDetails, setApprovalDetails).description}</>
}

export function ClaimMetadataSelectSelectStep(
  approvalDetails: ApprovalInfoDetails<bigint>,
  setApprovalDetails: (approvalDetails: ApprovalInfoDetails<bigint>) => void,
) {

  const name = approvalDetails.name;
  const description = approvalDetails.description;

  const setName = (name: string) => {
    setApprovalDetails({
      ...approvalDetails,
      name,
    });
  }

  const setDescription = (description: string) => {
    setApprovalDetails({
      ...approvalDetails,
      description,
    });
  }

  return {
    title: 'Metadata',
    description: <div>
      <>
        <br />
        <Form
          colon={false}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
        >
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
            <Form.Item
              label={<>
                <Typography.Text className='primary-text' strong>
                  Name
                </Typography.Text >
              </>}
            >
              <Input
                defaultValue={name}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                className="form-input inherit-bg primary-text"
              />
            </Form.Item>
            <Form.Item
              label={<>
                <Typography.Text className='primary-text' strong>
                  Description
                </Typography.Text>
              </>}
            >
              <Input.TextArea
                defaultValue={description}
                placeholder="Describe this approval. How do users get approved? What is it for?"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                className="form-input inherit-bg primary-text"
                rows={7}
              />
            </Form.Item>
          </div>
        </Form>
      </>
    </div>,
    // disabled: !approvalDetails.name || !approvalDetails.description,
  }
}