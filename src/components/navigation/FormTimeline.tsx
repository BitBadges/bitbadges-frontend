import { Typography } from 'antd';
import { ReactNode, useEffect, useState } from 'react';
import { INFINITE_LOOP_MODE } from '../../constants';
import { FormNavigationHeader } from './FormNavigationHeader';

export interface TimelineItem {
  disabled?: boolean;
  node: () => ReactNode;
  title: string | ReactNode;
  description: string | ReactNode;
  doNotDisplay?: boolean;
}

export function FormTimeline({
  items,
  formStepNum,
  setFormStepNum,
  mobileView
}: {
  formStepNum: number;
  setFormStepNum: (newStepNum: number) => void;
  items: TimelineItem[];
  mobileView?: boolean;
}) {
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);

  const filteredItems = items.filter((item) => !item.doNotDisplay);

  const incrementStep = () => {
    setFormStepNum(formStepNum + 1);
    setNextButton(formStepNum + 1);
  };

  const decrementStep = () => {
    if (formStepNum === 1) {
      return;
    }

    setFormStepNum(formStepNum - 1);
    setNextButton(formStepNum - 1);
  };

  const setNextButton = (newStepNum: number) => {
    setNextButtonDisabled(!!filteredItems[newStepNum - 1]?.disabled);
  };

  useEffect(() => {
    const filteredItems = items.filter((item) => !item.doNotDisplay);

    if (INFINITE_LOOP_MODE) console.log('useEffect: set next button ');
    setNextButtonDisabled(!!filteredItems[formStepNum - 1]?.disabled);
  }, [items, formStepNum]);

  return (
    <div style={{ textAlign: 'left' }}>
      <FormNavigationHeader
        decrementStep={decrementStep}
        incrementStep={incrementStep}
        stepNum={formStepNum}
        finalStepNumber={filteredItems.length}
        nextButtonDisabled={nextButtonDisabled}
        mobileView={mobileView}
      />
      {formStepNum - 1 < filteredItems.length && (
        <>
          <TitleElem title={filteredItems[formStepNum - 1].title} />
          <DescriptionElem description={filteredItems[formStepNum - 1].description} />
          {filteredItems[formStepNum - 1].node()}
        </>
      )}
    </div>
  );
}

const DescriptionElem = ({ description }: { description: string | ReactNode }) => {
  return (
    <div
      style={{
        justifyContent: 'center',
        display: 'flex',
        marginBottom: 10
      }}>
      <Typography.Text
        className="flex-center secondary-text"
        style={{
          fontSize: 14,
          textAlign: 'center'
        }}
        strong>
        {description}
      </Typography.Text>
    </div>
  );
};

const TitleElem = ({ title }: { title: string | ReactNode }) => {
  return (
    <div
      style={{
        justifyContent: 'center',
        display: 'flex'
      }}>
      <Typography.Text
        className="flex-center primary-text capitalize"
        style={{
          fontSize: 20,
          marginBottom: 10
        }}
        strong>
        {title}
      </Typography.Text>
    </div>
  );
};
