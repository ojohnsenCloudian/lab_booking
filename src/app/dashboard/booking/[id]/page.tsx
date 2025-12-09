"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Check } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  labType: {
    id: string;
    name: string;
  };
}

interface ConnectionInfo {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  config: any;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [password, setPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch booking");
      }
      const data = await response.json();
      setBooking(data);
      
      // Check if booking has started
      const now = new Date();
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);
      
      if (now >= startTime && now < endTime) {
        // Try to fetch connection info (will require password)
        tryFetchConnectionInfo();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch booking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const tryFetchConnectionInfo = async () => {
    try {
      const response = await fetch(`/api/connection-info/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setConnectionInfo(data.connectionInfo);
        setPasswordVerified(true);
      }
    } catch (error) {
      // Connection info not available yet or password required
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);

    try {
      const response = await fetch(`/api/bookings/${params.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error("Invalid password");
      }

      setPasswordVerified(true);
      fetchConnectionInfo();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid password",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const fetchConnectionInfo = async () => {
    try {
      const response = await fetch(`/api/connection-info/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch connection info");
      }
      const data = await response.json();
      setConnectionInfo(data.connectionInfo);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch connection info",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }

      toast({
        title: "Success",
        description: "Booking cancelled",
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!booking) {
    return <div>Booking not found</div>;
  }

  const now = new Date();
  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  const canViewConnectionInfo = now >= startTime && now < endTime && passwordVerified;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Booking Details</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{booking.labType.name}</CardTitle>
          <CardDescription>
            {format(startTime, "PPP p")} - {format(endTime, "p")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Status:</strong> {booking.status}
          </div>
          {booking.notes && (
            <div>
              <strong>Notes:</strong> {booking.notes}
            </div>
          )}
          {booking.status === "ACTIVE" && (
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Booking
            </Button>
          )}
        </CardContent>
      </Card>

      {canViewConnectionInfo && connectionInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Information</CardTitle>
            <CardDescription>
              Use these credentials to connect to the lab resources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {connectionInfo.map((info) => (
              <div key={info.resourceId} className="border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold">{info.resourceName}</h3>
                <p className="text-sm text-muted-foreground">{info.resourceType}</p>
                {info.resourceType === "SSH" || info.resourceType === "RDP" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Host: {info.config.host}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(info.config.host, `host-${info.resourceId}`)}
                      >
                        {copied[`host-${info.resourceId}`] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Port: {info.config.port}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(info.config.port.toString(), `port-${info.resourceId}`)}
                      >
                        {copied[`port-${info.resourceId}`] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Username: {info.config.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(info.config.username, `username-${info.resourceId}`)}
                      >
                        {copied[`username-${info.resourceId}`] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Password: {info.config.password}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(info.config.password, `password-${info.resourceId}`)}
                      >
                        {copied[`password-${info.resourceId}`] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </>
                ) : info.resourceType === "WEB_APP" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">URL: {info.config.url}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(info.config.url, `url-${info.resourceId}`)}
                    >
                      {copied[`url-${info.resourceId}`] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : info.resourceType === "VPN" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Hostname: {info.config.hostname}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(info.config.hostname, `hostname-${info.resourceId}`)}
                      >
                        {copied[`hostname-${info.resourceId}`] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Port: {info.config.port}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(info.config.port.toString(), `port-${info.resourceId}`)}
                      >
                        {copied[`port-${info.resourceId}`] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Username: {info.config.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(info.config.username, `username-${info.resourceId}`)}
                      >
                        {copied[`username-${info.resourceId}`] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Password: {info.config.password}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(info.config.password, `password-${info.resourceId}`)}
                      >
                        {copied[`password-${info.resourceId}`] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {canViewConnectionInfo && !connectionInfo && (
        <Card>
          <CardContent className="pt-6">
            <p>Loading connection information...</p>
          </CardContent>
        </Card>
      )}

      {!canViewConnectionInfo && now < startTime && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Information</CardTitle>
            <CardDescription>
              Connection details will be available when your booking starts
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!canViewConnectionInfo && now >= endTime && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Information</CardTitle>
            <CardDescription>
              This booking has ended. Connection details are no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {canViewConnectionInfo && !passwordVerified && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Password</CardTitle>
            <CardDescription>
              Enter your booking password to view connection information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Booking Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={verifying}>
                {verifying ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
