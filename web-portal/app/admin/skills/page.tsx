'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, Edit, Trash2, ArrowLeft, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { useStatusUpdates } from '@/hooks/use-status-updates'

interface Skill {
  id: string
  name: string
  category: string
  description: string | null
  difficulty: string
  active: boolean
  processingStatus: string
  processedAt: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'TECHNICAL',
    description: '',
    difficulty: 'INTERMEDIATE',
    active: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  
  // Real-time status updates
  const { getStatusForEntity } = useStatusUpdates()

  const fetchSkills = async (page = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      params.set('page', page.toString())
      params.set('limit', '50')

      const url = `/api/admin/skills?${params.toString()}`
      
      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setSkills(data.skills)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
        setCurrentPage(data.pagination.page)
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSkills(1)
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSkills(1)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, categoryFilter])

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, any> = {
      TECHNICAL: 'default bg-blue-600',
      SOFT: 'default bg-purple-600',
      LANGUAGE: 'default bg-green-600',
      TOOL: 'default bg-orange-600',
    }
    return <Badge variant={variants[category] || 'outline'}>{category}</Badge>
  }

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, any> = {
      BEGINNER: 'secondary',
      INTERMEDIATE: 'default',
      ADVANCED: 'default bg-yellow-600',
      EXPERT: 'destructive',
    }
    return <Badge variant={variants[difficulty] || 'outline'}>{difficulty}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: 'secondary',
      PROCESSING: 'default bg-blue-600',
      COMPLETED: 'default bg-green-600',
      FAILED: 'destructive',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const getRealTimeStatus = (skill: Skill) => {
    return getStatusForEntity('SKILL', skill.id) || skill.processingStatus
  }

  const openCreateDialog = () => {
    setEditingSkill(null)
    setFormData({
      name: '',
      category: 'TECHNICAL',
      description: '',
      difficulty: 'INTERMEDIATE',
      active: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (skill: Skill) => {
    setEditingSkill(skill)
    setFormData({
      name: skill.name,
      category: skill.category,
      description: skill.description || '',
      difficulty: skill.difficulty,
      active: skill.active,
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingSkill(null)
    setFormData({
      name: '',
      category: 'TECHNICAL',
      description: '',
      difficulty: 'INTERMEDIATE',
      active: true,
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (editingSkill) {
        const response = await fetch(`/api/admin/skills?id=${editingSkill.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          setSkills(skills.map(s => s.id === editingSkill.id ? { ...s, ...formData } : s))
          closeDialog()
        }
      } else {
        const response = await fetch('/api/admin/skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          const data = await response.json()
          setSkills([...skills, data.skill])
          closeDialog()
        }
      }
    } catch (error) {
      console.error('Failed to save skill:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return

    try {
      const response = await fetch(`/api/admin/skills?id=${skillId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setSkills(skills.filter(s => s.id !== skillId))
      }
    } catch (error) {
      console.error('Failed to delete skill:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">Skill Taxonomy</h1>
          <p className="mt-2 text-muted-foreground">
            Manage skills database for career matching
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchSkills(currentPage)} disabled={isLoading}>
            <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value || 'all')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="TECHNICAL">Technical</SelectItem>
                <SelectItem value="SOFT">Soft Skills</SelectItem>
                <SelectItem value="LANGUAGE">Language</SelectItem>
                <SelectItem value="TOOL">Tool</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            {total} total skill{total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-semibold mb-2">No skills found</p>
              <p className="text-muted-foreground">Try adjusting your search criteria or add new skills.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Processing Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skills.map((skill) => (
                    <TableRow key={skill.id}>
                      <TableCell className="font-medium">{skill.name}</TableCell>
                      <TableCell>{getCategoryBadge(skill.category)}</TableCell>
                      <TableCell>{getDifficultyBadge(skill.difficulty)}</TableCell>
                      <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                        {skill.description || 'No description'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={skill.active ? 'default' : 'secondary'}>
                          {skill.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(getRealTimeStatus(skill))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(skill)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(skill.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({total} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSkills(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSkills(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
            <DialogDescription>
              {editingSkill ? 'Update the skill details below.' : 'Add a new skill to the taxonomy.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Skill Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Python, Communication, English"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value || 'TECHNICAL' })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECHNICAL">Technical</SelectItem>
                  <SelectItem value="SOFT">Soft Skills</SelectItem>
                  <SelectItem value="LANGUAGE">Language</SelectItem>
                  <SelectItem value="TOOL">Tool</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value || 'BEGINNER' })}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the skill..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.name}>
                {isSaving ? 'Saving...' : editingSkill ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
