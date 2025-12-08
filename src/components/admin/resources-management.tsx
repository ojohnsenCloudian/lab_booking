"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface LabResource {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

export function ResourcesManagement() {
  const [resources, setResources] = useState<LabResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<LabResource | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "", isActive: true })
  const { toast } = useToast()

  useEffect(() => {
    fetchResources()
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
      setFormData({ name: "", description: "", isActive: true })
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
      isActive: resource.isActive,
    })
    setIsDialogOpen(true)
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
              setFormData({ name: "", description: "", isActive: true })
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
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

