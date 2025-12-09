import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default async function AuditLogsPage() {
  await requireAdmin();

  const logs = await prisma.actionLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Audit Logs</h1>
      <div className="grid gap-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <CardTitle>{log.action}</CardTitle>
              <CardDescription>
                {log.user.email} • {format(new Date(log.createdAt), "PPP p")}
                {log.targetType && ` • ${log.targetType}`}
              </CardDescription>
            </CardHeader>
            {log.details && (
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

