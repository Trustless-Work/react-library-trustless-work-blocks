import { useQuery } from "@tanstack/react-query";
import {
  GetEscrowsFromIndexerByRoleParams,
  useGetEscrowsFromIndexerByRole,
} from "@trustless-work/escrow";
import { GetEscrowsFromIndexerResponse as Escrow } from "@trustless-work/escrow/types";

type UseEscrowsByRoleQueryParams = Omit<
  GetEscrowsFromIndexerByRoleParams,
  "role"
> & {
  role?: GetEscrowsFromIndexerByRoleParams["role"];
  enabled?: boolean;
  validateOnChain?: boolean;
};

export const useEscrowsByRoleQuery = ({
  role,
  roleAddress,
  isActive = true,
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
}: UseEscrowsByRoleQueryParams) => {
  const { getEscrowsByRole } = useGetEscrowsFromIndexerByRole();

  return useQuery({
    queryKey: [
      "escrows",
      roleAddress,
      role,
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
      if (!role) {
        throw new Error("Role is required to fetch escrows by role");
      }
      const escrows = await getEscrowsByRole({
        role,
        roleAddress,
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
    enabled: enabled && !!roleAddress && !!role,
    staleTime: 1000 * 60 * 5,
  });
};
