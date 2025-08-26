"use client";
import React from "react";
import { Button } from "__UI_BASE__/button";
import { Card, CardContent, CardHeader, CardTitle } from "__UI_BASE__/card";
import {
  FileCheck2,
  Eye,
  CircleAlert,
  CircleCheckBig,
  Handshake,
  CheckCheck,
  Layers,
} from "lucide-react";
import {
  GetEscrowsFromIndexerResponse as Escrow,
  Role,
} from "@trustless-work/escrow/types";
import {
  MultiReleaseMilestone,
  SingleReleaseMilestone,
} from "@trustless-work/escrow";
import { Badge } from "__UI_BASE__/badge";
import ApproveMilestoneButton from "../../single-release/approve-milestone/button/ApproveMilestone";
import ResolveDisputeDialog from "../../single-release/resolve-dispute/dialog/ResolveDispute";
import DisputeEscrowButton from "../../single-release/dispute-escrow/button/DisputeEscrow";
import ReleaseEscrowButton from "../../single-release/release-escrow/button/ReleaseEscrow";
import ChangeMilestoneStatusDialog from "../../single-release/change-milestone-status/dialog/ChangeMilestoneStatus";

interface MilestoneCardProps {
  milestone: SingleReleaseMilestone | MultiReleaseMilestone;
  milestoneIndex: number;
  selectedEscrow: Escrow;
  userRolesInEscrow: string[];
  activeRole: Role[];
  onViewDetails: (
    milestone: SingleReleaseMilestone | MultiReleaseMilestone,
    index: number
  ) => void;
}

const MilestoneCardComponent = ({
  milestone,
  milestoneIndex,
  selectedEscrow,
  userRolesInEscrow,
  activeRole,
  onViewDetails,
}: MilestoneCardProps) => {
  const getMilestoneStatusBadge = (
    milestone: SingleReleaseMilestone | MultiReleaseMilestone
  ) => {
    if ("flags" in milestone && milestone.flags?.disputed) {
      return (
        <Badge variant="destructive">
          <CircleAlert className="h-3.5 w-3.5" />
          <span>Disputed</span>
        </Badge>
      );
    }
    if ("flags" in milestone && milestone.flags?.released) {
      return (
        <Badge variant="default">
          <CircleCheckBig className="h-3.5 w-3.5" />
          <span>Released</span>
        </Badge>
      );
    }
    if (
      "flags" in milestone &&
      milestone.flags?.resolved &&
      !milestone.flags?.disputed
    ) {
      return (
        <Badge variant="default">
          <Handshake className="h-3.5 w-3.5" />
          <span>Resolved</span>
        </Badge>
      );
    }
    if (
      ("flags" in milestone && milestone.flags?.approved) ||
      ("approved" in milestone && milestone.approved)
    ) {
      return (
        <Badge variant="default">
          <CheckCheck className="h-3.5 w-3.5" />
          <span>Approved</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Layers className="h-3.5 w-3.5" />
        <span className="uppercase">
          {milestone.status
            ? milestone.status.match(/[a-z][A-Z]/)
              ? milestone.status.replace(/([A-Z])/g, " $1").toLowerCase()
              : milestone.status.toLowerCase()
            : ""}
        </span>
      </Badge>
    );
  };

  const getActionButtons = (
    milestone: SingleReleaseMilestone | MultiReleaseMilestone,
    milestoneIndex: number,
    userRolesInEscrow: string[],
    activeRole: Role[]
  ) => {
    const buttons = [];
    // removed noisy console.log that caused N logs per card render
    // Service Provider - Complete Milestone
    if (
      userRolesInEscrow.includes("serviceProvider") &&
      activeRole.includes("serviceProvider") &&
      milestone.status !== "completed" &&
      !("flags" in milestone && milestone.flags?.approved)
    ) {
      buttons.push(
        <ChangeMilestoneStatusDialog
          key={`change-status-${milestoneIndex}`}
          milestoneIndex={milestoneIndex}
        />
      );
    }

    // Release Signer - Release Payment
    if (
      userRolesInEscrow.includes("releaseSigner") &&
      activeRole.includes("releaseSigner") &&
      "flags" in milestone &&
      !milestone.flags?.disputed &&
      milestone.flags?.approved &&
      !milestone.flags?.released
    ) {
      buttons.push(<ReleaseEscrowButton key={`release-${milestoneIndex}`} />);
    }

    // Service Provider/Approver - Start Dispute
    if (
      (userRolesInEscrow.includes("serviceProvider") ||
        userRolesInEscrow.includes("approver")) &&
      (activeRole.includes("serviceProvider") ||
        activeRole.includes("approver")) &&
      "flags" in milestone &&
      !milestone.flags?.disputed &&
      !milestone.flags?.released &&
      !milestone.flags?.resolved
    ) {
      buttons.push(<DisputeEscrowButton key={`dispute-${milestoneIndex}`} />);
    }

    // Dispute Resolver - Resolve Dispute
    if (
      userRolesInEscrow.includes("disputeResolver") &&
      activeRole.includes("disputeResolver") &&
      "flags" in milestone &&
      milestone.flags?.disputed
    ) {
      buttons.push(<ResolveDisputeDialog key={`resolve-${milestoneIndex}`} />);
    }
    // Approver - Approve Milestone
    if (
      userRolesInEscrow.includes("approver") &&
      activeRole.includes("approver") &&
      (("approved" in milestone && !milestone.approved) ||
        ("flags" in milestone &&
          !milestone.flags?.approved &&
          "flags" in milestone &&
          !milestone.flags?.disputed &&
          "flags" in milestone &&
          !milestone.flags?.released &&
          "flags" in milestone &&
          !milestone.flags?.resolved))
    ) {
      buttons.push(
        <ApproveMilestoneButton
          key={`approve-${milestoneIndex}`}
          milestoneIndex={milestoneIndex}
        />
      );
    }

    return buttons;
  };

  const formatCurrency = (value: number, currency: string) => {
    return `${currency} ${value.toFixed(2)}`;
  };

  return (
    <Card
      key={`milestone-${milestoneIndex}-${milestone.description}-${milestone.status}`}
      className="hover:shadow-lg transition-all duration-200"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground truncate">
            {milestone.description}
          </CardTitle>
          {getMilestoneStatusBadge(milestone)}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Amount */}
        {"amount" in milestone && (
          <div className="flex items-center gap-2 py-2">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(milestone.amount, selectedEscrow.trustline?.name)}
            </span>
          </div>
        )}

        {/* Evidence indicator */}
        {milestone.evidence && (
          <div className="flex items-center gap-2 p-2 border-primary/20 rounded-lg">
            <FileCheck2 className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">
              Evidence provided
            </span>
          </div>
        )}

        {/* Action Buttons Section */}
        {getActionButtons(
          milestone,
          milestoneIndex,
          userRolesInEscrow,
          activeRole
        )}

        {/* View Details Button - Always present */}
        <Button
          size="sm"
          variant="outline"
          className="w-full border-border text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(milestone, milestoneIndex);
          }}
        >
          <Eye className="w-3 h-3 mr-2 flex-shrink-0" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export const MilestoneCard = React.memo(
  MilestoneCardComponent,
  (prev, next) => {
    // Prevent unnecessary re-renders when props are referentially equal
    if (
      prev.milestone === next.milestone &&
      prev.milestoneIndex === next.milestoneIndex &&
      prev.selectedEscrow?.contractId === next.selectedEscrow?.contractId &&
      prev.onViewDetails === next.onViewDetails &&
      prev.activeRole.length === next.activeRole.length &&
      prev.userRolesInEscrow.length === next.userRolesInEscrow.length &&
      prev.activeRole.every((r, i) => r === next.activeRole[i]) &&
      prev.userRolesInEscrow.every((r, i) => r === next.userRolesInEscrow[i])
    ) {
      return true;
    }
    return false;
  }
);
