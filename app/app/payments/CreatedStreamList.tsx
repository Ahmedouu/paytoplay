import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import CountUp from "react-countup";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { sleep } from "@/lib/utils";
export type Stream = {
  sender: string;
  recipient: string;
  amountAptFloat: number;
  durationMilliseconds: number;
  startTimestampMilliseconds: number;
  streamId: number;
};
import { Types } from "aptos";
export default function CreatedStreamList(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
}) {
  // Wallet state
  const { connected, account, signAndSubmitTransaction } = useWallet();
  // Toast state
  const { toast } = useToast();
  // Streams state
  const [streams, setStreams] = useState<Stream[]>([]);
  const [areStreamsLoading, setAreStreamsLoading] = useState(true);


  useEffect(() => {
    if (connected) {
      getSenderStreams().then((streams) => {
        if (streams){setStreams(streams);
        setAreStreamsLoading(false);}  
      });
    }
  }, [account, connected, props.isTxnInProgress]);


  const cancelStream = async (recipient: string) => {
   
      if (!account) {
        console.error("Recipient is undefined");
        return;
      }

   
      props.setTxn(true);
    
  
      const payload: Types.TransactionPayload = {
        type: "entry_function_payload",
        function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::cancel_stream`,
        type_arguments: [],
        arguments: [
          account.address,
          recipient,
        ],
      };
    
      try {
        const result = await signAndSubmitTransaction(payload);
        await sleep(parseInt(process.env.TRANSACTION_DELAY_MILLISECONDS || '0'))
        
    
        toast({
          title: "Stream closed!",
          description: `Closed stream for ${`${recipient.slice(0, 6)}...${recipient.slice(-4)}`}`,
          action: (
            <a href={`https://explorer.aptoslabs.com/txn/${result.hash}?network=testnet`} target="_blank">
              <ToastAction altText="View transaction">View txn</ToastAction>
            </a>
          ),
        });
      } catch (e) {
        console.error(e);
        props.setTxn(false);
        return;
      }
    
      props.setTxn(false);
    

  };


  const getSenderStreams = async () => {
    
      if (!account) {
        return;
    }
    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_senders_streams`,
      type_arguments: [],
      arguments: [account.address],
  };        
   
          
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
          const response= await res.json();   
   
        let streams: Stream[] = [];
        for (let i = 0; i < response[0].length; i++) {
          let stream: Stream = {
              sender: account.address, 
              recipient: response[0][i],
              amountAptFloat: parseFloat(response[3][i])/1e8,
              durationMilliseconds: parseInt(response[2][i])*1000,
              startTimestampMilliseconds: parseInt(response[1][i])*1000, //needs reordering 
              streamId: parseInt(response[4][i])
          };
          
          streams.push(stream);
        }
    
      return streams;
  };

        return (
          <ScrollArea className="rounded-lg bg-neutral-400 border border-neutral-200 w-full">
            <div className="h-fit max-h-96 w-full">
              <Table className="w-full">
                <TableHeader className="bg-neutral-300">
                  <TableRow className="uppercase text-xs font-matter hover:bg-neutral-300">
                    <TableHead className="text-center">ID</TableHead>
                    <TableHead className="text-center">Recipient</TableHead>
                    <TableHead className="text-center">End date</TableHead>
                    <TableHead className="text-center">Remaining amount</TableHead>
                    <TableHead className="text-center">Cancel stream</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{
             
                areStreamsLoading && 
                         <TableRow>
                        <TableCell className="items-center">
                        <div className="flex flex-row justify-center items-center w-full">
                          <Skeleton className="h-4 w-4" />
                               </div>
                          </TableCell>
                       <TableCell className="items-center">
                        <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                     <TableCell className="items-center">
                  <div className="flex flex-row justify-center items-center w-full">
                  <Skeleton className="h-4 w-24" />
                  </div>
                </TableCell>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                    <Skeleton className="h-4 w-24" />
                      </div>
                        </TableCell>
                      <TableCell className="items-center">
                      <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-8 w-12" />
                      </div>
                    </TableCell>
                    </TableRow>
                    }
            {
              
                !areStreamsLoading && streams.length === 0 && 
                <TableRow className="hover:bg-neutral-400">
                  <TableCell colSpan={5}>
                    <p className="break-normal text-center font-matter py-4 text-neutral-100">
                      You don&apos;t have any outgoing payments.
                    </p>
                  </TableCell>
                </TableRow>
              
            }
            {
              
                !areStreamsLoading && streams.length > 0 && (
                  /* Map through each stream and render a TableRow for each */
                  streams.map((stream, index) => {
                    /* Calculate end date */
                    const startTimestamp = stream.startTimestampMilliseconds;
                    const duration = stream.durationMilliseconds;
                    const endTimestamp = startTimestamp + duration;
                    const endDate = new Date(endTimestamp);
                
                    let amountRemaining = 0;
                    const currentTimestamp = new Date().getTime();

                    if (startTimestamp === 0) {
                      // The stream has not started, display the full amount
                      amountRemaining = stream.amountAptFloat;
                    } else if (currentTimestamp > endTimestamp) {
                      // The stream has completed, display 0
                      amountRemaining = 0;
                    } else {
                      // The stream is ongoing, calculate the remaining amount
                      const streamProgress = (currentTimestamp - startTimestamp) / duration;
                      amountRemaining = Math.max(stream.amountAptFloat - stream.amountAptFloat * streamProgress, 0);
                    }
                
                    return (
                      <TableRow key={index} className="font-matter hover:bg-neutral-400">
                        <TableCell className="text-center">
                         
                          {stream.streamId}
                        </TableCell>
                        <TableCell className="text-center">
                         
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>{stream.recipient.substring(0, 6)}...{stream.recipient.substring(stream.recipient.length - 4)}</TooltipTrigger>
                              <TooltipContent>
                                <p>{stream.recipient}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-center">
                          
                          {startTimestamp===0 ? (
                            <p><i>Stream has not started</i></p>
                            
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {endDate.toLocaleDateString()}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{endDate.toLocaleString()}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-center">
                          {startTimestamp === 0 ? (
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <p>{stream.amountAptFloat.toFixed(2) /* maybe did not have to do this .. */} APT </p>  
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{stream.amountAptFloat.toFixed(2)} APT</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : currentTimestamp > endTimestamp ? (
                            <p>0.00 APT</p>
                          ) : (
                            <CountUp
                              start={amountRemaining}
                              end={0}
                              duration={stream.durationMilliseconds / 1000}
                              decimals={8}
                              decimal="."
                              suffix=" APT"
                              useEasing={false}
                            />
                          )}
                          
                        </TableCell>
                        <TableCell className="text-center">
                          {/* Button to cancel stream */}
                          <Button
                            size="sm"
                            className="bg-red-800 hover:bg-red-700 text-white"
                            onClick={() => cancelStream(stream.recipient)}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )
             
            }
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
