import { GetEscrowsFromIndexerResponse } from "@trustless-work/escrow/types";

type Escrow = {
  [K in keyof Omit<
    GetEscrowsFromIndexerResponse,
    "type" | "updatedAt" | "user"
  >]: K extends "trustline"
    ? Omit<NonNullable<GetEscrowsFromIndexerResponse["trustline"]>, "name">
    : GetEscrowsFromIndexerResponse[K];
};

interface FooterDetailsProps {
  selectedEscrow: Escrow;
}

export const FooterDetails = ({ selectedEscrow }: FooterDetailsProps) => {
  function formatTimestamp(ts?: { _seconds: number; _nanoseconds: number }) {
    if (!ts) return "-";
    const d = new Date(ts._seconds * 1000);
    return d.toLocaleString();
  }

  return (
    <div className="flex gap-4">
      <p className="italic text-sm sm:mb-0 mb-3">
        <span className="font-bold mr-1">Created:</span>
        {formatTimestamp(selectedEscrow.createdAt)}
      </p>
    </div>
  );
};
