'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusIcon, Trash2Icon, FolderIcon, ArrowRightIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Project {
  id: string
  name: string
  description: string | null
  sandbox_id: string | null
  created_at: string
  updated_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Create Modal State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (res.ok) {
        setProjects(data.projects || [])
      } else {
        setErrorMsg(data.error || 'Failed to fetch projects.')
      }
    } catch {
      setErrorMsg('Failed to connect to server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setCreating(true)
      setErrorMsg(null)
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
      const data = await res.json()

      if (res.ok && data.project) {
        setProjects((prev) => [data.project, ...prev])
        setName('')
        setDescription('')
        setDialogOpen(false)
      } else {
        setErrorMsg(data.error || 'Failed to create project.')
      }
    } catch {
      setErrorMsg('Failed to create project.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id))
      } else {
        const data = await res.json()
        setErrorMsg(data.error || 'Failed to delete project.')
      }
    } catch {
      setErrorMsg('Failed to delete project.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="container mx-auto min-h-screen p-6 max-w-6xl space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your AI Shopify projects and chat sessions
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <PlusIcon data-icon="inline-start" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateProject}>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Enter project details. It will be saved securely to your Supabase account.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="proj-name" className="text-xs font-medium text-foreground">
                    Project Name *
                  </label>
                  <Input
                    id="proj-name"
                    placeholder="e.g. My Shopify Store Agent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="proj-desc" className="text-xs font-medium text-foreground">
                    Description
                  </label>
                  <Textarea
                    id="proj-desc"
                    placeholder="Describe what this project does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !name.trim()}>
                  {creating ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Saving...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-center justify-between">
          <span>{errorMsg}</span>
          <Button variant="ghost" size="xs" onClick={() => setErrorMsg(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Projects Grid / Loading / Empty */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-4 text-center border-dashed">
          <div className="flex flex-col items-center max-w-md gap-4">
            <div className="p-4 rounded-full bg-muted text-muted-foreground">
              <FolderIcon className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                No projects created yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Create your first project to start interacting with the AI agent.
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="mt-2">
              <PlusIcon data-icon="inline-start" />
              Create First Project
            </Button>
          </div>
        </Card>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold truncate">
                    {project.name}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    ID: {project.id.slice(0, 8)}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                  {project.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-xs text-muted-foreground">
                Created on {new Date(project.created_at).toLocaleDateString()}
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === project.id}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {deletingId === project.id ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <Trash2Icon data-icon="inline-start" />
                      )}
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Project</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone and will delete all associated chat history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button size="sm" asChild>
                  <Link href={`/chat/${project.id}`}>
                    Open Chat
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
