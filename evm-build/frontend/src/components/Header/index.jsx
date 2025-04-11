import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button, SelectBox, Img, Text } from "./..";

const dropDownOptions = [
  { label: "Option1", value: "option1" },
  { label: "Option2", value: "option2" },
  { label: "Option3", value: "option3" },
];

export default function Header({ ...props }) {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnection = async () => {
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);
      
      if (isConnected) {
        await disconnect();
      } else {
        if (connectors && connectors.length > 0) {
          await connectAsync({ connector: connectors[0] });
        }
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <header
      {...props}
      className={`${props.className} flex justify-center items-center py-5 bg-black-900_01`}
    >
      <div className="container-xs flex items-center justify-between gap-5 md:flex-col md:px-5">
        <Img
          src="images/img_header_logo.png"
          alt="Headerlogo"
          className="h-[24px] w-[84px] object-contain"
        />
        <div className="flex w-[84%] items-center justify-between gap-5 md:w-full sm:flex-col">
          <ul className="flex flex-wrap gap-6">
            <li>
              <a href="/">
                <Text as="p" className="text-[14px] font-normal !text-white-a700">
                  Token launchpad
                </Text>
              </a>
            </li>
            <li>
              <a href="create-liquidity">
                <Text as="p" className="text-[14px] font-normal !text-white-a700">
                  Create liquidity
                </Text>
              </a>
            </li>
          </ul>
          <div className="flex w-[22%] justify-center gap-2.5 sm:w-full">
            <SelectBox
              shape="round"
              indicator={
                <Img
                  src="images/img_arrowdown.svg"
                  alt="Arrow Down"
                  className="h-[24px] w-[24px]"
                />
              }
              formatOptionLabel={(e) => (
                <>
                  <div className="flex items-center">
                    <Img
                      src="images/img_close.svg"
                      alt="Close"
                      className="h-[24px] w-[24px]"
                    />
                    <span>{e.label}</span>
                  </div>
                </>
              )}
              name="button_one"
              placeholder={`BNB`}
              options={dropDownOptions}
              className="w-full gap-1 rounded-lg !border-[0.5px] px-2.5 font-semibold"
            />
            <Button
              onClick={handleConnection}
              color="black_900"
              size="xs"
              shape="round"
              className="min-w-[120px] rounded-lg px-2.5 font-semibold"
              disabled={isConnecting}
            >
              {isConnecting 
                ? 'Connecting...' 
                : isConnected
                  ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                  : 'Connect wallet'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}