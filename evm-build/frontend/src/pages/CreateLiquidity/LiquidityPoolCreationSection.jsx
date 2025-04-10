import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ethers } from "ethers";
import { Heading, Img, Text, Input, Button, SelectBox } from "../../components";
import LabelInputDropdown from "../../components/LabelInputDropdown";
import {PoolSuccessSection} from "./LiquiditySuccessSection";
import { tokenAbi } from "../../constants/tokenAbi";
import { tokenFactoryAbi } from "../../constants/tokenFactoryAbi";
import { positionManagerAbi } from "../../constants/positionManagerAbi";

const NONFUNGIBLE_POSITION_MANAGER = "0x1238536071E1c677A632429e3655c799b22cDA52";
const DEFAULT_SQRT_PRICE_X96 = "79228162514264337593543950336"; // 1:1 price ratio

const feeTierOptions = [
  { label: "0.01%", value: 100 }, 
  { label: "0.05%", value: 500 }, 
  { label: "0.3%", value: 3000 }, 
  { label: "1%", value: 10000 }
];

export default function LiquidityCreationSection() {
  const { address, isConnected } = useAccount();
  
  const [poolData, setPoolData] = useState({
    tokenA: "",
    tokenB: "",
    feeTier: "3000",
    amountA: "10",
    amountB: "10",
    tickLower: "-6000", // Default for 0.3% fee (60 * 100)
    tickUpper: "6000",  // Default for 0.3% fee (60 * 100)
  });

  const [tokenDetails, setTokenDetails] = useState({
    tokenADecimals: 18,
    tokenBDecimals: 18,
    tokenASymbol: "",
    tokenBSymbol: "",
    tokenALoaded: false,
    tokenBLoaded: false
  });

  
  const [txStatus, setTxStatus] = useState({
    loading: false,
    error: null,
    success: false,
    poolAddress: null,
    positionId: null,
    hash: null,
    message: "",
    transactionStep: null // Add this to track the transaction flow
  });

  // The original issue: separate write contract instances for different steps
  const { writeContract: initializePoolWrite, data: initializeHash, isPending: initializePending, error: initializeError, reset: resetInitializeWrite } = useWriteContract();
  const { isLoading: isInitializeConfirming, isSuccess: isInitializeConfirmed, data: initializeReceipt } = useWaitForTransactionReceipt({ hash: initializeHash });
  
  const { writeContract: mintPositionWrite, data: mintHash, isPending: mintPending, error: mintError, reset: resetMintWrite } = useWriteContract();
  const { isLoading: isMintConfirming, isSuccess: isMintConfirmed, data: mintReceipt } = useWaitForTransactionReceipt({ hash: mintHash });

  const { writeContract: approveTokenWrite, data: approveHash, isPending: approvePending, error: approveError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed, data: approveReceipt } = useWaitForTransactionReceipt({ hash: approveHash });

  // Add state tracking for approvals
  const [approvalsNeeded, setApprovalsNeeded] = useState({
    tokenA: true,
    tokenB: true
  });

  // Add this function to check if tokens need approval
  const checkAllowance = async (tokenAddress, ownerAddress, spenderAddress, amount) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      
      const currentAllowance = await tokenContract.allowance(ownerAddress, spenderAddress);
      return currentAllowance >= amount;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  // Handle initialize pool transaction confirmation
  // Modify the useEffect for initialize confirmation
useEffect(() => {
  if (isInitializeConfirmed && initializeReceipt && initializeHash) {
    console.log("Pool initialization confirmed, checking approvals");
    
    (async () => {
      try {
        // Determine token order (token0, token1)
        const [token0, token1] = poolData.tokenA.toLowerCase() < poolData.tokenB.toLowerCase()
          ? [poolData.tokenA, poolData.tokenB]
          : [poolData.tokenB, poolData.tokenA];
        
        // Prepare token amounts
        let amount0, amount1;
        const decimalsA = Number(tokenDetails.tokenADecimals);
        const decimalsB = Number(tokenDetails.tokenBDecimals);
        
        if (poolData.tokenA.toLowerCase() < poolData.tokenB.toLowerCase()) {
          amount0 = ethers.parseUnits(poolData.amountA.toString(), decimalsA);
          amount1 = ethers.parseUnits(poolData.amountB.toString(), decimalsB);
        } else {
          amount0 = ethers.parseUnits(poolData.amountB.toString(), decimalsB);
          amount1 = ethers.parseUnits(poolData.amountA.toString(), decimalsA);
        }
        
        // Check if approvals are needed
        const token0NeedsApproval = await checkAllowance(
          token0, 
          address, 
          NONFUNGIBLE_POSITION_MANAGER, 
          token0 === poolData.tokenA ? amount0 : amount1
        );
        
        const token1NeedsApproval = await checkAllowance(
          token1, 
          address, 
          NONFUNGIBLE_POSITION_MANAGER, 
          token1 === poolData.tokenA ? amount0 : amount1
        );
        
        setApprovalsNeeded({
          tokenA: token0 === poolData.tokenA ? !token0NeedsApproval : !token1NeedsApproval,
          tokenB: token0 === poolData.tokenB ? !token0NeedsApproval : !token1NeedsApproval
        });
        
        // Handle approvals if needed
        if (!token0NeedsApproval) {
          // Approve token0
          setTxStatus(prev => ({
            ...prev,
            transactionStep: "approving",
            loading: true,
            message: `Approving ${token0 === poolData.tokenA ? tokenDetails.tokenASymbol : tokenDetails.tokenBSymbol}. Please approve the transaction...`
          }));
          
          await approveTokenWrite({
            address: token0,
            abi: tokenAbi,
            functionName: "approve",
            args: [NONFUNGIBLE_POSITION_MANAGER, ethers.MaxUint256]
          });
          
          // Wait for approval before continuing
          return;
        } 
        
        if (!token1NeedsApproval) {
          // Approve token1
          setTxStatus(prev => ({
            ...prev,
            transactionStep: "approving",
            loading: true,
            message: `Approving ${token1 === poolData.tokenA ? tokenDetails.tokenASymbol : tokenDetails.tokenBSymbol}. Please approve the transaction...`
          }));
          
          await approveTokenWrite({
            address: token1,
            abi: tokenAbi,
            functionName: "approve",
            args: [NONFUNGIBLE_POSITION_MANAGER, ethers.MaxUint256]
          });
          
          // Wait for approval before continuing
          return;
        }
        
        // If we get here, both tokens are approved, proceed to mint
        proceedToMintPosition();
        
      } catch (error) {
        console.error("Error checking/approving tokens:", error);
        setTxStatus({
          loading: false,
          error: `Failed during approval process: ${error.message}`,
          success: false,
          transactionStep: null,
          poolAddress: null,
          positionId: null,
          hash: null,
          message: ""
        });
      }
    })();
  }
}, [isInitializeConfirmed, initializeReceipt, initializeHash]);

// Add effect for approval confirmation
useEffect(() => {
  if (isApproveConfirmed && approveReceipt && approveHash) {
    console.log("Token approval confirmed, checking if more approvals needed");
    
    // Check if we need to approve the other token
    if (approvalsNeeded.tokenA && approvalsNeeded.tokenB) {
      // We just approved one token, now approve the other
      const approvedTokenA = approveReceipt.to.toLowerCase() === poolData.tokenA.toLowerCase();
      
      if (approvedTokenA) {
        // We just approved token A, now approve token B
        setApprovalsNeeded(prev => ({ ...prev, tokenA: false }));
        setTxStatus(prev => ({
          ...prev,
          transactionStep: "approving",
          loading: true,
          message: `Approving ${tokenDetails.tokenBSymbol}. Please approve the transaction...`
        }));
        
        approveTokenWrite({
          address: poolData.tokenB,
          abi: tokenAbi,
          functionName: "approve",
          args: [NONFUNGIBLE_POSITION_MANAGER, ethers.MaxUint256]
        });
      } else {
        // We just approved token B, now approve token A
        setApprovalsNeeded(prev => ({ ...prev, tokenB: false }));
        setTxStatus(prev => ({
          ...prev,
          transactionStep: "approving",
          loading: true,
          message: `Approving ${tokenDetails.tokenASymbol}. Please approve the transaction...`
        }));
        
        approveTokenWrite({
          address: poolData.tokenA,
          abi: tokenAbi,
          functionName: "approve",
          args: [NONFUNGIBLE_POSITION_MANAGER, ethers.MaxUint256]
        });
      }
    } else {
      // Both tokens approved, proceed to mint
      setApprovalsNeeded({ tokenA: false, tokenB: false });
      proceedToMintPosition();
    }
  }
}, [isApproveConfirmed, approveReceipt, approveHash]);

// Add a separate function to handle the mint procedure
const proceedToMintPosition = () => {
  try {
    // Prepare for the mint step
    const [token0, token1] = poolData.tokenA.toLowerCase() < poolData.tokenB.toLowerCase()
      ? [poolData.tokenA, poolData.tokenB]
      : [poolData.tokenB, poolData.tokenA];
    
    // Prepare token amounts
    let amount0, amount1;
    const decimalsA = Number(tokenDetails.tokenADecimals);
    const decimalsB = Number(tokenDetails.tokenBDecimals);
    
    if (poolData.tokenA.toLowerCase() < poolData.tokenB.toLowerCase()) {
      amount0 = ethers.parseUnits(poolData.amountA.toString(), decimalsA);
      amount1 = ethers.parseUnits(poolData.amountB.toString(), decimalsB);
    } else {
      amount0 = ethers.parseUnits(poolData.amountB.toString(), decimalsB);
      amount1 = ethers.parseUnits(poolData.amountA.toString(), decimalsA);
    }
    
    const tickLower = parseInt(poolData.tickLower);
    const tickUpper = parseInt(poolData.tickUpper);
    
    const mintParams = {
      token0,
      token1,
      fee: Number(poolData.feeTier),
      tickLower,
      tickUpper,
      amount0Desired: amount0,
      amount1Desired: amount1,
      amount0Min: 0,
      amount1Min: 0,
      recipient: address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
    };
    
    // Update status
    setTxStatus(prev => ({
      ...prev,
      transactionStep: "minting",
      loading: true,
      message: "Now creating liquidity position. Please approve the transaction..."
    }));
    
    // Execute mint transaction
    mintPositionWrite({
      address: NONFUNGIBLE_POSITION_MANAGER,
      abi: positionManagerAbi,
      functionName: "mint",
      args: [mintParams]
    });
  } catch (error) {
    console.error("Error preparing mint transaction:", error);
    setTxStatus({
      loading: false,
      error: `Failed to prepare mint transaction: ${error.message}`,
      success: false,
      transactionStep: null,
      poolAddress: null,
      positionId: null,
      hash: null,
      message: ""
    });
  }
};

  // Handle mint position transaction confirmation
  useEffect(() => {
    if (isMintConfirmed && mintReceipt && mintHash) {
      // This was the mint transaction, extract position ID
      let positionId = null;
      try {
        const eventInterface = new ethers.Interface([
          'event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'
        ]);
        
        const eventLog = mintReceipt.logs.find(log => 
          log.topics[0] === eventInterface.getEvent("IncreaseLiquidity").topicHash
        );
        
        if (eventLog) {
          const parsedLog = eventInterface.parseLog(eventLog);
          positionId = parsedLog.args.tokenId.toString();
        }
      } catch (err) {
        console.error("Error parsing logs:", err);
      }
      
      // Final success state
      setTxStatus({
        loading: false,
        error: null,
        success: true,
        transactionStep: "completed",
        poolAddress: `${poolData.tokenA}-${poolData.tokenB}-${poolData.feeTier}`,
        positionId: positionId || "Unknown (check your NFT positions)",
        hash: mintHash,
        message: "Position created successfully!"
      });
    }
  }, [isMintConfirmed, mintReceipt, mintHash]);

  // Update status when initialize hash changes
  useEffect(() => {
    if (initializeHash) {
      setTxStatus(prev => ({
        ...prev,
        loading: true,
        hash: initializeHash,
        message: "Initializing pool, waiting for confirmation..."
      }));
    }
  }, [initializeHash]);

  // Update status when mint hash changes
  useEffect(() => {
    if (mintHash) {
      setTxStatus(prev => ({
        ...prev,
        loading: true,
        hash: mintHash,
        message: "Creating position, waiting for confirmation..."
      }));
    }
  }, [mintHash]);

  // Update status when error occurs
  useEffect(() => {
    if (initializeError || mintError) {
      setTxStatus({
        loading: false,
        error: (initializeError || mintError)?.message || "Failed to create liquidity position",
        success: false,
        poolAddress: null,
        positionId: null,
        hash: null,
        message: ""
      });
    }
  }, [initializeError, mintError]);

  const handleTokenChange = (tokenType, tokenAddress) => {
    setPoolData(prev => ({
      ...prev,
      [tokenType]: tokenAddress
    }));
    
    // Reset the token loaded status when changing the address
    setTokenDetails(prev => ({
      ...prev,
      [`${tokenType}Loaded`]: false
    }));

    setApprovalsNeeded(prev => ({
      ...prev,
      [tokenType]: true
    }));
    
    if (tokenAddress) {
      fetchTokenDetails(tokenAddress, tokenType);
    }
  };

  const fetchTokenDetails = async (tokenAddress, tokenType) => {
    try {
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error(`Invalid token address: ${tokenAddress}`);
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      
      // Use Promise.all to fetch both pieces of data in parallel
      const [decimals, symbol] = await Promise.all([
        tokenContract.decimals(),
        tokenContract.symbol()
      ]);
      
      setTokenDetails(prev => ({
        ...prev,
        [`${tokenType}Decimals`]: Number(decimals),
        [`${tokenType}Symbol`]: symbol,
        [`${tokenType}Loaded`]: true
      }));
      
      console.log(`${tokenType} details loaded:`, { decimals, symbol });
    } catch (error) {
      console.error(`Error fetching ${tokenType} details:`, error);
      setTxStatus(prev => ({
        ...prev,
        error: `Failed to load ${tokenType} details: ${error.message}`
      }));
      
      // Reset the token status since we couldn't load it
      setTokenDetails(prev => ({
        ...prev,
        [`${tokenType}Loaded`]: false
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (['amountA', 'amountB', 'tickLower', 'tickUpper'].includes(name)) {
      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
        setPoolData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setPoolData(prev => ({ ...prev, [name]: value }));
      
      // If changing token addresses, fetch token details
      if (name === 'tokenA' || name === 'tokenB') {
        handleTokenChange(name, value);
      }
    }
  };

  const handleFeeTierChange = (selectedOption) => {
    // Handle both direct values and SelectBox option objects
    const feeValue = selectedOption?.value ?? selectedOption;
    
    // Ensure feeValue is a number
    const feeTierNumber = Number(feeValue);
    console.log("Selected fee tier:", feeTierNumber);
    
    if (isNaN(feeTierNumber)) {
      console.error("Invalid fee tier value:", selectedOption);
      return;
    }
    
    const tickSpacing = getTickSpacing(feeTierNumber);
    setPoolData(prev => ({
      ...prev,
      feeTier: feeTierNumber, // Store as number
      tickLower: `-${tickSpacing * 100}`,
      tickUpper: `${tickSpacing * 100}`
    }));
  };
  
  const getTickSpacing = (feeTier) => {
    const fee = Number(feeTier);
    switch (fee) {
      case 100: return 1;
      case 500: return 10;
      case 3000: return 60;
      case 10000: return 200;
      default: 
        console.warn("Unknown fee tier:", feeTier, "defaulting to 60");
        return 60;
    }
  };

  const validateInputs = () => {
    // Check wallet connection
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    // Check token addresses
    if (!poolData.tokenA || !poolData.tokenB) {
      throw new Error("Please select both tokens");
    }
    
    if (!ethers.isAddress(poolData.tokenA) || !ethers.isAddress(poolData.tokenB)) {
      throw new Error("Invalid token address(es)");
    }
    
    if (poolData.tokenA.toLowerCase() === poolData.tokenB.toLowerCase()) {
      throw new Error("Token A and Token B must be different");
    }
    
    // Check token details are loaded
    if (!tokenDetails.tokenALoaded || !tokenDetails.tokenBLoaded) {
      throw new Error("Token details are still loading. Please wait or try again.");
    }
    
    // Check amounts
    if (!poolData.amountA || !poolData.amountB || 
        parseFloat(poolData.amountA) <= 0 || parseFloat(poolData.amountB) <= 0) {
      throw new Error("Please enter positive amounts for both tokens");
    }
    
    // Make sure amounts are valid numbers
    if (isNaN(parseFloat(poolData.amountA)) || isNaN(parseFloat(poolData.amountB))) {
      throw new Error("Please enter valid numeric amounts for both tokens");
    }
    
    // Check ticks
    if (!poolData.tickLower || !poolData.tickUpper) {
      throw new Error("Please enter both lower and upper tick values");
    }
    
    // Make sure ticks are valid integers
    if (isNaN(parseInt(poolData.tickLower)) || isNaN(parseInt(poolData.tickUpper))) {
      throw new Error("Please enter valid integer tick values");
    }
    
    if (parseInt(poolData.tickLower) >= parseInt(poolData.tickUpper)) {
      throw new Error("Upper tick must be greater than lower tick");
    }
    
    return true;
  };

  const createLiquidityPosition = async () => {
    try {
      // Reset error status
      setTxStatus(prev => ({ 
        ...prev, 
        error: null, 
        message: "Validating inputs...",
        transactionStep: null, // Reset transaction step
        success: false 
      }));
      
      // Validate all inputs
      validateInputs();
      
      // Sort tokens to ensure token0 < token1 as required by Uniswap
      const [token0, token1] = poolData.tokenA.toLowerCase() < poolData.tokenB.toLowerCase()
        ? [poolData.tokenA, poolData.tokenB]
        : [poolData.tokenB, poolData.tokenA];
      
      // Set up parameters for createAndInitializePoolIfNecessary
      setTxStatus(prev => ({ 
        ...prev, 
        loading: true, 
        message: "Preparing to initialize pool...",
        transactionStep: "initializing" // Set transaction step
      }));
  
      // Call the initialization transaction
      await initializePoolWrite({
        address: NONFUNGIBLE_POSITION_MANAGER,
        abi: positionManagerAbi,
        functionName: "createAndInitializePoolIfNecessary",
        args: [
          token0,
          token1,
          Number(poolData.feeTier),
          DEFAULT_SQRT_PRICE_X96
        ]
      });
  
      // The rest is handled by the useEffect
  
    } catch (err) {
      console.error("Error creating liquidity position:", err);
      setTxStatus({ 
        loading: false, 
        error: err.message || "Failed to create position", 
        success: false,
        transactionStep: null,
        poolAddress: null,
        positionId: null,
        hash: null,
        message: ""
      });
    }
  };

  const handleCreateAnother = () => {
    setTxStatus({
      loading: false,
      error: null,
      success: false,
      poolAddress: null,
      positionId: null,
      hash: null,
      message: ""
    });
    
    if (resetInitializeWrite) resetInitializeWrite();
    if (resetMintWrite) resetMintWrite();
  };

  // Calculate if form is ready for submission
  const isFormReady = tokenDetails.tokenALoaded && tokenDetails.tokenBLoaded && 
                      !isNaN(parseFloat(poolData.amountA)) && 
                      !isNaN(parseFloat(poolData.amountB)) &&
                      parseFloat(poolData.amountA) > 0 && 
                      parseFloat(poolData.amountB) > 0;
                    
  const buttonLoading = initializePending || mintPending || isInitializeConfirming || isMintConfirming || txStatus.loading;
  const buttonText = buttonLoading 
  ? initializePending || mintPending || approvePending
    ? "Waiting for wallet..." 
    : isInitializeConfirming || isMintConfirming || isApproveConfirming
      ? "Confirming..." 
      : txStatus.message || "Creating..." 
  : "Create Liquidity Position";

  if (txStatus.success) {
    return (
      <PoolSuccessSection 
        poolData={poolData}
        tokenDetails={tokenDetails}
        positionId={txStatus.positionId}
        onCreateAnother={handleCreateAnother}
      />
    );
  }

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
              Provide Liquidity on Uniswap V3
            </Heading>
            
            <div className="relative mt-[-174px] self-stretch">
              {/* Top Row Images */}
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
                {/* Left Column Images */}
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
                
                {/* Main Form Container */}
                <div className="flex flex-1 items-start md:flex-col md:self-stretch">
                  <div className="relative mt-[86px] h-[744px] flex-1 self-end px-[38px] md:w-full md:flex-none md:self-stretch sm:px-5">
                    {/* Floating Images */}
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
                    
                    {/* Form Card */}
                    <div className="absolute bottom-0 left-0 right-0 top-0 my-auto ml-7 mr-auto flex h-max flex-1 flex-col gap-5 rounded-[12px] border border-solid border-gray-900_03 bg-black-900_01 p-4 md:ml-0">
                      {/* Form Header */}
                      <div className="flex flex-col items-start justify-center gap-1">
                        <Heading
                          as="h2"
                          className="text-[24px] font-semibold md:text-[22px]"
                        >
                          Create Liquidity Position
                        </Heading>
                        <Text as="p" className="text-[14px] font-normal">
                          Select tokens and set your price range
                        </Text>
                      </div>
                      
                      {/* Vertical Form Layout */}
                      <div className="flex flex-col gap-4">
                        {/* Token A Input */}
                        <div className="flex flex-col gap-1 w-full">
                          <Text as="p" className="text-[14px] font-normal">
                            Token A Address
                          </Text>
                          <Input
                            shape="round"
                            name="tokenA"
                            value={poolData.tokenA}
                            onChange={handleInputChange}
                            placeholder="0x..."
                            className="rounded-lg w-full"
                          />
                          {tokenDetails.tokenASymbol ? (
                            <Text as="p" className="text-[12px] text-green-500">
                              Symbol: {tokenDetails.tokenASymbol} | Decimals: {tokenDetails.tokenADecimals}
                            </Text>
                          ) : poolData.tokenA && !tokenDetails.tokenALoaded ? (
                            <Text as="p" className="text-[12px] text-yellow-500">
                              Loading token details...
                            </Text>
                          ) : null}
                        </div>

                        {/* Token B Input */}
                        <div className="flex flex-col gap-1 w-full">
                          <Text as="p" className="text-[14px] font-normal">
                            Token B Address
                          </Text>
                          <Input
                            shape="round"
                            name="tokenB"
                            value={poolData.tokenB}
                            onChange={handleInputChange}
                            placeholder="0x..."
                            className="rounded-lg w-full"
                          />
                          {tokenDetails.tokenBSymbol ? (
                            <Text as="p" className="text-[12px] text-green-500">
                              Symbol: {tokenDetails.tokenBSymbol} | Decimals: {tokenDetails.tokenBDecimals}
                            </Text>
                          ) : poolData.tokenB && !tokenDetails.tokenBLoaded ? (
                            <Text as="p" className="text-[12px] text-yellow-500">
                              Loading token details...
                            </Text>
                          ) : null}
                        </div>

                        {/* Fee Tier Selector */}
                        <div className="flex flex-col gap-1 w-full">
                          <Text as="p" className="text-[14px] font-normal">
                            Fee Tier
                          </Text>
                          <SelectBox
                            shape="round"
                            name="feeTier"
                            value={feeTierOptions.find(option => 
                              option.value === poolData.feeTier
                            )}
                            onChange={handleFeeTierChange}
                            options={feeTierOptions}
                            getOptionLabel={(option) => option.label}
                            getOptionValue={(option) => option.value}
                            className="rounded-lg w-full"
                          />
                        </div>

                        {/* Fixed Price Display */}
                        <div className="flex flex-col gap-1 w-full">
                          <Text as="p" className="text-[14px] font-normal">
                            Initial Price
                          </Text>
                          <Input
                            shape="round"
                            name="sqrtPriceX96"
                            value="1:1 (Fixed)"
                            disabled
                            className="rounded-lg w-full"
                          />
                        </div>

                        {/* Token Amounts */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <Text as="p" className="text-[14px] font-normal">
                              {tokenDetails.tokenASymbol || "Token A"} Amount
                            </Text>
                            <Input
                              shape="round"
                              name="amountA"
                              value={poolData.amountA}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              className="rounded-lg w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Text as="p" className="text-[14px] font-normal">
                              {tokenDetails.tokenBSymbol || "Token B"} Amount
                            </Text>
                            <Input
                              shape="round"
                              name="amountB"
                              value={poolData.amountB}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              className="rounded-lg w-full"
                            />
                          </div>
                        </div>

                        {/* Tick Range */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <Text as="p" className="text-[14px] font-normal">
                              Tick Lower
                            </Text>
                            <Input
                              shape="round"
                              name="tickLower"
                              value={poolData.tickLower}
                              onChange={handleInputChange}
                              className="rounded-lg w-full"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Text as="p" className="text-[14px] font-normal">
                              Tick Upper
                            </Text>
                            <Input
                              shape="round"
                              name="tickUpper"
                              value={poolData.tickUpper}
                              onChange={handleInputChange}
                              className="rounded-lg w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button and Status */}
                      <div className="flex flex-col items-center gap-5">
                        {isConnected ? (
                          <>
                            <Button
                              color="black_900"
                              size="xs"
                              shape="round"
                              className="w-full rounded-lg px-[34px] font-semibold sm:px-5"
                              onClick={createLiquidityPosition}
                              disabled={buttonLoading || !isFormReady}
                            >
                              {buttonText}
                            </Button>
                            {txStatus.hash && !txStatus.success && !txStatus.error && (
                              <Text as="p" className="text-yellow-500 text-sm">
                                Transaction submitted: {txStatus.hash}
                              </Text>
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
                  
                  {/* Right Column Images */}
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