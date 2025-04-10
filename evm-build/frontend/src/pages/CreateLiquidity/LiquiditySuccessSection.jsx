import { Heading, Img, Text, Button } from "../../components";
import React from "react";

const feeTierOptions = [
  { label: "0.01%", value: "100" },
  { label: "0.05%", value: "500" },
  { label: "0.3%", value: "3000" },
  { label: "1%", value: "10000" },
];

export const PoolSuccessSection = ({ poolData, tokenDetails, positionId, onAddMoreLiquidity }) => {
    return (
      <div className="flex flex-col items-center min-h-[calc(100vh-1px)] bg-black-900_01">
        <div className="container-xs flex flex-col items-center gap-10 w-full md:px-5">
          <div className="flex justify-center w-full px-14 md:px-5">
            <Heading
              size="heading_heading_2xl"
              as="h1"
              className="text-[56px] font-black md:text-[48px] sm:text-[42px]"
            >
              Pool Created
            </Heading>
          </div>
          
          <div className="flex w-[48%] flex-col items-center rounded-[16px] border border-solid border-blue_gray-900 bg-gray-900_7f p-8 md:w-full">
            <div className="flex flex-col items-center gap-6 w-full">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-900_33">
                  <Img
                    src="images/img_checkmark.svg"
                    alt="Success"
                    className="h-8 w-8"
                  />
                </div>
                <Heading as="h2" className="text-center text-[28px] font-bold">
                  Liquidity Pool Initialized!
                </Heading>
                <Text as="p" className="text-center text-gray-400 text-[16px]">
                  Your {tokenDetails.tokenASymbol}/{tokenDetails.tokenBSymbol} pool is now active
                </Text>
              </div>

              <div className="flex w-full flex-col gap-4 rounded-lg bg-gray-900 p-6">
                <div className="flex items-center justify-between">
                  <Text as="p" className="text-gray-400">Token Pair:</Text>
                  <Text as="p" className="font-medium">
                    {tokenDetails.tokenASymbol}/{tokenDetails.tokenBSymbol}
                  </Text>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text as="p" className="text-gray-400">Fee Tier:</Text>
                  <Text as="p" className="font-medium">
                    {feeTierOptions.find(f => f.value === poolData.feeTier)?.label || '0.3%'}
                  </Text>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text as="p" className="text-gray-400">Initial Price:</Text>
                  <Text as="p" className="font-medium">
                    1:1 (Fixed Price)
                  </Text>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text as="p" className="text-gray-400">Position ID:</Text>
                  <Text as="p" className="font-medium">
                    #{positionId}
                  </Text>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3">
                <Button
                  color="pink_300_deep_purple_A200"
                  size="xl"
                  className="w-full rounded-lg font-bold py-3"
                  onClick={onAddMoreLiquidity}
                >
                  Add More Liquidity
                </Button>
                
                <Button
                  variant="outline"
                  color="gray_300"
                  size="xl"
                  className="w-full rounded-lg font-bold py-3 border-gray-700 hover:bg-gray-800"
                >
                  View Pool Analytics
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};