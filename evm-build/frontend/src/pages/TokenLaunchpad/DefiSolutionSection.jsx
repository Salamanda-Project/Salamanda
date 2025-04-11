import { Heading } from "../../components";
import React from "react";

export default function DeFiSolutionSection() {
  return (
    <>
      {/* de fi solution section */}
      <div className="mt-20 flex flex-col items-center">
        <div className="container-xs flex flex-col items-start gap-8 md:px-5">
          <Heading
            size="heading_heading_xl"
            as="h2"
            className="text-[40px] font-bold md:text-[38px] sm:text-[36px]"
          >
            Build your DeFi solution
          </Heading>
          <div className="flex flex-col gap-4 self-stretch">
            <div className="flex gap-4 md:flex-col">
              <div className="flex w-full flex-col items-start justify-center gap-3.5 rounded-[16px] bg-gray-900_02 p-6 sm:p-5">
                <Heading
                  as="h3"
                  className="text-[24px] font-semibold !text-deep_orange-800 md:text-[22px]"
                >
                  Provide liquidity and earn fees on swaps.
                </Heading>
                <div className="h-[478px] self-stretch rounded-[12px] bg-red-900" />
              </div>
              <div className="flex w-full flex-col items-start justify-center gap-3.5 rounded-[16px] bg-gray-900_01 p-6 sm:p-5">
                <Heading
                  as="h4"
                  className="text-[24px] font-semibold !text-teal-500 md:text-[22px]"
                >
                  Provide liquidity and earn fees on swaps.
                </Heading>
                <div className="h-[478px] self-stretch rounded-[12px] bg-teal-900" />
              </div>
            </div>
            <div className="flex flex-col items-start justify-center gap-3.5 rounded-[16px] bg-gray-900_01 p-6 sm:p-5">
              <Heading
                as="h5"
                className="text-[24px] font-semibold !text-teal-500 md:text-[22px]"
              >
                Provide liquidity and earn fees on swaps.
              </Heading>
              <div className="h-[478px] self-stretch rounded-[12px] bg-teal-900" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
