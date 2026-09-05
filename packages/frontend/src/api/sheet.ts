import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  ZAddGroupSheetMemberInput,
  ZCreateGroupSheetInput,
  ZCreatePersonalSheetInput,
  ZSheetsQuery,
  ZUpdateSheetInput,
} from "@nihalgonsalves/expenses-shared/types/sheet";
import * as backendSheetApi from "@nihalgonsalves/expenses-backend/src/service/sheet/sheet-api";

import { requiredServerContextMiddleware } from "../server/context";

const authenticatedMiddleware = [requiredServerContextMiddleware] as const;

export const getMySheets = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .validator(ZSheetsQuery)
  .handler(async ({ context, data }) =>
    backendSheetApi.getMySheets(context, data),
  );

export const getGroupSheetById = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .validator(z.string().min(1))
  .handler(async ({ context, data }) =>
    backendSheetApi.getGroupSheetById(context, data),
  );

export const getPersonalSheetById = createServerFn({ method: "GET" })
  .middleware(authenticatedMiddleware)
  .validator(z.string().min(1))
  .handler(async ({ context, data }) =>
    backendSheetApi.getPersonalSheetById(context, data),
  );

export const createPersonalSheet = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZCreatePersonalSheetInput)
  .handler(async ({ context, data }) =>
    backendSheetApi.createPersonalSheet(context, data),
  );

export const createGroupSheet = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZCreateGroupSheetInput)
  .handler(async ({ context, data }) =>
    backendSheetApi.createGroupSheet(context, data),
  );

export const updateSheet = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZUpdateSheetInput)
  .handler(async ({ context, data }) =>
    backendSheetApi.updateSheet(context, data),
  );

const ZArchiveSheetInput = backendSheetApi.ZArchiveSheetInput;

export const archiveSheet = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZArchiveSheetInput)
  .handler(async ({ context, data }) =>
    backendSheetApi.archiveSheet(context, data),
  );

export const deleteSheet = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(z.string().min(1))
  .handler(async ({ context, data }) =>
    backendSheetApi.deleteSheet(context, data),
  );

export const addGroupSheetMember = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(ZAddGroupSheetMemberInput)
  .handler(async ({ context, data }) =>
    backendSheetApi.addGroupSheetMember(context, data),
  );

export const deleteGroupSheetMember = createServerFn({ method: "POST" })
  .middleware(authenticatedMiddleware)
  .validator(backendSheetApi.ZDeleteGroupSheetMemberInput)
  .handler(async ({ context, data }) =>
    backendSheetApi.deleteGroupSheetMember(context, data),
  );

type MySheetsInput = z.output<typeof ZSheetsQuery>;

const mySheetsQueryKeyPrefix = ["sheet", "my-sheets"] as const;

const mySheetsQueryKey = (input?: MySheetsInput) =>
  input === undefined
    ? mySheetsQueryKeyPrefix
    : ([...mySheetsQueryKeyPrefix, input] as const);

const mySheetsQueryOptions = (input: MySheetsInput) =>
  queryOptions({
    queryKey: mySheetsQueryKey(input),
    queryFn: async () => getMySheets({ data: input }),
    staleTime: Infinity,
  });

const groupSheetByIdQueryKey = (id: string) => ["sheet", "group", id] as const;
const personalSheetByIdQueryKey = (id: string) =>
  ["sheet", "personal", id] as const;

const groupSheetByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: groupSheetByIdQueryKey(id),
    queryFn: async () => getGroupSheetById({ data: id }),
    staleTime: Infinity,
  });
const personalSheetByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: personalSheetByIdQueryKey(id),
    queryFn: async () => getPersonalSheetById({ data: id }),
    staleTime: Infinity,
  });

export const sheetQueries = {
  mySheets: {
    queryKey: mySheetsQueryKey,
    queryOptions: mySheetsQueryOptions,
  },
  groupSheetById: {
    queryKey: groupSheetByIdQueryKey,
    queryOptions: groupSheetByIdQueryOptions,
  },
  personalSheetById: {
    queryKey: personalSheetByIdQueryKey,
    queryOptions: personalSheetByIdQueryOptions,
  },
};

export const sheetMutations = {
  createPersonalSheet: () =>
    mutationOptions({
      mutationFn: async (data: z.output<typeof ZCreatePersonalSheetInput>) =>
        createPersonalSheet({ data }),
    }),
  createGroupSheet: () =>
    mutationOptions({
      mutationFn: async (data: z.output<typeof ZCreateGroupSheetInput>) =>
        createGroupSheet({ data }),
    }),
  updateSheet: () =>
    mutationOptions({
      mutationFn: async (data: z.output<typeof ZUpdateSheetInput>) =>
        updateSheet({ data }),
    }),
  archiveSheet: () =>
    mutationOptions({
      mutationFn: async (data: z.output<typeof ZArchiveSheetInput>) =>
        archiveSheet({ data }),
    }),
  deleteSheet: () =>
    mutationOptions({
      mutationFn: async (data: string) => deleteSheet({ data }),
    }),
  addGroupSheetMember: () =>
    mutationOptions({
      mutationFn: async (data: z.output<typeof ZAddGroupSheetMemberInput>) =>
        addGroupSheetMember({ data }),
    }),
  deleteGroupSheetMember: () =>
    mutationOptions({
      mutationFn: async (data: {
        groupSheetId: string;
        participantId: string;
      }) => deleteGroupSheetMember({ data }),
    }),
};
