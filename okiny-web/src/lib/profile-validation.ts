import { z } from "zod";

import {
  DISPLAY_USER_ID_MIN_LENGTH,
  DISPLAY_USER_ID_MAX_LENGTH,
  normalizeDisplayUserId,
} from "./user-utils";

const DISPLAY_USER_ID_PATTERN = new RegExp(
  `^[a-z0-9_]{${DISPLAY_USER_ID_MIN_LENGTH},${DISPLAY_USER_ID_MAX_LENGTH}}$`,
);

export const displayNameSchema = z
  .string()
  .transform((v) => v.trim())
  .pipe(
    z
      .string()
      .min(1, "ユーザーネームを入力してください")
      .max(30, "ユーザーネームは30文字以内で入力してください"),
  );

export const displayUserIdSchema = z
  .string()
  .transform((v) => normalizeDisplayUserId(v))
  .pipe(
    z
      .string()
      .min(
        DISPLAY_USER_ID_MIN_LENGTH,
        `ユーザーIDは${DISPLAY_USER_ID_MIN_LENGTH}文字以上で入力してください`,
      )
      .max(
        DISPLAY_USER_ID_MAX_LENGTH,
        `ユーザーIDは${DISPLAY_USER_ID_MAX_LENGTH}文字以内で入力してください`,
      )
      .regex(
        DISPLAY_USER_ID_PATTERN,
        "ユーザーIDは半角英小文字・数字・アンダースコアのみ使用できます",
      ),
  );

export const profileStepSchema = z.object({
  displayName: displayNameSchema,
  displayUserId: displayUserIdSchema,
});

export type ProfileStepInput = z.infer<typeof profileStepSchema>;
