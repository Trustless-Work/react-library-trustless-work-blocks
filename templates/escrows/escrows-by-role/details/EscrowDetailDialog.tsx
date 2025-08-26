"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "__UI_BASE__/dialog";
import useEscrowDetailDialog from "./useDetailsEscrow";
import Link from "next/link";
import { Card } from "__UI_BASE__/card";
import { Info, Users, ListChecks } from "lucide-react";
import { useEscrowDialogs } from "../../escrow-context/EscrowDialogsProvider";
import type {
  GetEscrowsFromIndexerResponse as Escrow,
  Role,
} from "@trustless-work/escrow/types";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "__UI_BASE__/tabs";
import { Milestones } from "./Milestones";
import { Entities } from "./Entities";
import { GeneralInformation } from "./GeneralInformation";
import { useEscrowContext } from "../../escrow-context/EscrowProvider";
import SuccessReleaseDialog from "./SuccessReleaseDialog";

interface EscrowDetailDialogProps {
  isDialogOpen: boolean;
  activeRole: Role[];
  setIsDialogOpen: (value: boolean) => void;
  setSelectedEscrow: (selectedEscrow?: Escrow) => void;
}

const EscrowDetailDialog = ({
  isDialogOpen,
  setIsDialogOpen,
  setSelectedEscrow,
  activeRole,
}: EscrowDetailDialogProps) => {
  const { selectedEscrow } = useEscrowContext();
  const dialogStates = useEscrowDialogs();
  const [activeTab, setActiveTab] = useState("general");

  const {
    handleClose,
    setEvidenceVisibleMap,
    evidenceVisibleMap,
    areAllMilestonesApproved,
    userRolesInEscrow,
  } = useEscrowDetailDialog({
    setIsDialogOpen,
    setSelectedEscrow,
    selectedEscrow,
  });

  // Get the appropriate Stellar Explorer URL based on network. You should change this to the correct network.
  const stellarExplorerUrl = `https://stellar.expert/explorer/testnet/contract/${selectedEscrow?.contractId}`;

  if (!isDialogOpen || !selectedEscrow) return null;
  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="w-11/12 sm:w-3/4 h-[95vh] overflow-hidden flex flex-col !max-w-none">
          <DialogHeader className="flex-shrink-0">
            <div className="w-full">
              <div className="flex flex-col gap-2">
                <div className="w-full">
                  <Link
                    href={stellarExplorerUrl}
                    target="_blank"
                    className="hover:underline"
                  >
                    <DialogTitle className="text-xl">
                      {selectedEscrow.title}
                    </DialogTitle>
                  </Link>
                </div>

                <DialogDescription>
                  {selectedEscrow.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Main Content with Tabs */}
          <Tabs
            defaultValue="general"
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
              <TabsTrigger
                value="general"
                className="flex items-center gap-2 data-[state=active]:bg-background"
              >
                <Info className="h-4 w-4 hidden md:block" />
                <span>Information</span>
              </TabsTrigger>
              <TabsTrigger
                value="entities"
                className="flex items-center gap-2 data-[state=active]:bg-background"
              >
                <Users className="h-4 w-4 hidden md:block" />
                <span>Entities</span>
              </TabsTrigger>
              <TabsTrigger
                value="milestones"
                className="flex items-center gap-2 data-[state=active]:bg-background"
              >
                <ListChecks className="h-4 w-4 hidden md:block" />
                <span>Milestones</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              {/* General Information Tab */}
              <TabsContent value="general" className="mt-4 h-full">
                <GeneralInformation
                  activeRole={activeRole}
                  selectedEscrow={selectedEscrow}
                  userRolesInEscrow={userRolesInEscrow}
                  dialogStates={dialogStates}
                  areAllMilestonesApproved={areAllMilestonesApproved}
                />
              </TabsContent>

              {/* Entities Tab */}
              <TabsContent value="entities" className="mt-4 h-full">
                <Entities selectedEscrow={selectedEscrow} />
              </TabsContent>

              {/* Milestones Tab */}
              <TabsContent value="milestones" className="mt-4 h-full">
                <Card className="p-4 h-full">
                  <Milestones
                    activeRole={activeRole}
                    selectedEscrow={selectedEscrow}
                    userRolesInEscrow={userRolesInEscrow}
                    setEvidenceVisibleMap={setEvidenceVisibleMap}
                    evidenceVisibleMap={evidenceVisibleMap}
                  />
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* External Dialogs */}
      <SuccessReleaseDialog
        isOpen={dialogStates.successRelease.isOpen}
        onOpenChange={dialogStates.successRelease.setIsOpen}
      />
    </>
  );
};

export default EscrowDetailDialog;
