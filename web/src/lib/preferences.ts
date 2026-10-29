import { eq } from "drizzle-orm";
import { db } from "./db";
import { userPreferences, type UserPreferences } from "./db/schema";

export async function getPreferences(
  userId: string,
): Promise<UserPreferences> {
  await db
    .insert(userPreferences)
    .values({ userId })
    .onConflictDoNothing({ target: userPreferences.userId });

  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (!row) {
    throw new Error("No se pudieron cargar las preferencias del usuario.");
  }

  return row;
}
