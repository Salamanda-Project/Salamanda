import { Text, Heading, Button, Img } from "./..";
import React from "react";

export default function LaunchInfoSection({
  headerText = "Why you should launch on Salamanda",
  descriptionText = "Sed vitae lacus tincidunt, ultrices nisl nec, lobortis est. In laoreet, est a aliquam sodales, massa metus posuere purus, ut semper purus odio eget massa. Pellentesque quis sagittis quam, nec interdum nisl. Maecenas feugiat, velit vel posuere malesuada, mi tortor iaculis augue, vel vulputate massa mauris id libero",
  ...props
}) {
  return (
    <div {...props} className={`${props.className} flex flex-col items-center w-full gap-4`}>
      <Button shape="square" className="w-[48px] px-3">
        <Img src="images/img_placeholder.svg" />
      </Button>
      <div className="flex flex-col items-center justify-center gap-1.5 self-stretch">
        <Heading size="heading_heading_sm" as="h6" className="text-[18px] font-semibold">
          {headerText}
        </Heading>
        <Text as="p" className="self-stretch text-center text-[14px] font-normal leading-5">
          {descriptionText}
        </Text>
      </div>
    </div>
  );
}
