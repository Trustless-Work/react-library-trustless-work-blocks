import {
  DollarSign,
  CheckCircle,
  CheckSquare,
  AlertTriangle,
  Edit,
  Scale,
  Unlock,
  Wallet,
  Settings,
  Briefcase,
} from "lucide-react";
import {
  GetEscrowsFromIndexerResponse as Escrow,
  Role,
} from "@trustless-work/escrow/types";
import DisputeEscrowButton from "../../single-release/dispute-escrow/button/DisputeEscrow";
import ResolveDisputeDialog from "../../single-release/resolve-dispute/dialog/ResolveDispute";
import ReleaseEscrowButton from "../../single-release/release-escrow/button/ReleaseEscrow";
import FundEscrowDialog from "../../single-release/fund-escrow/dialog/FundEscrow";
import UpdateEscrowDialog from "../../single-release/update-escrow/dialog/UpdateEscrow";

interface ActionsProps {
  selectedEscrow: Escrow;
  userRolesInEscrow: string[];
  areAllMilestonesApproved: boolean;
  activeRole: Role[];
}

export const roleActions: {
  role: Role;
  actions: string[];
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    role: "signer",
    actions: ["fundEscrow"],
    icon: <Wallet className="h-6 w-6 text-primary" />,
    color: "",
  },
  {
    role: "approver",
    actions: ["fundEscrow", "approveMilestone", "startDispute"],
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    color: "0",
  },
  {
    role: "serviceProvider",
    actions: ["fundEscrow", "completeMilestone", "startDispute"],
    icon: <Briefcase className="h-6 w-6 text-primary" />,
    color: "0",
  },
  {
    role: "disputeResolver",
    actions: ["fundEscrow", "resolveDispute"],
    icon: <Scale className="h-6 w-6 text-primary" />,
    color: "00",
  },
  {
    role: "releaseSigner",
    actions: ["fundEscrow", "releasePayment"],
    icon: <Unlock className="h-6 w-6 text-primary" />,
    color: "",
  },
  {
    role: "platformAddress",
    actions: ["fundEscrow", "editEscrow"],
    icon: <Settings className="h-6 w-6 text-primary" />,
    color: "0",
  },
  {
    role: "receiver",
    actions: ["fundEscrow"],
    icon: <DollarSign className="h-6 w-6 text-primary" />,
    color: "",
  },
];

export const actionIcons: Record<string, React.ReactNode> = {
  fundEscrow: <DollarSign className="h-6 w-6 text-primary/60" />,
  approveMilestone: <CheckCircle className="h-6 w-6 text-primary/60" />,
  completeMilestone: <CheckSquare className="h-6 w-6 text-primary/60" />,
  startDispute: <AlertTriangle className="h-6 w-6 text-primary/60" />,
  resolveDispute: <Scale className="h-6 w-6 text-primary/60" />,
  releasePayment: <Unlock className="h-6 w-6 text-primary/60" />,
  editEscrow: <Edit className="h-6 w-6 text-primary/60" />,
};

export const Actions = ({
  selectedEscrow,
  userRolesInEscrow,
  areAllMilestonesApproved,
  activeRole,
}: ActionsProps) => {
  const shouldShowEditButton =
    userRolesInEscrow.includes("platformAddress") &&
    !selectedEscrow?.flags?.disputed &&
    !selectedEscrow?.flags?.resolved &&
    !selectedEscrow?.flags?.released &&
    activeRole.includes("platformAddress");

  const shouldShowDisputeButton =
    selectedEscrow.type === "single-release" &&
    (userRolesInEscrow.includes("approver") ||
      userRolesInEscrow.includes("serviceProvider")) &&
    (activeRole.includes("approver") ||
      activeRole.includes("serviceProvider")) &&
    !selectedEscrow?.flags?.disputed &&
    !selectedEscrow?.flags?.resolved;

  const shouldShowResolveButton =
    selectedEscrow.type === "single-release" &&
    userRolesInEscrow.includes("disputeResolver") &&
    activeRole.includes("disputeResolver") &&
    !selectedEscrow?.flags?.resolved &&
    selectedEscrow?.flags?.disputed;

  const shouldShowReleaseFundsButton =
    selectedEscrow.type === "single-release" &&
    areAllMilestonesApproved &&
    userRolesInEscrow.includes("releaseSigner") &&
    !selectedEscrow.flags?.released &&
    activeRole.includes("releaseSigner");

  const hasConditionalButtons =
    shouldShowEditButton ||
    shouldShowDisputeButton ||
    shouldShowResolveButton ||
    shouldShowReleaseFundsButton;

  return (
    <div className="flex items-start justify-start flex-col gap-2 w-full">
      {hasConditionalButtons && (
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {shouldShowEditButton && <UpdateEscrowDialog />}

          {shouldShowDisputeButton && <DisputeEscrowButton />}

          {shouldShowResolveButton && <ResolveDisputeDialog />}

          {shouldShowReleaseFundsButton && <ReleaseEscrowButton />}
        </div>
      )}

      <FundEscrowDialog />
    </div>
  );
};
