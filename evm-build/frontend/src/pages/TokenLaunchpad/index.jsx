import { Helmet } from "react-helmet";
import Header from "../../components/Header";
import DeFiSolutionSection from "./DefiSolutionSection";
import FAQsSection from "./FAQSection";
import HeroSection from "./HeroSection";
import WhyLaunchSection from "./WhyLaunchSection";
import React from "react";

export default function TokenlaunchpadPage() {
  return (
    <>
      <Helmet>
        <title>Token Launch Platform - Create & Manage Your Crypto Tokens</title>
        <meta
          name="description"
          content="Launch your cryptocurrency with ease on Salamanda. Create liquidity, airdrops, and connect your wallet for a seamless token launch experience. Maximize your DeFi potential with our user-friendly platform."
        />
      </Helmet>
      <div className="w-full bg-black-900_02">
        <Header />
        <div className="mb-1">
          <HeroSection />
          <WhyLaunchSection />
          <DeFiSolutionSection />
          <FAQsSection />
        </div>
      </div>
    </>
  );
}