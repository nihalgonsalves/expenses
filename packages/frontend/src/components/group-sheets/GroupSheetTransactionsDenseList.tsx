import { AnimatePresence, motion } from "framer-motion";
import { forwardRef } from "react";

import type { GroupSheetTransactionListItem } from "@nihalgonsalves/expenses-shared/types/transaction";

import {
  getTransactionDescription,
  getGroupSheetTransactionSummaryText,
} from "../../utils/utils";
import { AvatarGroup } from "../Avatar";
import { CategoryAvatar } from "../CategoryAvatar";
import { CurrencySpan } from "../CurrencySpan";

const DenseTransactionListItem = forwardRef<
  HTMLDivElement,
  {
    transaction: GroupSheetTransactionListItem;
  }
>(({ transaction }, ref) => {
  const descriptionText = getTransactionDescription(transaction);

  return (
    <motion.div
      ref={ref}
      key={transaction.id}
      className="flex flex-row items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="listitem"
    >
      <CategoryAvatar category={transaction.category} />
      <div>
        <strong>{descriptionText}</strong>{" "}
        <CurrencySpan money={transaction.money} />
        <span
          className="inline-block text-gray-500"
          style={{
            overflow: "hidden",
            // non-standard but does work in all browsers, should
            // be replaced with `lineClamp` eventually
            // https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp
            // https://drafts.csswg.org/css-overflow-4/#propdef-line-clamp
            display: "-webkit-box",
            WebkitLineClamp: "1",
            WebkitBoxOrient: "vertical",
          }}
        >
          {getGroupSheetTransactionSummaryText(transaction)}
        </span>
      </div>
      <div style={{ flexGrow: 1 }} />
      <AvatarGroup max={5} users={transaction.participants} />
    </motion.div>
  );
});
DenseTransactionListItem.displayName = "DenseTransactionListItem";

export const GroupSheetTransactionsDenseList = ({
  transactions,
}: {
  transactions: GroupSheetTransactionListItem[];
}) => (
  <div className="flex flex-col gap-4" role="list">
    <AnimatePresence mode="popLayout" initial={false}>
      {transactions.map((transaction) => (
        <DenseTransactionListItem
          key={transaction.id}
          transaction={transaction}
        />
      ))}
    </AnimatePresence>
  </div>
);
