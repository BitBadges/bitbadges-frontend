import { CaretLeftFilled, CaretRightFilled } from '@ant-design/icons';
import { Col, Typography } from 'antd';



export function FormNavigationHeader({
  decrementStep,
  incrementStep,
  stepNum,
  backButtonDisabled,
  nextButtonDisabled,
  finalStepNumber,
}: {
  decrementStep: () => void;
  incrementStep: () => void;
  stepNum: number;
  backButtonDisabled?: boolean;
  nextButtonDisabled?: boolean;
  finalStepNumber: number;
}) {
  return (<>
    <div className='full-width flex-center'>
      <div>
        <button
          style={{
            // backgroundColor: 'inherit',
            backgroundColor: backButtonDisabled ? 'lightgrey' : undefined,
            // color: '#ddd',
            margin: 10,
            fontSize: 17,
            cursor: backButtonDisabled ? 'not-allowed' : undefined,
            visibility: stepNum === 1 ? 'hidden' : undefined
          }}
          onClick={() => decrementStep()}
          className="landing-button"
          disabled={backButtonDisabled || stepNum === 1}
        >
          <CaretLeftFilled size={40} />
          Back
        </button>
      </div>
      <Col
        md={2}
        xs={0}
        sm={0}
      >
        <Typography.Text
          strong
          className='primary-text flex-center'
          style={{
            fontSize: 20,
          }}
        >
          {stepNum} / {finalStepNumber}
        </Typography.Text>
      </Col>

      <div>
        <button
          style={{
            backgroundColor: nextButtonDisabled ? 'lightgrey' : undefined,
            // color: '#ddd',
            fontSize: 17,
            margin: 10,
            cursor: nextButtonDisabled ? 'not-allowed' : undefined,
            visibility: stepNum === finalStepNumber ? 'hidden' : undefined
          }}
          onClick={() => incrementStep()}
          className="landing-button"
          disabled={nextButtonDisabled || stepNum === finalStepNumber}
        >
          Next
          <CaretRightFilled size={40} />
        </button>
      </div>


    </div>
    <Col
      md={0}
      xs={24}
      sm={24}
    >
      <Typography.Text
        strong
        className='primary-text full-width flex-center'
        style={{
          fontSize: 20,
          textAlign: 'center',
        }}
      >
        {stepNum} / {finalStepNumber}
      </Typography.Text>
    </Col>
  </>
  );
}
