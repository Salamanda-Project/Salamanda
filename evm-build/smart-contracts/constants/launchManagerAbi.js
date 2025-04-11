export const launchManagerAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tokenFactory",
        "type": "address"
      },
      {
        "internalType": "address payable",
        "name": "_liquidityManager",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_feeCollector",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_launchFee",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "liquidityTokenId",
        "type": "uint256"
      }
    ],
    "name": "LaunchCompleted",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "hash",
        "type": "bytes32"
      }
    ],
    "name": "commitLaunch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeCollector",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "decimals",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "totalSupply",
            "type": "uint256"
          },
          {
            "internalType": "address[4]",
            "name": "initialHolders",
            "type": "address[4]"
          },
          {
            "internalType": "uint256[4]",
            "name": "initialAmounts",
            "type": "uint256[4]"
          },
          {
            "internalType": "bool",
            "name": "enableAntiBot",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "maxTxAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxWalletAmount",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "pairWith",
            "type": "address"
          },
          {
            "internalType": "uint24",
            "name": "fee",
            "type": "uint24"
          },
          {
            "internalType": "int24",
            "name": "tickLower",
            "type": "int24"
          },
          {
            "internalType": "int24",
            "name": "tickUpper",
            "type": "int24"
          },
          {
            "internalType": "uint256",
            "name": "liquidityAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pairAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lockDuration",
            "type": "uint256"
          }
        ],
        "internalType": "struct LaunchManager.LaunchParams",
        "name": "params",
        "type": "tuple"
      },
      {
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      }
    ],
    "name": "instantLaunch",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "launchCommits",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "launchFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "liquidityManagerAddress",
    "outputs": [
      {
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenFactory",
    "outputs": [
      {
        "internalType": "contract TokenFactory",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]