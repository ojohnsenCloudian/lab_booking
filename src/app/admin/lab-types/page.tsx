"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

interface LabType {
  id: string;
  name: string;
  maxDurationHours: number | null;
  active: boolean;
  resources: Array<{
    resource: {
      id: string;
      name: string;
    };
  }>;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export default function LabTypesPage() {
  const [labTypes, setLabTypes] = useState<LabType[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLabType, setEditingLabType] = useState<LabType | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    maxDurationHours: "",
    active: true,
    resourceIds: [] as string[],
  });

  useEffect(() => {
    fetchLabTypes();
    fetchResources();
  }, []);

  const fetchLabTypes = async () => {
    try {
      const response = await fetch("/api/admin/lab-types");
      const data = await response.json();
      setLabTypes(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lab types",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/admin/resources");
      const data = await response.json();
      setResources(data.filter((r: Resource) => r.active));
    } catch (error) {
      // Ignore error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingLabType
        ? `/api/admin/lab-types/${editingLabType.id}`
        : "/api/admin/lab-types";
      const method = editingLabType ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          maxDurationHours: formData.maxDurationHours
            ? parseFloat(formData.maxDurationHours)
            : null,
          active: formData.active,
          resourceIds: formData.resourceIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save lab type");
      }

      toast({
        title: "Success",
        description: `Lab Type ${editingLabType ? "updated" : "created"} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchLabTypes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save lab type",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (labType: LabType) => {
    setEditingLabType(labType);
    setFormData({
      name: labType.name,
      maxDurationHours: labType.maxDurationHours?.toString() || "",
      active: labType.active,
      resourceIds: labType.resources.map((r) => r.resource.id),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lab type?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/lab-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lab type");
      }

      toast({
        title: "Success",
        description: "Lab Type deleted successfully",
      });

      fetchLabTypes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lab type",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      maxDurationHours: "",
      active: true,
      resourceIds: [],
    });
    setEditingLabType(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lab Types</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lab Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLabType ? "Edit Lab Type" : "Create Lab Type"}
              </DialogTitle>
              <DialogDescription>
                {editingLabType
                  ? "Update the lab type details"
                  : "Add a new lab type"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="maxDurationHours">
                  Max Duration (hours, optional)
                </Label>
                <Input
                  id="maxDurationHours"
                  type="number"
                  step="0.5"
                  min="1"
                  value={formData.maxDurationHours}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDurationHours: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Resources</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                  {resources.map((resource) => (
                    <label
                      key={resource.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={formData.resourceIds.includes(resource.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              resourceIds: [...formData.resourceIds, resource.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              resourceIds: formData.resourceIds.filter(
                                (id) => id !== resource.id
                              ),
                            });
                          }
                        }}
                      />
                      <span>{resource.name} ({resource.type})</span>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLabType ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {labTypes.map((labType) => (
          <Card key={labType.id}>
            <CardHeader>
              <CardTitle>{labType.name}</CardTitle>
              <CardDescription>
                {labType.maxDurationHours
                  ? `Max ${labType.maxDurationHours}h`
                  : "No max duration"} • {labType.active ? "Active" : "Inactive"} •{" "}
                {labType.resources.length} resource(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(labType)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(labType.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

