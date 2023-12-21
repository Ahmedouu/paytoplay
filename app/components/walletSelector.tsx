"use client";
import { WalletReadyState, useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { FaucetClient, Network } from "aptos";
import { ChevronDownIcon } from "@radix-ui/react-icons";

/* 
  Component that displays a button to connect a wallet. If the wallet is connected, it displays the 
  wallet's APT balance, address and a button to disconnect the wallet. 

  When the connect button is clicked, a dialog is displayed with a list of all supported wallets. If 
  a supported wallet is installed, the user can click the connect button to connect the wallet. If
  the wallet is not installed, the user can click the install button to install the wallet.
*/
export default function WalletSelector(props: { isTxnInProgress?: boolean }) {
  // wallet state variables
  const { connect, account, connected, disconnect, wallets, isLoading } = useWallet();
  //added an extra type to ensure to type safety on WalletName, not sure if it's useful here cause it works without the extra type.
  type WalletName = string & { __brand__: "WalletName" };
  function toWalletName(name: string): WalletName {
    return name as WalletName;
  }
  const handleConnect = (walletName: string) => {
    connect(toWalletName(walletName));
  }
  // why are we doing this we can just use connect and disconnect directly, maybe for testing purposes ? 
  const handleDisconnect = () => {
    disconnect();
  };
  // State to hold the current account's APT balance. In string - floating point format.
  const [balance, setBalance] = useState<string | undefined>(undefined);
  // State to hold whether the faucet is loading or not.
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [accountData, setAccountData] = useState(null);
  /* 
    Gets the balance of the connected account whenever the connected, account, isFaucetLoading,
    and isTxnInProgress variables change.

    Also checks if the account exists. If the account does not exist, it initializes the account
    by funding it with 1 APT. 
  */
  useEffect(() => {
    if (connected && account) {
      ensureAccountExists().then(() => {
        getBalance(account.address);
      });
    }
  }, [connected, account, props.isTxnInProgress, isFaucetLoading]);

  /* 
    Checks if the account exists. If the account does not exist, it initializes the account
    by funding it with 1 APT. 
  */
  const ensureAccountExists = async () => {
    
            if (!account){
              return;
            }
            try {
              const response = await fetch (
                `https://fullnode.testnet.aptoslabs.com/v1/accounts/${account.address}`,
                { method: 'GET' }
              );
          
              const data = await response.json();
              if (data.error_code === 'account_not_found') {
                initializeAccount();
              } else {
                setAccountData(data);
              }
            } catch (error) {
              console.error('Error fetching account data:', error);
            }
          

  }

  /* 
    Initializes the account by funding it with 1 APT.
  */
  const initializeAccount = async () => {
   
      if (!connected || !account || props.isTxnInProgress || isFaucetLoading) {
        return;
    }

    
      setIsFaucetLoading(true);
    
      const faucetClient = new FaucetClient(Network.TESTNET, "https://faucet.testnet.aptoslabs.com");

      try {
          await faucetClient.fundAccount(account.address, 100000000, 1);
      } catch (e) {
          console.log(e);
      }
   
      setIsFaucetLoading(false);

  }

  /*
    Gets the balance of the given address. In case of an error, the balance is set to 0. The balance
    is returned in floating point format.
    @param address - The address to get the APT balance of.
  */
  const getBalance = async (address: string) => {
   
          const body = {
            function: "0x1::coin::balance",
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            arguments: [address],
          };
        
          try {
            const res = await fetch(
              `https://fullnode.testnet.aptoslabs.com/v1/view`,
              {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
              }
            );
            // network errors are important too, 
            if (!res.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await res.json();
            const balance = (data / 100000000).toLocaleString();
            setBalance(balance);
          } catch (error) {
            console.error('Error while getting the balance:', error);
            
            setBalance("0");
          }
          
          
        
  };

  return (
    <div>
      {!connected && !isLoading && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-purple-800 hover:bg-green-700 text-white font-matter font-medium px-3 space-x-2">
              <p>Connect Wallet </p>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect your wallet </DialogTitle>
              {
              wallets.map(wallet => {
                if (wallet.readyState === WalletReadyState.Installed) {
                  return (
                    <div
                      key={wallet.name}
                      className="flex w-full items-center justify-between rounded-xl p-2"
                    >
                      <h1>{wallet.name}</h1>
                      <Button variant="secondary" onClick={() => handleConnect(wallet.name)}>
                        Connect
                      </Button>
                    </div>
                  );
                } else if (wallet.readyState === WalletReadyState.NotDetected) {
                  return (
                    <div
                      key={wallet.name} 
                      className="flex w-full items-center justify-between rounded-xl p-2"
                    >
                      <h1>{wallet.name}</h1>
                      <a href={wallet.url} target="_blank">
                        <Button variant="secondary">
                          Install
                        </Button>
                      </a>
                    </div>
                  );
                }
              })
                
              }
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
      {

    isLoading && (
          <Button variant="secondary" disabled>
            Loading Wallet....
            </Button>
        )
       
      }
      {
        connected && account && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button className="font-mono text-white bg-purple-500 hover:bg-purple-700 text-lg">
                  {balance} {''}APT <span style={{ marginRight: '10px' }}></span> | <span style={{ marginRight: '10px' }}></span> {account.address.slice(0, 5)}...{account.address.slice(-4)} <span style={{ marginRight: '10px' }}></span>  <ChevronDownIcon/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDisconnect()}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      
    
      }
    </div>
  );
}
