import { Button } from "@/components/ui/button";
import {
  CheckIcon
} from "@radix-ui/react-icons";
import Link from "next/link";
import MockCard from "./MockCard";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real-Time Payments",
  description:
    "Send and receive payments in real-time, without the need for a middleman.",
};

export default function Home() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center">
  <div className="bg-black-300 w-full py-16 flex items-center justify-center border-b border-purple-200">
    <div className="max-w-5xl w-full px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="flex flex-col space-y-8">
          <h1 className="text-6xl font-cal text-purple-800">Instant Money Flow</h1>

          <div className="max-w-md space-y-4">
            <div className="flex items-center space-x-4">
              <CheckIcon className="text-green-600 w-8 h-8" />
              <p className="text-4xl font-bold font-cal">
                Seamlessly transact in real-time, cutting out the middleman.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <CheckIcon className="text-green-600 w-8 h-8" />
              <p className="text-4xl font-bold font-cal">
                Earn at every tick of the clock, even as you catch some Z's.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
          <Link href="/payments">
              <Button className="bg-purple-700 text-white font-semibold hover:bg-green-600 px-6 py-2">
                <p>Embark Now</p>
              </Button>
            </Link>
          </div>
        </div>

        <div className="w-full flex items-end justify-end">
          <div className="w-[400px]">
          <MockCard />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div className="w-full py-16 items-center justify-center">
    <div className="mx-auto max-w-6xl px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-lg font-semibold text-purple-600">Revolutionizing Digital Transactions</h2>
        <p className="mt-4 text-4xl font-cal text-gray-800">
          Your earnings at your fingertips, instantly.
        </p>
        <p className="mt-6 text-lg leading-8 text-gray-700">
          With Aptos SwiftPay, enjoy the power to access your hard-earned cash in real-time. Unleash your potential by seizing control of your earnings as soon as you make them.
        </p>
      </div>

     
    </div>
  </div>
</div>
  );
}
