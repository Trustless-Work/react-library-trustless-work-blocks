import { useQuery } from "@tanstack/react-query";
import {
  GetEscrowsFromIndexerBySignerParams,
  useGetEscrowsFromIndexerBySigner,
} from "@trustless-work/escrow";
import { GetEscrowsFromIndexerResponse as Escrow } from "@trustless-work/escrow/types";

interface UseEscrowsBySignerQueryParams
  extends GetEscrowsFromIndexerBySignerParams {
  enabled?: boolean;
  validateOnChain?: boolean;
}

export const useEscrowsBySignerQuery = ({
  signer,
  isActive,
  page,
  orderDirection,
  orderBy,
  startDate,
  endDate,
  maxAmount,
  minAmount,
  title,
  engagementId,
  status,
  type,
  enabled = true,
  validateOnChain = true,
}: UseEscrowsBySignerQueryParams) => {
  const { getEscrowsBySigner } = useGetEscrowsFromIndexerBySigner();

  return useQuery({
    queryKey: [
      "escrows",
      signer,
      isActive,
      page,
      orderDirection,
      orderBy,
      startDate,
      endDate,
      maxAmount,
      minAmount,
      title,
      engagementId,
      status,
      type,
      validateOnChain,
    ],
    queryFn: async (): Promise<Escrow[]> => {
      const escrows = await getEscrowsBySigner({
        signer,
        isActive,
        page,
        orderDirection,
        orderBy,
        startDate,
        endDate,
        maxAmount,
        minAmount,
        title,
        engagementId,
        status,
        type,
        validateOnChain,
      });

      if (!escrows) {
        throw new Error("Failed to fetch escrows");
      }

      return escrows;
    },
    enabled: enabled && !!signer,
    staleTime: 1000 * 60 * 5, // 5 min
  });
};
