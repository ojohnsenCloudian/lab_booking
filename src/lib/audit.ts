import { prisma } from "./prisma";

export async function logAction(
  userId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: any
) {
  try {
    await prisma.actionLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId,
        details: details || {},
      },
    });
  } catch (error) {
    console.error("Error logging action:", error);
    // Don't throw - audit logging should not break the main flow
  }
}

