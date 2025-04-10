import { Heading, SelectBox, Img, Text } from "./..";
import React from "react";

const dropDownOptions = [
  { label: "Option1", value: "option1" },
  { label: "Option2", value: "option2" },
  { label: "Option3", value: "option3" },
];

export default function LabelInputDropdown({
  baseTokenText = "Base token",
  percentageText = "50%",
  maxText = "Max",
  zeroText = "0",
  ...props
}) {
  return (
    <div {...props} className={`${props.className} border-blue_gray-900 border border-solid rounded-lg`}>
      <div className="flex items-center justify-center self-stretch bg-black-900_01 p-2">
        <Text size="body_body_xs_default" as="p" className="text-[12px] font-normal !text-white-a700">
          {baseTokenText}
        </Text>
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          <Text
            size="body_body_xs_default"
            as="p"
            className="flex items-center justify-center rounded-sm bg-gray-900 p-0.5 text-[12px] font-normal !text-white-a700"
          >
            {percentageText}
          </Text>
          <Text
            size="body_body_xs_default"
            as="p"
            className="flex items-center justify-center rounded-sm bg-gray-900 p-0.5 text-[12px] font-normal !text-white-a700"
          >
            {maxText}
          </Text>
        </div>
      </div>
      <div className="flex items-center justify-between gap-5 self-stretch bg-gray-900 p-3">
        <SelectBox
          shape="round"
          indicator={<Img src="images/img_arrowdown.svg" alt="Arrow Down" className="h-[24px] w-[24px]" />}
          formatOptionLabel={(e) => (
            <>
              <div className="flex items-center">
                <Img src="images/img_close.svg" alt="Close" className="h-[24px] w-[24px]" />
                <span>{e.label}</span>
              </div>
            </>
          )}
          name="button_three"
          placeholder={`BNB`}
          options={dropDownOptions}
          className="w-[28%] gap-1 rounded-lg !border-[0.5px] px-2.5 font-semibold"
        />
        <Heading as="h4" className="text-[24px] font-semibold">
          {zeroText}
        </Heading>
      </div>
    </div>
  );
}
