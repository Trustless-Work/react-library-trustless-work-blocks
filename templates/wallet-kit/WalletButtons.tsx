"use client";

import * as React from "react";
import { useWallet } from "./useWallet";
import { useWalletContext } from "./WalletProvider";
import { Button } from "__UI_BASE__/button";
import { Popover, PopoverContent, PopoverTrigger } from "__UI_BASE__/popover";
import { Check, Copy, LogOut, ChevronDown, Wallet } from "lucide-react";

/**
 * Wallet connection/disconnection button component
 * Shows different states based on wallet connection status
 */
export const WalletButton = () => {
  const { handleConnect, handleDisconnect } = useWallet();
  const { walletAddress, walletName } = useWalletContext();
  const [copied, setCopied] = React.useState(false);

  const shortAddress = React.useMemo(() => {
    if (!walletAddress) return "";
    if (walletAddress.length <= 10) return walletAddress;
    return `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  const copyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // noop
    }
  };

  if (walletAddress) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto justify-between sm:justify-center"
          >
            <span className="inline-flex items-center gap-2 truncate max-w-[220px] sm:max-w-none">
              <Wallet className="opacity-80" />
              <span className="hidden xs:inline">{walletName}</span>
              <span className="text-muted-foreground">{shortAddress}</span>
            </span>
            <ChevronDown className="ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3 sm:w-96">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none">{walletName}</p>
              <p className="mt-1 text-xs text-muted-foreground break-all">
                {walletAddress}
              </p>
            </div>
            <span className="text-xs rounded px-1.5 py-0.5 bg-secondary text-secondary-foreground shrink-0">
              Testnet
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
            <Button
              onClick={copyAddress}
              variant="ghost"
              className="w-full sm:w-auto cursor-pointer"
            >
              {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
              {copied ? "Copied" : "Copy address"}
            </Button>
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              className="w-full sm:w-auto cursor-pointer"
            >
              <LogOut className="mr-2" /> Disconnect
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Button onClick={handleConnect} size="lg" className="w-full sm:w-auto">
      <Wallet className="mr-2" /> Connect wallet
    </Button>
  );
};
