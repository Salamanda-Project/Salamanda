import { Text, Heading, Img } from "./..";
import React from "react";

export default function FileUploadComponent({
  tokenLogoText = "Token logo",
  uploadInstructionText = "Upload file here",
  maxFileSizeText = "Max file size: 5mb",
  ...props
}) {
  return (
    <div
      {...props}
      className={`${props.className} flex flex-col items-start justify-center gap-0.5`}
    >
      <Text as="p" className="text-[14px] font-normal">
        {tokenLogoText}
      </Text>
      <div className="flex flex-col items-center self-stretch rounded-lg border-[0.5px] border-dashed border-gray-900_03 bg-gray-900 px-3 py-4">
        <Img src="images/img_file.svg" alt="File" className="h-[24px]" />
        <div className="flex flex-col items-center justify-center gap-0.5 self-stretch px-14 md:px-5 sm:gap-0.5">
          <Heading
            size="body_body_sm_medium"
            as="p"
            className="text-[14px] font-medium !text-gray-400"
          >
            {uploadInstructionText}
          </Heading>
          <Text
            size="body_body_xs_default"
            as="p"
            className="text-[12px] font-normal !text-blue_gray-900"
          >
            {maxFileSizeText}
          </Text>
        </div>
      </div>
    </div>
  );
}
