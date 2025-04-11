import React from "react";
import { Heading, Text, Button, Img } from "../../components/index";

export default function TokenCreationSuccessSection({ token, onCreateAnother }) {
  return (
    <div className="flex justify-center bg-black-900_19 py-[66px] md:py-5">
      <div className="container-xs mt-3.5 flex justify-center md:px-5">
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-[16px] border border-solid border-gray-900_03 bg-black-900_01 p-8">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-green-500/20 p-4">
                <Img
                  src="images/img_checkmark.svg"
                  alt="Success"
                  className="h-8 w-8"
                />
              </div>
              <Heading
                size="heading_heading_xl"
                as="h2"
                className="text-center text-[28px] font-bold"
              >
                Token Created Successfully!
              </Heading>
            </div>
            
            <div className="flex w-full flex-col gap-4 rounded-lg bg-black-900_33 p-6">
              <div className="flex justify-between">
                <Text as="p" className="text-[14px] font-medium text-gray-400">
                  Token Name
                </Text>
                <Text as="p" className="text-[16px] font-semibold">
                  {token.name}
                </Text>
              </div>
              
              <div className="flex justify-between">
                <Text as="p" className="text-[14px] font-medium text-gray-400">
                  Symbol
                </Text>
                <Text as="p" className="text-[16px] font-semibold">
                  {token.symbol}
                </Text>
              </div>
              
              <div className="flex justify-between">
                <Text as="p" className="text-[14px] font-medium text-gray-400">
                  Token Address
                </Text>
                <div className="flex items-center gap-2">
                  <Text as="p" className="text-[16px] font-semibold">
                    {token.address.substring(0, 6)}...{token.address.substring(38)}
                  </Text>
                  <Button
                    onClick={() => navigator.clipboard.writeText(token.address)}
                    className="p-1"
                    color="transparent"
                  >
                    <Img
                      src="images/img_copy.svg"
                      alt="Copy"
                      className="h-4 w-4"
                    />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Text as="p" className="text-[14px] font-medium text-gray-400">
                  Total Supply
                </Text>
                <Text as="p" className="text-[16px] font-semibold">
                  {token.totalSupply} {token.symbol}
                </Text>
              </div>
              
              <div className="flex justify-between">
                <Text as="p" className="text-[14px] font-medium text-gray-400">
                  Transaction
                </Text>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${token.hash}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-400"
                >
                  <Text as="p" className="text-[14px]">
                    View on Explorer
                  </Text>
                  <Img
                    src="images/img_external_link.svg"
                    alt="External link"
                    className="h-4 w-4"
                  />
                </a>
              </div>
            </div>
            
            <div className="flex w-full flex-col gap-3">
              <Button
                color="pink_300_deep_purple_A200"
                onClick={onCreateAnother}
                className="w-full rounded-lg py-3 font-semibold"
              >
                Create Another Token
              </Button>
              
              <Button
                color="black_900"
                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${token.hash}`, '_blank')}
                className="w-full rounded-lg border border-solid border-gray-700 py-3 font-semibold"
              >
                View Token Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}