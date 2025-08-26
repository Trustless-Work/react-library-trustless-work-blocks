"use client";

import { GetEscrowsFromIndexerResponse as Escrow } from "@trustless-work/escrow/types";
import EntityCard from "./EntityCard";

interface EntitiesProps {
  selectedEscrow: Escrow;
}

export const Entities = ({ selectedEscrow }: EntitiesProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Entities</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <EntityCard
          type="approver"
          entity={selectedEscrow.roles?.approver}
          inDispute={selectedEscrow.flags?.disputed}
        />
        <EntityCard
          type="serviceProvider"
          entity={selectedEscrow.roles?.serviceProvider}
          inDispute={selectedEscrow.flags?.disputed}
        />
        <EntityCard
          type="disputeResolver"
          entity={selectedEscrow.roles?.disputeResolver}
        />
        <EntityCard
          type="platformAddress"
          entity={selectedEscrow.roles?.platformAddress}
          hasPercentage
          percentage={selectedEscrow.platformFee}
        />
        <EntityCard
          type="releaseSigner"
          entity={selectedEscrow.roles?.releaseSigner}
        />
        <EntityCard type="receiver" entity={selectedEscrow.roles?.receiver} />
      </div>
    </>
  );
};
