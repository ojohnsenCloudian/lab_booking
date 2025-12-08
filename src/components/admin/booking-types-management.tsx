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

interface BookingType {
  id: string
  name: string
  description: string | null
  isActive: boolean
  resources: Array<{
    labResource: {
      id: string
      name: string
    }
  }>
}

interface LabResource {
  id: string
  name: string
}

export function BookingTypesManagement() {
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([])
  const [resources, setResources] = useState<LabResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<BookingType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      const [typesResponse, resourcesResponse] = await Promise.all([
        fetch("/api/admin/booking-types"),
        fetch("/api/admin/resources"),
      ])

      if (typesResponse.ok) {
        const typesData = await typesResponse.json()
        setBookingTypes(typesData)
      }

      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json()
        setResources(resourcesData)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingType
        ? `/api/admin/booking-types/${editingType.id}`
        : "/api/admin/booking-types"
      const method = editingType ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save booking type")
      }

      toast({
        title: "Success",
        description: editingType ? "Booking type updated" : "Booking type created",
      })

      setIsDialogOpen(false)
      setEditingType(null)
      setFormData({ name: "", description: "", isActive: true })
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save booking type",
        variant: "destructive",
      })
    }
  }

  const handleAssignResource = async (bookingTypeId: string, resourceId: string) => {
    try {
      const response = await fetch(
        `/api/admin/booking-types/${bookingTypeId}/resources`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labResourceId: resourceId }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to assign resource")
      }

      toast({
        title: "Success",
        description: "Resource assigned",
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign resource",
        variant: "destructive",
      })
    }
  }

  const handleRemoveResource = async (bookingTypeId: string, resourceId: string) => {
    try {
      const response = await fetch(
        `/api/admin/booking-types/${bookingTypeId}/resources/${resourceId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to remove resource")
      }

      toast({
        title: "Success",
        description: "Resource removed",
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove resource",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (type: BookingType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || "",
      isActive: type.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking type?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/booking-types/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete booking type")
      }

      toast({
        title: "Success",
        description: "Booking type deleted",
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete booking type",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingType(null)
                setFormData({ name: "", description: "", isActive: true })
              }}
            >
              Add Booking Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? "Edit Booking Type" : "Create Booking Type"}
                </DialogTitle>
                <DialogDescription>
                  {editingType
                    ? "Update booking type details"
                    : "Add a new booking type"}
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
        <p>Loading booking types...</p>
      ) : (
        <div className="space-y-4">
          {bookingTypes.map((type) => (
            <Card key={type.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{type.name}</CardTitle>
                    <CardDescription>{type.description || "No description"}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(type)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(type.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Assigned Resources ({type.resources.length})
                    </p>
                    {type.resources.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No resources assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {type.resources.map((r) => (
                          <div
                            key={r.labResource.id}
                            className="flex items-center gap-2 rounded-md border px-2 py-1"
                          >
                            <span className="text-sm">{r.labResource.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveResource(type.id, r.labResource.id)
                              }
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      onValueChange={(value) => handleAssignResource(type.id, value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Assign resource" />
                      </SelectTrigger>
                      <SelectContent>
                        {resources
                          .filter(
                            (r) =>
                              !type.resources.some(
                                (tr) => tr.labResource.id === r.id
                              )
                          )
                          .map((resource) => (
                            <SelectItem key={resource.id} value={resource.id}>
                              {resource.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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

