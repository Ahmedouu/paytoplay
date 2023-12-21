import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Stream } from "@/app/payments/CreatedStreamList";

/* 
  Finds the best unit to display the stream rate in by changing the bottom of the unit from seconds
  to minutes, hours, days, etc.
*/
function displayStreamRate(streamRatePerSecond: number) {
  if (streamRatePerSecond == 0) {
    return "0 APT / s";
  }

  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / s`;
  }

  streamRatePerSecond *= 60; // to minutes
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / min`;
  }

  streamRatePerSecond *= 60; // to hours
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / hr`;
  }

  streamRatePerSecond *= 24; // to days
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / day`;
  }

  streamRatePerSecond *= 7; // to weeks
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / week`;
  }

  streamRatePerSecond *= 4; // to months
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / month`;
  }

  streamRatePerSecond *= 12; // to years

  return `${streamRatePerSecond.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  })} APT / year`;
}

export default function StreamRateIndicator() {
  // wallet adapter state
  const { isLoading, account, connected } = useWallet();
  // stream rate state
  const [streamRate, setStreamRate] = useState(0);

  
  useEffect(() => {
    calculateStreamRate().then((streamRate) => {
      setStreamRate(streamRate);
    });
  });

  

    const calculateStreamRate = async () => {
      try {
        const [receiverStreams, senderStreams] = await Promise.all([
          getReceiverStreams(),
          getSenderStreams(),
        ]);
      
        const calculateAptPerSec = (streams: any, sign: any) =>
          streams.reduce(
            (acc: any, stream: any) =>
              acc + (sign * stream.amountAptFloat/1e8) / (stream.durationMilliseconds / 1000),
            0
          );
          
    
        const receiverAptPerSec = receiverStreams 
          ? calculateAptPerSec(receiverStreams.active, 1)
          : 0;
    
        const senderAptPerSec = senderStreams
          ? calculateAptPerSec(senderStreams.active, 1)
          : 0;
    
        const streamRate = receiverAptPerSec - senderAptPerSec;
    
        return streamRate;
      } catch (error) {
        console.error("Error calculating stream rate:", error);
        throw error;
      }
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
            const response= await res.json();   
     
        const streams = response[0].map((recipient: any, i: any) => {
        const startTimestampMilliseconds = parseInt(response[1][i]) * 1000;
        const durationMilliseconds = parseInt(response[2][i]) * 1000;
        
        return {
          sender: account.address,
          recipient,
          amountAptFloat: parseFloat(response[3][i]),
          durationMilliseconds,
          startTimestampMilliseconds,
          streamId: parseInt(response[4][i]),
        };
      });
  
      const currentTime = Date.now();
  
      const categorizedStreams  = streams.reduce(
        (acc: any, stream: any) => {
          if (stream.startTimestampMilliseconds === 0) {
            acc.pending.push(stream);
          } else if (stream.startTimestampMilliseconds + stream.durationMilliseconds < currentTime) {
            acc.completed.push(stream);
          } else {
            acc.active.push(stream);
          }
          return acc;
        },
        { pending: [], completed: [], active: [] }
      );
    
      return categorizedStreams;
    } 
    catch (error) {
      console.error('Error fetching sender streams:', error);
      throw error;
    }
    };
  const getReceiverStreams = async () => {
    
      if (!account) {
        return;
    }

     
          const body = {
           function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_receivers_streams`,
          type_arguments: [],
          arguments: [account.address],
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
              const response= await res.json();   
        
          const streams : Stream[] = response[0].map((sender: any, i: any) => {
          const startTimestampMilliseconds = parseInt(response[1][i]) * 1000;
          const durationMilliseconds = parseInt(response[2][i]) * 1000;
          
          return {
            sender,
            recipient: account.address,
            amountAptFloat: parseFloat(response[3][i]),
            durationMilliseconds,
            startTimestampMilliseconds,
            streamId: parseInt(response[4][i]),
          };
        });
    
        const currentTime = Date.now();
    
        const categorizedStreams = streams.reduce(
          (acc: any, stream: any) => {
            if (stream.startTimestampMilliseconds === 0) {
              acc.pending.push(stream);
            } else if (stream.startTimestampMilliseconds + stream.durationMilliseconds < currentTime) {
              acc.completed.push(stream);
            } else {
              acc.active.push(stream);
            }
            return acc;
          },
          { pending: [], completed: [], active: [] }
        );
       
        return categorizedStreams;
      } 
      catch (error) {
        console.error('Error fetching sender streams:', error);
        throw error;
      }
            
  };

  if (!connected) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-neutral-500 hover:bg-neutral-500 px-3">
          <div className="flex flex-row gap-3 items-center">
            <InfoCircledIcon className="h-4 w-4 text-neutral-100" />

            <span
              className={
                "font-matter " +
                (streamRate > 0
                  ? "text-purple-400"
                  : streamRate < 0
                  ? "text-red-400"
                  : "")
              }
            >
              {isLoading || !connected ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                displayStreamRate(streamRate)
              )}
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your current stream rate</DialogTitle>
          <DialogDescription>
            This is the current rate at which you are streaming and being
            streamed APT. This rate is calculated by adding up all of the
            streams you are receiving and subtracting all of the streams you are
            sending.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
