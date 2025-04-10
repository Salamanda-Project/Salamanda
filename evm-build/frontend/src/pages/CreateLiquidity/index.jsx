import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import LiquidityPoolCreationSection from "./LiquidityPoolCreationSection";
import React from "react";

export default function CreateliquidityPage() {
  return (
    <>
      <Helmet>
        <title>Create Liquidity Pools - Boost Your Token&#39;s Liquidity</title>
        <meta
          name="description"
          content="Establish a liquidity pool for your token on Salamanda. Connect your wallet, set initial prices, and choose fee tiers to optimize your token's market presence and trading efficiency."
        />
      </Helmet>
      <div className="flex w-full flex-col gap-20 bg-black-900_01 md:gap-[60px] sm:gap-10">
        <Header />
        {/* liquidity pool creation section */}
        <LiquidityPoolCreationSection />
      </div>
    </>
  );
}
