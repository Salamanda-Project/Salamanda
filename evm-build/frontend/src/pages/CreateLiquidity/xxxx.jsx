import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount } from 'wagmi';
import { Button, SelectBox, Img, Text, Input, Heading } from "../../components";
import LabelInputDropdown from "../../components/LabelInputDropdown";

const feeTierOptions = [
  { label: "0.01%", value: "100" },
  { label: "0.05%", value: "500" },
  { label: "0.3%", value: "3000" },
  { label: "1%", value: "10000" },
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)'
];

const POSITION_MANAGER_ABI = [
  'function createAndInitializePoolIfNecessary(address tokenA, address tokenB, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)',
  'function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'
];

const NONFUNGIBLE_POSITION_MANAGER = '0x1238536071E1c677A632429e3655c799b22cDA52';

export default function LiquidityPoolCreationSection() {
  const { address } = useAccount();
  const [poolData, setPoolData] = useState({
    baseToken: "",
    quoteToken: "",
    initialPrice: "",
    feeTier: "3000",
    baseTokenAmount: "10",
    quoteTokenAmount: "10",
  });

  const [tokenDetails, setTokenDetails] = useState({
    baseTokenDecimals: 18,
    quoteTokenDecimals: 18,
    baseTokenSymbol: "",
    quoteTokenSymbol: "",
  });

  const [txStatus, setTxStatus] = useState({
    loading: false,
    error: null,
    success: false,
    poolAddress: null,
    positionId: null
  });

  // Remove all wallet connection state and handlers since they're in Header

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPoolData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeeTierChange = (value) => {
    setPoolData(prev => ({
      ...prev,
      feeTier: value
    }));
  };

  const handleTokenChange = (tokenType, tokenAddress) => {
    setPoolData(prev => ({
      ...prev,
      [tokenType]: tokenAddress
    }));
    
    if (tokenAddress) {
      fetchTokenDetails(tokenAddress, tokenType);
    }
  };

  const fetchTokenDetails = async (tokenAddress, tokenType) => {
    try {
      if (!window.ethereum) return;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const decimals = await tokenContract.decimals();
      const symbol = await tokenContract.symbol();
      
      setTokenDetails(prev => ({
        ...prev,
        [`${tokenType}Decimals`]: decimals,
        [`${tokenType}Symbol`]: symbol
      }));
      
    } catch (error) {
      console.error(`Error fetching ${tokenType} details:`, error);
    }
  };

  const initializeLiquidityPool = async () => {
    setTxStatus({ loading: true, error: null, success: false, poolAddress: null, positionId: null });
    
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to create a liquidity pool");
      }
      
      if (!poolData.baseToken || !poolData.quoteToken) {
        throw new Error("Please select both tokens");
      }
      
      if (!poolData.initialPrice || isNaN(parseFloat(poolData.initialPrice))) {
        throw new Error("Please enter a valid initial price");
      }
      
      // Get wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Connect to token contracts
      const baseToken = new ethers.Contract(poolData.baseToken, ERC20_ABI, signer);
      const quoteToken = new ethers.Contract(poolData.quoteToken, ERC20_ABI, signer);
      
      // Get token details
      const baseDecimals = await baseToken.decimals();
      const quoteDecimals = await quoteToken.decimals();
      
      // Check token balances
      const baseBalance = await baseToken.balanceOf(signer.address);
      const quoteBalance = await quoteToken.balanceOf(signer.address);
      
      console.log(`Base token balance: ${ethers.formatUnits(baseBalance, baseDecimals)}`);
      console.log(`Quote token balance: ${ethers.formatUnits(quoteBalance, quoteDecimals)}`);
      
      // Connect to Position Manager contract
      const positionManager = new ethers.Contract(
        NONFUNGIBLE_POSITION_MANAGER,
        POSITION_MANAGER_ABI,
        signer
      );
      
      // Calculate sqrt price
      // For Uniswap V3, the price is represented as sqrt(price) * 2^96
      const price = parseFloat(poolData.initialPrice);
      const sqrtPrice = Math.sqrt(price);
      const sqrtPriceX96 = ethers.toBigInt(
        Math.floor(sqrtPrice * 2 ** 96)
      );
      
      // Sort tokens (Uniswap requires token0 < token1 by address)
      let [token0, token1] = poolData.baseToken.toLowerCase() < poolData.quoteToken.toLowerCase() 
        ? [poolData.baseToken, poolData.quoteToken] 
        : [poolData.quoteToken, poolData.baseToken];
      
      // Calculate deposit amounts
      const baseAmount = ethers.parseUnits(poolData.baseTokenAmount, baseDecimals);
      const quoteAmount = ethers.parseUnits(poolData.quoteTokenAmount, quoteDecimals);
      
      // Approve tokens for Position Manager
      console.log('Approving tokens...');
      await baseToken.approve(NONFUNGIBLE_POSITION_MANAGER, baseAmount);
      await quoteToken.approve(NONFUNGIBLE_POSITION_MANAGER, quoteAmount);
      console.log('Tokens approved');
      
      // Initialize pool
      console.log('Creating or initializing pool...');
      try {
        const tx = await positionManager.createAndInitializePoolIfNecessary(
          token0, 
          token1, 
          parseInt(poolData.feeTier), 
          sqrtPriceX96
        );
        
        setTxStatus({
          ...txStatus,
          loading: true,
          message: "Initializing pool... Please wait for confirmation."
        });
        
        const receipt = await tx.wait();
        console.log('Pool initialized', receipt);
      } catch (error) {
        console.log('Pool may already exist, continuing...', error);
      }
      
      // Define position parameters
      // Calculate tick spacing based on fee tier
      const getTickSpacing = (feeTier) => {
        switch (parseInt(feeTier)) {
          case 100: return 1;
          case 500: return 10;
          case 3000: return 60;
          case 10000: return 200;
          default: return 60;
        }
      };
      
      const tickSpacing = getTickSpacing(poolData.feeTier);
      const tickLower = -tickSpacing * 10; // 10 tick spacings below
      const tickUpper = tickSpacing * 10;  // 10 tick spacings above
      
      // Calculate amounts based on token order
      let amount0Desired, amount1Desired;
      if (poolData.baseToken.toLowerCase() < poolData.quoteToken.toLowerCase()) {
        amount0Desired = baseAmount;
        amount1Desired = quoteAmount;
      } else {
        amount0Desired = quoteAmount;
        amount1Desired = baseAmount;
      }
      
      // Define mint parameters
      const mintParams = {
        token0: token0,
        token1: token1,
        fee: parseInt(poolData.feeTier),
        tickLower: tickLower,
        tickUpper: tickUpper,
        amount0Desired: amount0Desired,
        amount1Desired: amount1Desired,
        amount0Min: 0,
        amount1Min: 0,
        recipient: signer.address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now
      };
      
      console.log('Creating liquidity position...', mintParams);
      
      setTxStatus({
        ...txStatus,
        loading: true,
        message: "Creating liquidity position... Please wait for confirmation."
      });
      
      const mintTx = await positionManager.mint(mintParams);
      const mintReceipt = await mintTx.wait();
      
      console.log('Position created!', mintReceipt);
      
      // Find the Position token ID from the event logs
      const positionManagerInterface = new ethers.Interface([
        'event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'
      ]);
      
      const events = mintReceipt.logs
        .map(log => {
          try {
            return positionManagerInterface.parseLog({
              topics: log.topics,
              data: log.data
            });
          } catch (e) {
            return null;
          }
        })
        .filter(event => event !== null && event.name === 'IncreaseLiquidity');
      
      if (events.length > 0) {
        const tokenId = events[0].args.tokenId;
        
        setTxStatus({
          loading: false,
          error: null,
          success: true,
          poolAddress: `${token0}-${token1}-${poolData.feeTier}`,
          positionId: tokenId.toString()
        });
      } else {
        setTxStatus({
          loading: false,
          error: null,
          success: true,
          poolAddress: `${token0}-${token1}-${poolData.feeTier}`,
          positionId: "Unknown (check your NFT positions)"
        });
      }
      
    } catch (error) {
      console.error('Error initializing liquidity pool:', error);
      setTxStatus({
        loading: false,
        error: error.message || "Failed to initialize liquidity pool",
        success: false,
        poolAddress: null,
        positionId: null
      });
    }
  };

  // Success section component remains the same
  const PoolSuccessSection = ({ poolData, tokenDetails, onAddMoreLiquidity }) => {
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
                  Your {tokenDetails.baseTokenSymbol}/{tokenDetails.quoteTokenSymbol} pool is now active
                </Text>
              </div>

              <div className="flex w-full flex-col gap-4 rounded-lg bg-gray-900 p-6">
                <div className="flex items-center justify-between">
                  <Text as="p" className="text-gray-400">Token Pair:</Text>
                  <Text as="p" className="font-medium">
                    {tokenDetails.baseTokenSymbol}/{tokenDetails.quoteTokenSymbol}
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
                    {poolData.initialPrice} {tokenDetails.quoteTokenSymbol} per {tokenDetails.baseTokenSymbol}
                  </Text>
                </div>
                
                <div className="flex items-center justify-between">
                  <Text as="p" className="text-gray-400">Position ID:</Text>
                  <Text as="p" className="font-medium">
                    #{txStatus.positionId}
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

  if (txStatus.success) {
    return (
      <PoolSuccessSection
        poolData={poolData}
        tokenDetails={tokenDetails}
        onAddMoreLiquidity={() => setTxStatus({
          loading: false,
          error: null,
          success: false,
          poolAddress: null,
          positionId: null
        })}
      />
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-1px)] bg-black-900_01">
      <div className="flex flex-col items-center w-full">
        <div className="container-xs flex flex-col items-center gap-10 w-full md:px-5">
          <div className="flex justify-center w-full px-14 md:px-5">
            <Heading
              size="heading_heading_2xl"
              as="h1"
              className="text-[56px] font-black md:text-[48px] sm:text-[42px]"
            >
              Create liquidity pool
            </Heading>
          </div>
          
          <div className="flex w-[34%] flex-col gap-5 rounded-[12px] border border-solid border-gray-900_03 bg-black-900_01 p-4 md:w-full">
            {/* Wallet connection status (read-only) */}
            {address ? (
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900">
                <Text as="p" className="text-[14px]">
                  Connected: {address.substring(0, 6)}...{address.substring(38)}
                </Text>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <Text as="p" className="text-[12px] text-green-500">
                    Connected
                  </Text>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900">
                <Text as="p" className="text-[14px]">
                  Wallet not connected
                </Text>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <Text as="p" className="text-[12px] text-red-500">
                    Disconnected
                  </Text>
                </div>
              </div>
            )}
            
            {/* Rest of your form remains the same */}
            <div className="flex flex-col gap-3">
              <LabelInputDropdown 
                baseTokenText="Base token"
                onChange={(value) => handleTokenChange("baseToken", value)}
                value={poolData.baseToken}
              />
              
              {/* ... (rest of your form inputs) */}
              
              <Button
                color="black_900"
                size="xs"
                shape="round"
                className="self-stretch rounded-lg font-semibold mt-2"
                onClick={initializeLiquidityPool}
                disabled={txStatus.loading || !address} // Disable if wallet not connected
              >
                {txStatus.loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Initializing...
                  </span>
                ) : (
                  "Initialize liquidity pool"
                )}
              </Button>
              
              {txStatus.error && (
                <div className="rounded-lg bg-red-900/20 p-3">
                  <Text as="p" className="text-red-500 text-sm">
                    Error: {txStatus.error}
                  </Text>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}