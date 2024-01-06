import { Form, Input, Typography } from "antd";
import { ApprovalInfoDetails } from "bitbadgesjs-utils";
import { MarkdownEditor } from "../../pages/account/[addressOrUsername]/settings";

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
                placeholder='Give this approval a name'
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
              <MarkdownEditor
                markdown={description}
                setMarkdown={(e) => {
                  setDescription(e);
                }}
                placeholder={`Describe this approval. How will it be used? Who can use it?`}
              />
            </Form.Item>
          </div>
        </Form>
      </>
    </div>
  }
}