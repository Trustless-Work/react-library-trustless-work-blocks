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
import ChangeMilestoneStatusDialog from "../../single-multi-release/change-milestone-status/dialog/ChangeMilestoneStatus";
import ApproveMilestoneButton from "../../single-multi-release/approve-milestone/button/ApproveMilestone";
import ResolveDisputeDialog from "__MR_RESOLVE_MODULE__";
import DisputeEscrowButton from "__MR_DISPUTE_MODULE__";
import ReleaseEscrowButton from "__MR_RELEASE_MODULE__";
import { formatCurrency } from "@/components/tw-blocks/helpers/format.helper";

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
    const buttons = [] as React.ReactNode[];
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

    if (
      userRolesInEscrow.includes("releaseSigner") &&
      activeRole.includes("releaseSigner") &&
      "flags" in milestone &&
      !milestone.flags?.disputed &&
      milestone.flags?.approved &&
      !milestone.flags?.released
    ) {
      buttons.push(
        <ReleaseEscrowButton
          key={`release-${milestoneIndex}`}
          milestoneIndex={milestoneIndex}
        />
      );
    }

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
      buttons.push(
        <DisputeEscrowButton
          key={`dispute-${milestoneIndex}`}
          milestoneIndex={milestoneIndex}
        />
      );
    }

    if (
      userRolesInEscrow.includes("disputeResolver") &&
      activeRole.includes("disputeResolver") &&
      "flags" in milestone &&
      milestone.flags?.disputed
    ) {
      buttons.push(
        <ResolveDisputeDialog
          key={`resolve-${milestoneIndex}`}
          milestoneIndex={milestoneIndex}
        />
      );
    }

    if (
      userRolesInEscrow.includes("approver") &&
      activeRole.includes("approver") &&
      (("approved" in milestone && !milestone.approved) ||
        ("flags" in milestone &&
          !milestone.flags?.approved &&
          !milestone.flags?.disputed &&
          !milestone.flags?.released &&
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
        {"amount" in milestone && (
          <div className="flex items-center gap-2 py-2">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(milestone.amount, selectedEscrow.trustline?.name)}
            </span>
          </div>
        )}

        {milestone.evidence && (
          <div className="flex items-center gap-2 p-2 border-primary/20 rounded-lg">
            <FileCheck2 className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">
              Evidence provided
            </span>
          </div>
        )}

        {getActionButtons(
          milestone,
          milestoneIndex,
          userRolesInEscrow,
          activeRole
        )}

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
