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
import { Trash2, Plus, Edit } from "lucide-react"

interface ConnectionTemplate {
  id: string
  name: string
  type: "SSH" | "WEB_URL" | "API_KEY" | "VPN" | "RDP"
  fields: Record<string, any>
  bookingTypeId: string | null
  bookingType: {
    id: string
    name: string
  } | null
  isActive: boolean
}

interface BookingType {
  id: string
  name: string
}

export function TemplatesManagement() {
  const [templates, setTemplates] = useState<ConnectionTemplate[]>([])
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ConnectionTemplate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "SSH" as "SSH" | "WEB_URL" | "API_KEY" | "VPN" | "RDP",
    bookingTypeId: "",
    isActive: true,
    fields: {} as Record<string, any>,
  })
  const [fieldEditor, setFieldEditor] = useState({
    key: "",
    label: "",
    type: "string" as "string" | "number" | "boolean",
    required: false,
    default: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      const [templatesResponse, typesResponse] = await Promise.all([
        fetch("/api/admin/templates"),
        fetch("/api/booking-types"),
      ])

      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        // Validate and normalize template data
        const normalizedTemplates = Array.isArray(templatesData)
          ? templatesData
              .filter((t: any) => t && t.id)
              .map((t: any) => ({
                ...t,
                fields: t.fields && typeof t.fields === "object" && !Array.isArray(t.fields) 
                  ? t.fields 
                  : {},
                bookingType: t.bookingType && t.bookingType.id && t.bookingType.name
                  ? { id: String(t.bookingType.id), name: String(t.bookingType.name) }
                  : null,
              }))
          : []
        setTemplates(normalizedTemplates)
      } else {
        setTemplates([])
      }

      if (typesResponse.ok) {
        const typesData = await typesResponse.json()
        // Extract just id and name from booking types
        const simplifiedTypes = Array.isArray(typesData)
          ? typesData
              .filter((type: any) => type && type.id && type.name)
              .map((type: any) => ({
                id: String(type.id),
                name: String(type.name),
              }))
          : []
        setBookingTypes(simplifiedTypes)
      } else {
        setBookingTypes([])
      }
    } catch (error: any) {
      console.error("Error fetching data:", error)
      const errorMessage = error?.message || "Failed to load data"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      setTemplates([])
      setBookingTypes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (Object.keys(formData.fields).length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one field",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingTemplate
        ? `/api/admin/templates/${editingTemplate.id}`
        : "/api/admin/templates"
      const method = editingTemplate ? "PUT" : "POST"

      const payload = {
        ...formData,
        bookingTypeId: formData.bookingTypeId || null,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save template")
      }

      toast({
        title: "Success",
        description: editingTemplate ? "Template updated" : "Template created",
      })

      setIsDialogOpen(false)
      setEditingTemplate(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "SSH",
      bookingTypeId: "",
      isActive: true,
      fields: {},
    })
    setFieldEditor({
      key: "",
      label: "",
      type: "string",
      required: false,
      default: "",
    })
  }

  const handleAddField = () => {
    if (!fieldEditor.key || !fieldEditor.label) {
      toast({
        title: "Error",
        description: "Field key and label are required",
        variant: "destructive",
      })
      return
    }

    setFormData({
      ...formData,
      fields: {
        ...formData.fields,
        [fieldEditor.key]: {
          type: fieldEditor.type,
          label: fieldEditor.label,
          required: fieldEditor.required,
          ...(fieldEditor.default && { default: fieldEditor.default }),
        },
      },
    })

    setFieldEditor({
      key: "",
      label: "",
      type: "string",
      required: false,
      default: "",
    })
  }

  const handleRemoveField = (key: string) => {
    const newFields = { ...formData.fields }
    delete newFields[key]
    setFormData({ ...formData, fields: newFields })
  }

  const handleEdit = (template: ConnectionTemplate) => {
    setEditingTemplate(template)
    // Ensure fields is a proper object
    const fields = template.fields && typeof template.fields === "object" && !Array.isArray(template.fields)
      ? template.fields as Record<string, any>
      : {}
    
    setFormData({
      name: String(template.name || ""),
      type: template.type || "SSH",
      bookingTypeId: template.bookingTypeId ? String(template.bookingTypeId) : "",
      isActive: Boolean(template.isActive),
      fields: fields,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete template")
      }

      toast({
        title: "Success",
        description: "Template deleted",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={() => { setError(null); fetchData(); }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTemplate(null)
                resetForm()
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edit Template" : "Create Template"}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate
                    ? "Update connection template details"
                    : "Create a new connection information template"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
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
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "SSH" | "WEB_URL" | "API_KEY" | "VPN" | "RDP") =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger id="type">
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
                  <Label htmlFor="bookingType">Booking Type (Optional)</Label>
                  <Select
                    value={formData.bookingTypeId || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, bookingTypeId: value === "" ? "" : value })
                    }
                  >
                    <SelectTrigger id="bookingType">
                      <SelectValue placeholder="Global (all booking types)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Global (all booking types)</SelectItem>
                      {Array.isArray(bookingTypes) && bookingTypes.length > 0
                        ? bookingTypes.map((type) => {
                            const typeId = String(type.id || "")
                            const typeName = String(type.name || "")
                            return typeId && typeName ? (
                              <SelectItem key={typeId} value={typeId}>
                                {typeName}
                              </SelectItem>
                            ) : null
                          })
                        : null}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <Label>Template Fields</Label>
                  <div className="space-y-2">
                    {Object.entries(formData.fields || {}).map(([key, field]) => {
                      const fieldObj = field && typeof field === "object" ? field : {}
                      return (
                        <div
                          key={String(key)}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{String(key)}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({String(fieldObj.type || "string")}) - {String(fieldObj.label || "")}
                              {fieldObj.required && " *"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveField(String(key))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Field key (e.g., host)"
                      value={fieldEditor.key}
                      onChange={(e) =>
                        setFieldEditor({ ...fieldEditor, key: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Field label (e.g., Host)"
                      value={fieldEditor.label}
                      onChange={(e) =>
                        setFieldEditor({ ...fieldEditor, label: e.target.value })
                      }
                    />
                    <Select
                      value={fieldEditor.type}
                      onValueChange={(value: "string" | "number" | "boolean") =>
                        setFieldEditor({ ...fieldEditor, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={fieldEditor.required}
                        onChange={(e) =>
                          setFieldEditor({ ...fieldEditor, required: e.target.checked })
                        }
                        className="rounded"
                      />
                      <Label className="text-sm">Required</Label>
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddField}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
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
        <p>Loading templates...</p>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No templates found. Create your first template to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>
                      {String(template.type)} •{" "}
                      {template.bookingType && template.bookingType.name
                        ? String(template.bookingType.name)
                        : "Global"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fields:</p>
                  <div className="flex flex-wrap gap-2">
                    {template.fields &&
                    typeof template.fields === "object" &&
                    !Array.isArray(template.fields) &&
                    Object.keys(template.fields).length > 0
                      ? Object.keys(template.fields).map((key) => (
                          <span
                            key={String(key)}
                            className="rounded-md bg-muted px-2 py-1 text-xs"
                          >
                            {String(key)}
                          </span>
                        ))
                      : <span className="text-xs text-muted-foreground">No fields</span>}
                  </div>
                  <p
                    className={`text-sm ${
                      template.isActive ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {template.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

