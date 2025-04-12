import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Calendar, Tag, FolderKanban, Filter, Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { type Task, type Project } from "@shared/schema";

// Mock data for development
const mockTasks: Task[] = [
  {
    id: "1",
    userId: 1,
    title: "Webアプリケーション設計",
    projectId: "project-1",
    tag: "設計",
    dueDate: new Date("2023-07-15"),
    detail: "チームスケジューラーのUI/UX設計を完了させる",
    status: "open",
    createdAt: new Date("2023-07-01"),
    updatedAt: new Date("2023-07-01")
  },
  {
    id: "2",
    userId: 1,
    title: "API実装",
    projectId: "project-1",
    tag: "開発",
    dueDate: new Date("2023-07-20"),
    detail: "Google Sheetsからのインポート機能の実装",
    status: "open",
    createdAt: new Date("2023-07-02"),
    updatedAt: new Date("2023-07-02")
  },
  {
    id: "3",
    userId: 1,
    title: "デザインレビュー",
    projectId: "project-2",
    tag: "会議",
    dueDate: new Date("2023-07-10"),
    detail: "クライアントとのデザインレビューミーティング",
    status: "done",
    createdAt: new Date("2023-07-03"),
    updatedAt: new Date("2023-07-08")
  },
];

const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "チームスケジューラー開発",
    tag: "開発",
    detail: "チーム向けスケジュール管理アプリケーション",
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2023-06-01")
  },
  {
    id: "project-2",
    name: "クライアントサイト改修",
    tag: "デザイン",
    detail: "企業Webサイトのリニューアル案件",
    createdAt: new Date("2023-06-15"),
    updatedAt: new Date("2023-06-15")
  },
];

export default function Tasks() {
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    projectId: "",
    tag: "",
    dueDate: "",
    detail: ""
  });

  // In a real app, replace with actual API calls
  const { data: tasks = mockTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: false, // Disable for mock data
  });

  const { data: projects = mockProjects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: false, // Disable for mock data
  });

  const handleTaskStatusChange = (taskId: string, newStatus: "open" | "done") => {
    // In a real app, make an API call to update the task status
    console.log(`Task ${taskId} status changed to ${newStatus}`);
  };

  const handleAddTask = () => {
    // In a real app, make an API call to create the task
    console.log('Adding new task:', newTask);
    setIsAddTaskOpen(false);
    setNewTask({
      title: "",
      projectId: "",
      tag: "",
      dueDate: "",
      detail: ""
    });
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filter === "all") return true;
      return task.status === filter;
    })
    .filter(task => {
      if (!searchTerm) return true;
      return (
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.detail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900">タスク管理</h2>
          <p className="text-gray-500">タスクの追加・編集・管理ができます</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                <Plus className="h-5 w-5" />
                新規タスク追加
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新規タスク追加</DialogTitle>
                <DialogDescription>
                  タスクの詳細情報を入力して、追加ボタンを押してください。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">タスク名 *</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="タスクのタイトルを入力"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project">プロジェクト</Label>
                  <Select
                    value={newTask.projectId}
                    onValueChange={(value) => setNewTask({ ...newTask, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="プロジェクトを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tag">タグ</Label>
                    <Input
                      id="tag"
                      value={newTask.tag}
                      onChange={(e) => setNewTask({ ...newTask, tag: e.target.value })}
                      placeholder="タグを入力"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">期限日</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="detail">詳細</Label>
                  <Textarea
                    id="detail"
                    value={newTask.detail}
                    onChange={(e) => setNewTask({ ...newTask, detail: e.target.value })}
                    placeholder="タスクの詳細を入力"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddTask} disabled={!newTask.title}>追加</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-72 space-y-4">
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle>フィルター</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ステータス</Label>
                <Tabs defaultValue="all" className="mt-2" onValueChange={(value) => setFilter(value as any)}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="all">全て</TabsTrigger>
                    <TabsTrigger value="open">未完了</TabsTrigger>
                    <TabsTrigger value="done">完了</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div>
                <Label htmlFor="search">検索</Label>
                <div className="relative mt-2">
                  <Input
                    id="search"
                    placeholder="タスク名・タグ・詳細で検索"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    <Filter className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-4">
          <Card className="border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle>タスク一覧</CardTitle>
              <CardDescription>
                {filter === "all" ? "全てのタスク" : filter === "open" ? "未完了のタスク" : "完了したタスク"}
                （{filteredTasks.length}件）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasksLoading ? (
                <div className="text-center py-4">読み込み中...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">該当するタスクはありません</div>
              ) : (
                filteredTasks.map((task) => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 border rounded-lg border-blue-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.status === "done"}
                          onCheckedChange={(checked) => {
                            handleTaskStatusChange(task.id, checked ? "done" : "open");
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                            <h3 className={`font-medium ${task.status === "done" ? "line-through text-gray-500" : ""}`}>
                              {task.title}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {task.tag && (
                                <Badge variant="outline" className="gap-1 border-blue-200 text-blue-700">
                                  <Tag className="h-3 w-3" />
                                  {task.tag}
                                </Badge>
                              )}
                              {project && (
                                <Badge variant="outline" className="gap-1 border-indigo-200 text-indigo-700">
                                  <FolderKanban className="h-3 w-3" />
                                  {project.name}
                                </Badge>
                              )}
                              {task.dueDate && (
                                <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-700">
                                  <Calendar className="h-3 w-3" />
                                  {format(task.dueDate, "yyyy/MM/dd")}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {task.detail && (
                            <p className="text-sm text-gray-600">{task.detail}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => console.log(`Delete task ${task.id}`)}>
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 