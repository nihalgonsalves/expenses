import { CheckIcon, Cross2Icon, PersonIcon } from "@radix-ui/react-icons";
import { useState } from "react";

import { trpc } from "../../api/trpc";
import { useNavigatorOnLine } from "../../state/useNavigatorOnLine";
import { prevalidateEmail } from "../../utils/utils";
import { Avatar } from "../Avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

import { ParticipantListItem } from "./ParticipantListItem";

export const AddMemberButton = ({ groupSheetId }: { groupSheetId: string }) => {
  const onLine = useNavigatorOnLine();

  const { mutateAsync: addGroupSheetMember, isPending } =
    trpc.sheet.addGroupSheetMember.useMutation();
  const utils = trpc.useUtils();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [email, setEmail] = useState("");

  const valid = prevalidateEmail(email);

  const handleClose = () => {
    setAddMemberOpen(false);
    setEmail("");
  };

  const handleAddMember = async () => {
    await addGroupSheetMember({
      groupSheetId,
      email,
    });

    await Promise.all([
      utils.sheet.groupSheetById.invalidate(groupSheetId),
      utils.transaction.getParticipantSummaries.invalidate(groupSheetId),
      utils.transaction.getSimplifiedBalances.invalidate(groupSheetId),
    ]);

    handleClose();
  };

  return addMemberOpen ? (
    <ParticipantListItem className="items-end" avatar={<Avatar name="" />}>
      <form
        className="flex grow items-end gap-2"
        onSubmit={(e) => {
          if (!valid) {
            return;
          }

          e.preventDefault();
          void handleAddMember();
        }}
      >
        <Input
          className="grow"
          autoFocus
          placeholder="Email address"
          disabled={isPending}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />

        <Button
          $variant="outline"
          type="reset"
          aria-label="Cancel"
          onClick={handleClose}
        >
          <Cross2Icon />
        </Button>

        <Button
          $variant="outline"
          type="submit"
          aria-label="Add"
          disabled={!valid}
        >
          <CheckIcon />
        </Button>
      </form>
    </ParticipantListItem>
  ) : (
    <Button
      className="w-full"
      $variant="outline"
      disabled={!onLine}
      onClick={() => {
        setAddMemberOpen(true);
      }}
    >
      <PersonIcon />
      Add Participant
    </Button>
  );
};
