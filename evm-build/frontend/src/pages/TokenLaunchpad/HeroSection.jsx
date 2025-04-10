import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import RevokeFreezeToggle from "../../components/RevokeFreezeToggle";
import FileUploadComponent from "../../components/FileUploadSection";
import { Heading, Img, Text, Input, TextArea, Button } from "../../components/index";
import { parseUnits } from "ethers";
import { tokenFactoryAbi } from "../../constants/tokenFactoryAbi";
import TokenCreationSuccessSection from "./TokenSuccessSection";

/* global BigInt */  // Add this line to tell ESLint that BigInt is a global object

const TOKEN_FACTORY_ADDRESS = "0x6D0edbc313164C25c8fF58611805e221b5c4EAaf";

export default function HeroSection() {
  // Get wallet information directly from wagmi
  const { address, isConnected } = useAccount();
  
  // State for form fields
  const [tokenData, setTokenData] = useState({
    name: "",
    symbol: "",
    decimals: "18",
    totalSupply: "",
    description: "",
    enableAntiBot: true,
    revokeMint: false
  });
  
  // State for transaction status
  const [txStatus, setTxStatus] = useState({
    loading: false,
    error: null,
    success: false,
    tokenAddress: null,
    hash: null,
    createdToken: null
  });

  // Use wagmi's useWriteContract hook
  const { writeContract, data: hash, isPending, error, reset: resetWrite } = useWriteContract();
  
  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt, reset: resetWait } = useWaitForTransactionReceipt({
    hash,
  });
  
  // Handle success when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && receipt && hash) {
      console.log("Transaction confirmed:", receipt);
      
      // Event signature hash for "TokenCreated(address,address)"
      const TOKEN_CREATED_EVENT_HASH = "0xd5f9bdf12adf29dab0248c349842c3822d53ae2bb4f36352f301630d018c8139";
      
      // Extract token address from transaction logs
      let tokenAddress = null;
      let managerAddress = null;
      try {
        // Find the TokenCreated event log
        const eventLog = receipt.logs.find(log => 
          log.topics[0] === TOKEN_CREATED_EVENT_HASH
        );
        
        if (eventLog) {
          // For non-indexed parameters, they appear in the data field
          // Data is encoded as:
          // - bytes 0-32: token address
          // - bytes 32-64: manager address
          tokenAddress = '0x' + eventLog.data.substring(26, 66);
          managerAddress = '0x' + eventLog.data.substring(90, 130);
          
          console.log("Extracted addresses:", {
            token: tokenAddress,
            manager: managerAddress
          });
        } else {
          console.warn("TokenCreated event not found in logs");
          throw new Error("Token creation event not found in transaction logs");
        }
      } catch (err) {
        console.error("Error parsing logs:", err);
        setTxStatus({
          loading: false,
          error: "Token created but we couldn't parse the address. Check transaction for details.",
          success: false,
          hash: hash
        });
        return;
      }
      
      // Create token object with all details
      const createdToken = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        totalSupply: tokenData.totalSupply,
        address: tokenAddress,
        manager: managerAddress,
        hash: hash,
        creator: address
      };
      
      setTxStatus({
        loading: false,
        error: null,
        success: true,
        tokenAddress: tokenAddress,
        hash: hash,
        createdToken: createdToken
      });
    }
  }, [isConfirmed, receipt, hash, tokenData, address]);

  // Update status when hash changes
  useEffect(() => {
    if (hash) {
      console.log("Transaction hash:", hash);
      setTxStatus({
        ...txStatus,
        loading: true,
        error: null,
        success: false,
        message: "Transaction submitted, waiting for confirmation...",
        hash: hash
      });
    }
  }, [hash]);

  // Update status when error occurs
  useEffect(() => {
    if (error) {
      console.error("Error creating token:", error);
      setTxStatus({
        loading: false,
        error: error.message || "Failed to create token",
        success: false,
        tokenAddress: null,
        hash: null,
        createdToken: null
      });
    }
  }, [error]);

  // Handle input changes
  const handleInputChange = (e) => {
    if (!e || !e.target) {
      console.error("handleInputChange was called without a valid event object", e);
      return;
    }
    
    const { name, value } = e.target;
    setTokenData({
      ...tokenData,
      [name]: value
    });
  };

  // Toggle handlers
  const handleAntiBotToggle = (isEnabled) => {
    setTokenData({
      ...tokenData,
      enableAntiBot: isEnabled
    });
  };

  const handleRevokeMintToggle = (isEnabled) => {
    setTokenData({
      ...tokenData,
      revokeMint: isEnabled
    });
  };

  // Reset function to allow creating another token
  const handleCreateAnother = () => {
    console.log("Resetting form for new token creation");
    
    // Reset transaction status
    setTxStatus({
      loading: false,
      error: null,
      success: false,
      tokenAddress: null,
      hash: null,
      createdToken: null
    });
    
    // Reset form data
    setTokenData({
      name: "",
      symbol: "",
      decimals: "18",
      totalSupply: "",
      description: "",
      enableAntiBot: true,
      revokeMint: false
    });
    
    // Reset wagmi hooks
    if (resetWrite) resetWrite();
    if (resetWait) resetWait();
  };

  // Function to create token
  const createToken = async () => {
    try {
      // Check if wallet is connected
      if (!isConnected || !address) {
        throw new Error("Please connect your wallet first");
      }
      
      // Validate form data
      if (!tokenData.name || !tokenData.symbol || !tokenData.totalSupply) {
        throw new Error("Please fill all required fields (name, symbol, supply)");
      }
      
      // Parse decimals and total supply
      const decimals = parseInt(tokenData.decimals || "18");
      const parsedSupply = parseUnits(tokenData.totalSupply, decimals);
      
      // Initial holders
      const initialHolders = [
        address,
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000001",
        "0x0000000000000000000000000000000000000002"
      ];
      
      // Calculate initial amounts
      const initialAmounts = [
        BigInt(parsedSupply) * BigInt(50) / BigInt(100), // 50% to creator
        BigInt(0),                        // 0% to address(0)
        BigInt(parsedSupply) * BigInt(2) / BigInt(100),  // 2% to address(1)
        BigInt(parsedSupply) * BigInt(1) / BigInt(100)   // 1% to address(2)
      ];
      
      // Set max transaction and wallet amounts
      const maxTxAmount = BigInt(parsedSupply) * BigInt(2) / BigInt(100);   // 2% of total supply
      const maxWalletAmount = BigInt(parsedSupply) * BigInt(5) / BigInt(100); // 5% of total supply
      
      // Creation fee (0.0001 ETH)
      const creationFee = parseUnits("0.0001", 18);
      
      // Execute contract call
      writeContract({
        address: TOKEN_FACTORY_ADDRESS,
        abi: tokenFactoryAbi,
        functionName: "createToken",
        args: [
          tokenData.name,
          tokenData.symbol,
          decimals,
          parsedSupply,
          initialHolders,
          initialAmounts,
          tokenData.enableAntiBot,
          maxTxAmount,
          maxWalletAmount
        ],
        value: creationFee
      });
      
    } catch (err) {
      console.error("Error preparing token creation:", err);
      setTxStatus({ 
        loading: false, 
        error: err.message || "Failed to create token", 
        success: false,
        tokenAddress: null,
        hash: null,
        createdToken: null
      });
    }
  };

  // Determine button state
  const buttonLoading = isPending || isConfirming || txStatus.loading;
  const buttonText = buttonLoading 
    ? isPending 
      ? "Waiting for wallet..." 
      : isConfirming 
        ? "Confirming..." 
        : "Creating..." 
    : "Create Token";

  // If token creation was successful, show success component
  if (txStatus.success && txStatus.createdToken) {
    return <TokenCreationSuccessSection 
      token={txStatus.createdToken}
      onCreateAnother={handleCreateAnother}
    />;
  }

  // Original token creation form
  return (
    <div>
      <div className="flex justify-center bg-black-900_19 py-[66px] md:py-5">
        <div className="container-xs mt-3.5 flex justify-center md:px-5">
          <div className="flex w-full flex-col items-center">
            <Heading
              size="heading_heading_2xl"
              as="h1"
              className="relative z-[1] w-[52%] text-center text-[56px] font-black leading-[64px] md:w-full md:text-[48px] sm:text-[42px]"
            >
              Launch Tokens, Create liquidity & Airdrops easily with Salamanda
            </Heading>
            <div className="relative mt-[-174px] self-stretch">
              <div className="mx-[114px] flex justify-between gap-5 md:mx-0">
                <Img
                  src="images/img_cardano.png"
                  alt="Cardano"
                  className="h-[120px] w-[18%] object-contain"
                />
                <Img
                  src="images/img_uniswap.png"
                  alt="Uniswap"
                  className="mr-[414px] h-[120px] w-[18%] object-contain"
                />
              </div>
              <div className="relative mt-[-2px] flex items-center justify-center md:flex-col">
                <div className="flex flex-col items-start gap-[206px] pl-[68px] pr-14 md:gap-[154px] md:px-5 sm:gap-[103px]">
                  <Img
                    src="images/img_sol.png"
                    alt="Sol"
                    className="h-[120px] w-[74%] object-contain"
                  />
                  <Img
                    src="images/img_btc.png"
                    alt="Btc"
                    className="h-[120px] w-[72%] self-end object-contain"
                  />
                </div>
                <div className="flex flex-1 items-start md:flex-col md:self-stretch">
                  <div className="relative mt-[86px] h-[744px] flex-1 self-end px-[38px] md:w-full md:flex-none md:self-stretch sm:px-5">
                    <Img
                      src="images/img_eth.png"
                      alt="Eth"
                      className="absolute left-[13%] top-[26%] m-auto h-[120px] w-[20%] object-contain"
                    />
                    <Img
                      src="images/img_bnb.png"
                      alt="Bnb"
                      className="absolute bottom-0 right-[24%] m-auto h-[120px] w-[24%] object-contain"
                    />
                    <div className="absolute bottom-0 left-0 right-0 top-0 my-auto ml-7 mr-auto flex h-max flex-1 flex-col gap-5 rounded-[12px] border border-solid border-gray-900_03 bg-black-900_01 p-4 md:ml-0">
                      <div className="flex flex-col items-start justify-center gap-1">
                        <Heading
                          as="h2"
                          className="text-[24px] font-semibold md:text-[22px]"
                        >
                          Create your token
                        </Heading>
                        <Text as="p" className="text-[14px] font-normal">
                          Setup your token here
                        </Text>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-3 sm:flex-col">
                            <div className="flex w-full flex-col items-start justify-center gap-1 sm:w-full">
                              <Text as="p" className="text-[14px] font-normal">
                                Token name
                              </Text>
                              <Input
                                shape="round"
                                name="name"
                                value={tokenData.name}
                                onChange={handleInputChange}
                                placeholder="e.g Salamanda"
                                className="rounded-lg px-2.5"
                              />
                            </div>
                            <div className="flex w-full flex-col items-start justify-center gap-0.5 sm:w-full">
                              <Text as="p" className="text-[14px] font-normal">
                                Symbol
                              </Text>
                              <Input
                                shape="round"
                                name="symbol"
                                value={tokenData.symbol}
                                onChange={handleInputChange}
                                placeholder="e.g Sal"
                                className="rounded-lg px-2.5"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 sm:flex-col">
                            <div className="flex w-full flex-col items-start justify-center gap-1 sm:w-full">
                              <Text as="p" className="text-[14px] font-normal">
                                Decimals
                              </Text>
                              <Input
                                shape="round"
                                name="decimals"
                                value={tokenData.decimals}
                                onChange={handleInputChange}
                                placeholder="e.g 18"
                                className="rounded-lg px-2.5"
                              />
                            </div>
                            <div className="flex w-full flex-col items-start justify-center gap-0.5 sm:w-full">
                              <Text as="p" className="text-[14px] font-normal">
                                Supply
                              </Text>
                              <Input
                                shape="round"
                                name="totalSupply"
                                value={tokenData.totalSupply}
                                onChange={handleInputChange}
                                placeholder="How much of the token is minted?"
                                className="rounded-lg px-2.5"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start justify-center gap-0.5">
                          <Text as="p" className="text-[14px] font-normal">
                            Description
                          </Text>
                          <TextArea
                            shape="round"
                            name="description"
                            value={tokenData.description}
                            onChange={handleInputChange}
                            placeholder="What should people know about the token?"
                            className="self-stretch rounded-lg px-2.5 text-blue_gray-900"
                          />
                        </div>
                        <FileUploadComponent />
                      </div>
                      <div className="flex flex-col gap-5">
                        <RevokeFreezeToggle 
                          onChange={handleAntiBotToggle}
                          isEnabled={tokenData.enableAntiBot}
                          titleText="Enable Anti-Bot"
                          descriptionText="Protect your token from bots and snipers"
                        />
                        <RevokeFreezeToggle
                          onChange={handleRevokeMintToggle}
                          isEnabled={tokenData.revokeMint}
                          titleText="Revoke Mint"
                          descriptionText="Mint Authority allows you to increase tokens supply"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-5">
                        {isConnected ? (
                          <>
                            <Button
                              color="black_900"
                              size="xs"
                              shape="round"
                              className="self-stretch rounded-lg px-[34px] font-semibold sm:px-5"
                              onClick={createToken}
                              disabled={buttonLoading}
                            >
                              {buttonText}
                            </Button>
                            {txStatus.hash && !txStatus.success && !txStatus.error && (
                              <>
                                <Text as="p" className="text-yellow-500 text-sm">
                                  Transaction submitted: {txStatus.hash.substring(0, 8)}...{txStatus.hash.substring(58)}
                                </Text>
                              </>
                            )}
                            {txStatus.error && (
                              <Text as="p" className="text-red-500 text-sm">
                                Error: {txStatus.error}
                              </Text>
                            )}
                            <Text as="p" className="text-green-500 text-sm">
                              Connected: {address?.substring(0, 6)}...{address?.substring(38)}
                            </Text>
                          </>
                        ) : (
                          <Text as="p" className="text-red-500 text-sm">
                            Please connect your wallet using the button in the header
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-[30%] items-center justify-center gap-4 md:w-full">
                    <div className="flex flex-1 flex-col items-end gap-80 md:gap-60 sm:gap-40">
                      <Img
                        src="images/img_axs.png"
                        alt="Axs"
                        className="h-[120px] w-[66%] object-contain"
                      />
                      <Img
                        src="images/img_poly.png"
                        alt="Poly"
                        className="mr-[22px] h-[120px] w-[74%] object-contain md:mr-0"
                      />
                    </div>
                    <Img
                      src="images/img_star_atlas.png"
                      alt="Image"
                      className="mb-[164px] h-[120px] w-[40%] self-end object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}