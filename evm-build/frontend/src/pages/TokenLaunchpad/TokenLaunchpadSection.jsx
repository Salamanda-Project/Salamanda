import React from "react";
import { Heading, Button, TextArea, Text, Input } from "../../components";
import FileUploadSection from "../../components/FileUploadSection";
import RevokeFreezeToggle from "../../components/RevokeFreezeToggle";

export default function TokenLaunchpadSection() {
  return (
    <div className="flex justify-center">
      <div className="container-xs flex items-start justify-center md:flex-col md:px-5">
        <div className="flex flex-1 flex-col items-start gap-4 md:self-stretch">
          <Heading
            size="heading_heading_3xl"
            as="h1"
            className="w-[90%] text-[72px] font-black leading-[80px] md:w-full md:text-[48px]"
          >
            Launch Tokens, Create Liquidity & Airdrops Easily with Salamanda
          </Heading>
          <Text size="body_body_lg_default" as="p" className="text-[20px] font-normal">
            Launch Token, Liquidity, Airdrops Easily with Salamanda
          </Text>
        </div>

        <div className="flex w-[44%] flex-col gap-5 self-center rounded-[12px] bg-gray-900_01 p-4 md:w-full">
          {/* Token Creation Section */}
          <div className="flex flex-col items-start justify-center gap-1">
            <Heading size="heading_heading_md" as="h2" className="text-[24px] font-bold md:text-[22px]">
              Create Your Token
            </Heading>
            <Text as="p" className="text-[14px] font-normal">Setup your token here</Text>
          </div>

          {/* Input Fields */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 sm:flex-col">
              <div className="flex w-full flex-col items-start gap-1">
                <Text as="p" className="text-[14px] font-normal">Token Name</Text>
                <Input shape="round" name="name" placeholder="e.g Salamanda" className="rounded-lg px-2.5" />
              </div>
              <div className="flex w-full flex-col items-start gap-0.5">
                <Text as="p" className="text-[14px] font-normal">Symbol</Text>
                <Input shape="round" name="symbol" placeholder="e.g SAL" className="rounded-lg px-2.5" />
              </div>
            </div>

            <div className="flex gap-3 sm:flex-col">
              <div className="flex w-full flex-col items-start gap-1">
                <Text as="p" className="text-[14px] font-normal">Decimals</Text>
                <Input shape="round" name="decimals" placeholder="e.g 6" className="rounded-lg px-2.5" />
              </div>
              <div className="flex w-full flex-col items-start gap-0.5">
                <Text as="p" className="text-[14px] font-normal">Supply</Text>
                <Input
                  shape="round"
                  name="supply"
                  placeholder="How much of the token is minted?"
                  className="rounded-lg px-2.5"
                />
              </div>
            </div>

            <div className="flex flex-col items-start gap-0.5">
              <Text as="p" className="text-[14px] font-normal">Description</Text>
              <TextArea
                shape="round"
                name="description"
                placeholder="What should people know about the token?"
                className="self-stretch rounded-lg px-2.5 text-blue_gray-900"
              />
            </div>

            <FileUploadSection />
          </div>

          {/* Additional Features */}
          <div className="flex flex-col items-center gap-5">
            <div className="flex flex-col gap-5 self-stretch">
              <RevokeFreezeToggle />
              <RevokeFreezeToggle
                titleText="Revoke Mint"
                descriptionText="Mint Authority allows you to increase tokens supply"
              />
            </div>

            <Button
              color="red_A700"
              size="xs"
              shape="round"
              className="self-stretch rounded-lg px-[34px] font-semibold sm:px-5"
            >
              Create Token
            </Button>

            <Heading size="body_body_xs_semibold" as="h3" className="text-[12px] font-semibold !text-gray-400">
              Total Fees: 0.3 ETH
            </Heading>
          </div>
        </div>
      </div>
    </div>
  );
}
