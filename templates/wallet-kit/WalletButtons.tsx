import * as React from "react";
import { useWallet } from "./useWallet";
import { useWalletContext } from "./WalletProvider";
import { Button } from "@/components/ui/button";

/**
 * Wallet connection/disconnection button component
 * Shows different states based on wallet connection status
 */
export const WalletButton = () => {
  const { handleConnect, handleDisconnect } = useWallet();
  const { walletAddress, walletName } = useWalletContext();

  // If wallet is connected, show disconnect option
  if (walletAddress) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <p className="font-medium">Connected: {walletName}</p>
          <p className="text-gray-500">{walletAddress}</p>
        </div>
        <Button
          onClick={handleDisconnect}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 cursor-pointer"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  // If wallet is not connected, show connect option
  return (
    <Button
      onClick={handleConnect}
      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 cursor-pointer"
    >
      Connect Wallet
    </Button>
  );
};
