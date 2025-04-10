import { Switch, Text, Heading } from "./..";
import React from "react";

export default function RevokeFreezeToggle({
  titleText = "Revoke Freeze",
  descriptionText = "Revoke Freeze allows you to create a liquidity pool",
  ...props
}) {
  return (
    <div {...props} className={`${props.className} flex justify-center items-start self-stretch gap-4 flex-1`}>
      <div className="flex flex-1 flex-col items-start justify-center gap-1 self-center sm:gap-1">
        <Heading size="body_body_sm_semibold" as="p" className="text-[14px] font-semibold">
          {titleText}
        </Heading>
        <Text size="body_body_xs_default" as="p" className="text-[12px] font-normal">
          {descriptionText}
        </Text>
      </div>
      <Switch value={false} />
    </div>
  );
}
