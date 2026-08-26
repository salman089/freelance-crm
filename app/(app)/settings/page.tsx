import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";
import { ImportForm } from "./import-form";
import { DangerZone } from "./danger-zone";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and your data.
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-4">
          <ProfileForm name={user.name} email={user.email} />
        </TabsContent>

        <TabsContent value="data" className="space-y-6 pt-4">
          <Card>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">Export your data</p>
                <p className="text-sm text-muted-foreground">
                  Download every client, project, time entry, and payment as
                  a JSON file.
                </p>
              </div>
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href="/api/export" />}
              >
                <DownloadSimple className="size-4" weight="bold" />
                Export data
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">Import data</p>
                <p className="text-sm text-muted-foreground">
                  Upload a Workbase export file. Existing clients, projects,
                  time entries, and payments are kept — only new items are
                  added.
                </p>
              </div>
              <ImportForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="pt-4">
          <DangerZone />
        </TabsContent>
      </Tabs>
    </div>
  );
}
