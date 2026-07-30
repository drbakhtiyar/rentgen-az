"use server";

import { requireRole } from "@/lib/auth/rbac";
import { clearSessionCookie } from "@/lib/auth/session";
import {
  saveCenterLoose,
  type CenterWriteInput,
  type CenterWriteResult,
} from "@/lib/center-write";

/** Create a center (loose — missing fields are allowed). Operator or admin. */
export async function createCenterFlexAction(
  input: CenterWriteInput,
): Promise<CenterWriteResult> {
  await requireRole(["OPERATOR", "ADMIN"]);
  return saveCenterLoose(null, input);
}

/** Update a center (loose — missing fields are allowed). Operator or admin. */
export async function updateCenterFlexAction(
  centerId: string,
  input: CenterWriteInput,
): Promise<CenterWriteResult> {
  await requireRole(["OPERATOR", "ADMIN"]);
  return saveCenterLoose(centerId, input);
}

export async function operatorLogoutAction(): Promise<void> {
  await clearSessionCookie();
}
