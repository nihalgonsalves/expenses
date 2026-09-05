import { useMutation, useQuery } from "@tanstack/react-query";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { CategoryGroup } from "@nihalgonsalves/expenses-shared/types/category-group";

import { useQueryClient } from "../../api/query-client";
import { userApi } from "../../api/user.functions";
import { transactionQueries } from "../../api/transaction.functions";
import { CategoryIcon } from "../category-avatar";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";

const CategoryGroupDialog = ({
  categoryGroup,
  categoryIds,
  assignedCategoryIds,
}: {
  categoryGroup?: CategoryGroup;
  categoryIds: string[];
  assignedCategoryIds: Set<string>;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(categoryGroup?.name ?? "");
  const [categories, setCategories] = useState<string[]>(
    categoryGroup?.categories ?? [],
  );
  const { invalidate } = useQueryClient();
  const { mutateAsync: createCategoryGroup, isPending: isCreating } =
    useMutation(userApi.categoryGroups.createMutationOptions());
  const { mutateAsync: updateCategoryGroup, isPending: isUpdating } =
    useMutation(userApi.categoryGroups.updateMutationOptions());

  useEffect(() => {
    if (!open) return;
    setName(categoryGroup?.name ?? "");
    setCategories(categoryGroup?.categories ?? []);
  }, [categoryGroup, open]);

  const toggleCategory = (category: string) => {
    setCategories((previous) =>
      previous.includes(category)
        ? previous.filter((item) => item !== category)
        : [...previous, category],
    );
  };

  const save = async () => {
    try {
      const input = { name, categories };
      if (categoryGroup) {
        await updateCategoryGroup({ ...input, id: categoryGroup.id });
      } else {
        await createCategoryGroup(input);
      }
      await invalidate(userApi.categoryGroups.queryKey());
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save group",
      );
    }
  };

  const ownCategories = new Set(categoryGroup?.categories);
  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={categoryGroup ? "ghost" : "secondary"} size="sm">
            {categoryGroup ? <PencilIcon /> : <PlusIcon />}
            {categoryGroup ? "Edit" : "Add group"}
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {categoryGroup ? "Edit" : "Add"} category group
          </DialogTitle>
          <DialogDescription>
            Categories can belong to one group at a time.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            aria-label="Group name"
            placeholder="e.g. Food"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
          <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto">
            {categoryIds.map((category) => {
              const selected = categories.includes(category);
              const unavailable =
                assignedCategoryIds.has(category) &&
                !ownCategories.has(category);
              return (
                <Button
                  key={category}
                  variant={selected ? "secondary" : "outline"}
                  size="sm"
                  disabled={unavailable}
                  onClick={() => {
                    toggleCategory(category);
                  }}
                >
                  <CategoryIcon category={category} />
                  {category}
                </Button>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={name.trim().length === 0}
            isLoading={isPending}
            onClick={() => void save()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const CategoryGroupsForm = () => {
  const { invalidate } = useQueryClient();
  const { data: categoryGroups = [] } = useQuery(
    userApi.categoryGroups.queryOptions(),
  );
  const { data: categories = [] } = useQuery(
    transactionQueries.categories.queryOptions(),
  );
  const { mutateAsync: deleteCategoryGroup, isPending: isDeleting } =
    useMutation(userApi.categoryGroups.deleteMutationOptions());

  const categoryIds = categories.map(({ id }) => id);
  const assignedCategoryIds = new Set(
    categoryGroups.flatMap((categoryGroup) => categoryGroup.categories),
  );

  const remove = async (id: string) => {
    await deleteCategoryGroup(id);
    await invalidate(userApi.categoryGroups.queryKey());
  };

  return (
    <Card>
      <CardHeader className="grid-cols-[1fr_auto]">
        <CardTitle>Category groups</CardTitle>
        <CategoryGroupDialog
          categoryIds={categoryIds}
          assignedCategoryIds={assignedCategoryIds}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {categoryGroups.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Group related categories together for totals in the Stats view.
          </p>
        ) : (
          categoryGroups.map((categoryGroup) => (
            <div
              key={categoryGroup.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-3"
            >
              <div className="flex flex-col gap-1">
                <div className="font-medium">{categoryGroup.name}</div>
                <div className="text-muted-foreground text-sm">
                  {categoryGroup.categories.join(", ") || "No categories yet"}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <CategoryGroupDialog
                  categoryGroup={categoryGroup}
                  categoryIds={categoryIds}
                  assignedCategoryIds={assignedCategoryIds}
                />
                <Button
                  aria-label={`Delete ${categoryGroup.name}`}
                  variant="ghost"
                  size="icon-sm"
                  disabled={isDeleting}
                  onClick={() => void remove(categoryGroup.id)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
