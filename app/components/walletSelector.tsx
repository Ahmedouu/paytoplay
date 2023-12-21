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
    /* 
      TODO #5: Make a request to the api endpoint to retrieve the account data. If the request returns 
            an object that contains `error_code` of `account_not_found`, call the initializeAccount
            function to initialize the account.
    */
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
    /* 
      TODO #6: Return if the wallet is not connected, the account is not defined, a transaction is 
      in progress, or the faucet is loading.
    */
      if (!connected || !account || props.isTxnInProgress || isFaucetLoading) {
        return;
    }

    /* 
      TODO #7: Set the isFaucetLoading state variable to prevent this function from being called again.
    */
      setIsFaucetLoading(true);
    /* 
      TODO #8: Create a new faucet client with the testnet network and faucet url. Then, call the
      fundAccount function to fund the account with 1 APT. Catch any errors that occur. 
    */
      const faucetClient = new FaucetClient(Network.TESTNET, "https://faucet.testnet.aptoslabs.com");

      try {
          await faucetClient.fundAccount(account.address, 100000000, 1);
      } catch (e) {
          console.log(e);
      }
    /* 
      TODO #9: Set the isFaucetLoading state variable to false. 
    */
      setIsFaucetLoading(false);

  }

  /*
    Gets the balance of the given address. In case of an error, the balance is set to 0. The balance
    is returned in floating point format.
    @param address - The address to get the APT balance of.
  */
  const getBalance = async (address: string) => {
    /* 

      TODO #3: Make a call to the 0x1::coin::balance function to get the balance of the given address. 
      
      HINT: 
        - The APT balance is return with a certain number of decimal places. Remember to convert the 
          balance to floating point format as a string.
        - Remember to make the API request in a try/catch block. If there is an error, set the 
          balance to "0".
    */
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
                /* 
                  TODO #1: Return a list of all supported wallets. If the wallet is installed, display
                  a button to connect the wallet. If the wallet is not installed, display a button 
                  to install the wallet. 

                  HINT: 
                    - Use the two components below to display the wallet name and the connect or 
                      install button. Remember to fill in the `onClick` event handler for the connect 
                      button and the `href` for the install button. 
                    - Use the `wallets` array to get the list of supported wallets.
                    - Fill in the `Wallet Name` placeholder with the name of the wallet.

                  -- Connect Wallet Component --
                  <div
                    key={wallet.name}
                    className="flex w-full items-center justify-between rounded-xl p-2"
                  >
                    <h1>PLACEHOLDER: Wallet Name</h1>
                    <Button variant="secondary" onClick={() => console.log("PLACEHOLDER: Connect wallet")}>
                      Connect
                    </Button>
                  </div>

                  -- Install Wallet Component --
                  <div
                    key={wallet.name}
                    className="flex w-full items-center justify-between rounded-xl p-2"
                  >
                    <h1>PLACEHOLDER: Wallet Name</h1>
                    <a href="PLACEHOLDER.com" target="_blank">
                      <Button variant="secondary">
                        Install
                      </Button>
                    </a>
                  </div>
                */
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
        /* 
          TODO #4: Display a loading button if the wallet is currently loading

          HINT: 
            - Use the `isLoading` variable to check if the wallet is loading.
            - Use the Button component below to display.

          -- Loading Button Component --
          <Button variant="secondary" disabled>
            Loading...
          </Button>
        */
      }
      {
        connected && account && (
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="font-mono bg-neutral-300 text-white hover:bg-neutral-200">
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
      
       /* 
          TODO #2: Display the wallet's APT balance and address if the wallet is connected and the 
                account is defined. Use the component below to display the wallet's APT balance and 
                address, as well as provide the disconnect button. 

          HINT: 
            - Use the `connected` and `account` variables to check if the wallet is connected and the
              account is defined.
            - Use the `balance` state variable to display the wallet's APT balance.
            - Remember to fill in the `onClick` event handler for the disconnect button.
          
          -- Wallet Balance Component --
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="font-mono">
                  PLACEHOLDER APT | {account.address.slice(0, 5)}...{account.address.slice(-4)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {console.log("PLACEHOLDER: Disconnect wallet")}}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        */
      }
    </div>
  );
}
