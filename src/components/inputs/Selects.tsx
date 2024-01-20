import { Tooltip, Checkbox, Radio } from "antd";
import { ReactNode, useEffect, useRef, useState } from "react";

export const RadioGroup = ({
  label,
  value,
  onChange,
  options,
}: {
  label?: string | ReactNode
  value: any
  onChange: (value: any) => void
  options: ({
    label: string | ReactNode
    value: any
  } | undefined)[]
}) => {
  return (
    <div className="flex-center flex-column">
      <div className="primary-text">{label}</div>
      <Radio.Group
        className="primary-text flex-center flex-wrap"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        buttonStyle="solid"
        style={{ marginTop: 10 }}
      >
        {options.map((option) => {
          if (!option) return <></>

          return (
            <Radio.Button value={option.value} key={option.value} className="rounded-lg" style={{ margin: 1, borderWidth: 1 }} >
              <div className="primary-text capitalize hover:text-gray-400" style={{ color: value === option.value ? 'white' : undefined }}>
                {option.label}
              </div>
            </Radio.Button>
          )
        })}
      </Radio.Group>
    </div>
  )
}

export const SelectWithOptions = ({
  title,
  value,
  setValue,
  options,
  type
}: {
  title: string;
  value: string | undefined;
  setValue: (value: string | undefined) => void;
  options: {
    disabled?: boolean;
    disabledReason?: string;
    label: string | ReactNode;
    value: string | undefined;
  }[];
  type?: 'button'
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="primary-text flex-bet" style={{ margin: 4, }}>
      <div>
        <b className="text-md">{title}</b>
        <div className="mt-2 relative" ref={dropdownRef}>
          <div className="relative inline-block w-full">
            <div className="relative z-10">
              {type === 'button' && <button
                data-dropdown-toggle={"dropdown" + title}
                type="button"
                className="styled-button-normal rounded-lg w-full py-2 px-4 text-center cursor-pointer shadow-sm focus:outline-none sm:text-sm"
                style={{
                  borderWidth: 1, fontWeight: 'bold',
                  border: type === 'button' ? selected ? '2px solid #1890ff' : '1px solid #D1D5DB' : undefined,
                  color: type === 'button' ? selected ? '#1890ff' : undefined : undefined,
                }}
                onClick={() => {
                  if (type === 'button') {
                    setSelected(!selected)

                    setValue(options.find((option) => option.value !== value)?.value);
                  } else {
                    setOpen(!open)
                  }
                }}
              >
                {(
                  options.find((option) => option.value === value)?.label
                )}
              </button>}

              {type !== 'button' && <button
                data-dropdown-toggle={"dropdown" + title}
                type="button"
                className="styled-button-normal rounded-lg w-full py-2 px-4 text-center cursor-pointer border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                style={{
                  borderWidth: 1, fontWeight: 'bold',
                }}
                onClick={() => {
                  if (type === 'button') {
                    setSelected(!selected)

                    setValue(options.find((option) => option.value !== value)?.value);
                  } else {
                    setOpen(!open)
                  }
                }}
              >
                {value ? (
                  options.find((option) => option.value === value)?.label
                ) : (
                  <span className="text-gray-400">Select an option</span>
                )}
              </button>}
            </div>


            {open &&
              <div id={"dropdown" + title} className="full-width absolute z-20">
                {(
                  <ul className="list-none absolute z-20 mt-2  bg-white shadow-lg rounded py-1" id={"dropdown" + title}>
                    {options.map((option, idx) => (
                      <li
                        key={idx}
                        style={{ width: '100%' }}
                        className={`${option.disabled
                          ? 'text-red-500 cursor-not-allowed'
                          : 'text-black hover:bg-blue-200 cursor-pointer'
                          } px-4 py-2`}
                        onClick={() => {
                          if (!option.disabled) {
                            setValue(option.value);
                            setOpen(false);
                          }
                        }}
                      >
                        <Tooltip title={option.disabledReason ?? option.label}>
                          {option.label}
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                )}
              </div>}
          </div>
        </div>
      </div>
    </div >
  );
};

export const CheckboxSelect = ({
  title,
  value,
  setValue,
  options,
  disabled
}: {
  title: string,
  value: boolean | undefined,
  setValue: (value: boolean | undefined) => void,
  options: {
    label: string,
    value: boolean | undefined
  }[],
  disabled?: boolean
}) => {
  return <div className='flex' style={{ marginRight: 8, textAlign: 'start' }}>
    <div style={{ width: 200 }}>
      <b>{title}</b>
    </div>
    {options.map((option, idx) => {
      return <Checkbox
        disabled={disabled}
        className='primary-text'
        checked={value === option.value}
        onChange={(e) => {
          if (e.target.checked) {
            setValue(option.value);
          } else {
            setValue(undefined);
          }
        }}
        style={{ marginLeft: 8 }}
        key={idx}>
        <div className="primary-text">
          {option.label}
        </div>
      </Checkbox>
    })}
  </div>
}
