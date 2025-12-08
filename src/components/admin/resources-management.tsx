"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Plus } from "lucide-react"

interface LabResource {
  id: string
  name: string
  description: string | null
  resourceType: "SSH" | "WEB_URL" | "VPN" | "API_KEY" | "RDP"
  isActive: boolean
  connectionMetadata?: Record<string, any> | null
}

export function ResourcesManagement() {
  const [resources, setResources] = useState<LabResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<LabResource | null>(null)
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "",
    resourceType: "SSH" as "SSH" | "WEB_URL" | "VPN" | "API_KEY" | "RDP",
    isActive: true,
    connectionMetadata: {} as Record<string, any>
  })
  const [connectionField, setConnectionField] = useState({ key: "", value: "" })
  const { toast } = useToast()

  useEffect(() => {
    fetchResources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/admin/resources")
      if (response.ok) {
        const data = await response.json()
        setResources(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingResource
        ? `/api/admin/resources/${editingResource.id}`
        : "/api/admin/resources"
      const method = editingResource ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save resource")
      }

      toast({
        title: "Success",
        description: editingResource ? "Resource updated" : "Resource created",
      })

      setIsDialogOpen(false)
      setEditingResource(null)
      setFormData({ name: "", description: "", isActive: true, connectionMetadata: {} })
      setConnectionField({ key: "", value: "" })
      fetchResources()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save resource",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (resource: LabResource) => {
    setEditingResource(resource)
    setFormData({
      name: resource.name,
      description: resource.description || "",
      resourceType: resource.resourceType || "SSH",
      isActive: resource.isActive,
      connectionMetadata: resource.connectionMetadata || {},
    })
    setConnectionField({ key: "", value: "" })
    setIsDialogOpen(true)
  }

  const handleAddConnectionField = () => {
    if (!connectionField.key) {
      toast({
        title: "Error",
        description: "Field key is required",
        variant: "destructive",
      })
      return
    }

    setFormData({
      ...formData,
      connectionMetadata: {
        ...formData.connectionMetadata,
        [connectionField.key]: connectionField.value,
      },
    })
    setConnectionField({ key: "", value: "" })
  }

  const handleRemoveConnectionField = (key: string) => {
    const newMetadata = { ...formData.connectionMetadata }
    delete newMetadata[key]
    setFormData({ ...formData, connectionMetadata: newMetadata })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/resources/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete resource")
      }

      toast({
        title: "Success",
        description: "Resource deleted",
      })

      fetchResources()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingResource(null)
              setFormData({ name: "", description: "", resourceType: "SSH", isActive: true, connectionMetadata: {} })
              setConnectionField({ key: "", value: "" })
            }}>
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingResource ? "Edit Resource" : "Create Resource"}
                </DialogTitle>
                <DialogDescription>
                  {editingResource
                    ? "Update resource details"
                    : "Add a new lab resource"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resourceType">Resource Type</Label>
                    <Select
                      value={formData.resourceType}
                      onValueChange={(value: "SSH" | "WEB_URL" | "VPN" | "API_KEY" | "RDP") =>
                        setFormData({ ...formData, resourceType: value, connectionMetadata: {} })
                      }
                    >
                      <SelectTrigger id="resourceType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SSH">SSH</SelectItem>
                        <SelectItem value="WEB_URL">Web URL</SelectItem>
                        <SelectItem value="VPN">VPN</SelectItem>
                        <SelectItem value="RDP">RDP</SelectItem>
                        <SelectItem value="API_KEY">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-4 border-t pt-4">
                  <Label>Connection Information</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.resourceType === "SSH" && "Add SSH connection details (IP, username, password, port, etc.)"}
                    {formData.resourceType === "WEB_URL" && "Add Web URL connection details (base_url, endpoint, etc.)"}
                    {formData.resourceType === "VPN" && "Add VPN connection details (server, config, credentials, etc.)"}
                    {formData.resourceType === "API_KEY" && "Add API Key connection details (api_key, endpoint, etc.)"}
                  </p>
                  {formData.resourceType === "SSH" && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <p className="font-medium mb-1">Suggested fields for SSH:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>ip or host - Server IP address or hostname</li>
                        <li>username - SSH username</li>
                        <li>password - SSH password (will be generated per booking)</li>
                        <li>port - SSH port (default: 22)</li>
                      </ul>
                    </div>
                  )}
                  {formData.resourceType === "WEB_URL" && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <p className="font-medium mb-1">Suggested fields for Web URL:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>url or base_url - Base URL for the web interface</li>
                        <li>endpoint - API endpoint if applicable</li>
                      </ul>
                    </div>
                  )}
                  {formData.resourceType === "VPN" && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <p className="font-medium mb-1">Suggested fields for VPN:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>server - VPN server address</li>
                        <li>config - VPN configuration details</li>
                        <li>credentials - VPN credentials</li>
                      </ul>
                    </div>
                  )}
                  {formData.resourceType === "API_KEY" && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <p className="font-medium mb-1">Suggested fields for API Key:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>api_key - API key (will be generated per booking)</li>
                        <li>endpoint - API endpoint URL</li>
                      </ul>
                    </div>
                  )}
                  <div className="space-y-2">
                    {Object.entries(formData.connectionMetadata || {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex-1">
                          <span className="font-medium">{key}:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {String(value)}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveConnectionField(key)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Key (e.g., ssh_host, web_url, api_endpoint)"
                      value={connectionField.key}
                      onChange={(e) =>
                        setConnectionField({ ...connectionField, key: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Value"
                        value={connectionField.value}
                        onChange={(e) =>
                          setConnectionField({ ...connectionField, value: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddConnectionField}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Loading resources...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader>
                <CardTitle>{resource.name}</CardTitle>
                <CardDescription>{resource.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm ${resource.isActive ? "text-green-600" : "text-gray-500"}`}
                    >
                      {resource.isActive ? "Active" : "Inactive"}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(resource)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(resource.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {resource.connectionMetadata && 
                   typeof resource.connectionMetadata === "object" &&
                   Object.keys(resource.connectionMetadata).length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium mb-1">Connection Info:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(resource.connectionMetadata).map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

