import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Search, Plus, Tag, Users, Calendar, CheckSquare, MoreHorizontal } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Project, type User, type Task } from "@shared/schema";

// Mock data for development
const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "チームスケジューラー開発",
    tag: "開発",
    detail: "チーム向けスケジュール管理アプリケーション。タスク、カレンダー、勤怠管理機能などを実装。Google Sheetsとの連携も実現。",
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2023-06-01")
  },
  {
    id: "project-2",
    name: "クライアントサイト改修",
    tag: "デザイン",
    detail: "企業Webサイトのリニューアル案件。レスポンシブデザイン対応、パフォーマンス改善なども含む。",
    createdAt: new Date("2023-06-15"),
    updatedAt: new Date("2023-06-15")
  },
  {
    id: "project-3",
    name: "モバイルアプリ開発",
    tag: "開発",
    detail: "クロスプラットフォーム対応のモバイルアプリケーション開発。React Nativeを使用。",
    createdAt: new Date("2023-07-01"),
    updatedAt: new Date("2023-07-01")
  },
];

const mockUsers: User[] = [
  {
    id: 1,
    googleSub: "google-sub-1",
    sheetName: "田中",
    name: "田中 太郎",
    email: "tanaka@example.com",
    role: "admin",
    createdAt: new Date("2023-05-01"),
    updatedAt: new Date("2023-05-01")
  },
  {
    id: 2,
    googleSub: "google-sub-2",
    sheetName: "佐藤",
    name: "佐藤 花子",
    email: "sato@example.com",
    role: "member",
    createdAt: new Date("2023-05-02"),
    updatedAt: new Date("2023-05-02")
  },
  {
    id: 3,
    googleSub: "google-sub-3",
    sheetName: "鈴木",
    name: "鈴木 一郎",
    email: "suzuki@example.com",
    role: "member",
    createdAt: new Date("2023-05-03"),
    updatedAt: new Date("2023-05-03")
  },
];

// Mock data for project members
const mockProjectMembers = [
  { projectId: "project-1", userId: 1 },
  { projectId: "project-1", userId: 2 },
  { projectId: "project-2", userId: 2 },
  { projectId: "project-2", userId: 3 },
  { projectId: "project-3", userId: 1 },
  { projectId: "project-3", userId: 3 },
];

// Mock tasks per project
const mockTasks: Task[] = [
  {
    id: "task-1",
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
    id: "task-2",
    userId: 2,
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
    id: "task-3",
    userId: 2,
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

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    tag: "",
    detail: ""
  });

  // In a real app, replace with actual API calls
  const { data: projects = mockProjects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: false, // Disable for mock data
  });

  const { data: users = mockUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: false, // Disable for mock data
  });

  const handleAddProject = () => {
    // In a real app, make an API call to create the project
    console.log('Adding new project:', newProject);
    setIsAddProjectOpen(false);
    setNewProject({
      name: "",
      tag: "",
      detail: ""
    });
  };

  const getProjectMembers = (projectId: string) => {
    return mockProjectMembers
      .filter(pm => pm.projectId === projectId)
      .map(pm => users.find(user => user.id === pm.userId))
      .filter(Boolean) as User[];
  };

  const getProjectTasks = (projectId: string) => {
    return mockTasks.filter(task => task.projectId === projectId);
  };

  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    return (
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.detail?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold text-gray-900">プロジェクト管理</h2>
          <p className="text-gray-500">プロジェクトの作成、メンバー管理、タスク管理ができます</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="プロジェクトを検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4"
            />
          </div>
          <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 whitespace-nowrap bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                <Plus className="h-5 w-5" />
                新規プロジェクト
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新規プロジェクト作成</DialogTitle>
                <DialogDescription>
                  プロジェクトの詳細情報を入力して、作成ボタンを押してください。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">プロジェクト名 *</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="プロジェクト名を入力"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tag">タグ</Label>
                  <Input
                    id="tag"
                    value={newProject.tag}
                    onChange={(e) => setNewProject({ ...newProject, tag: e.target.value })}
                    placeholder="タグを入力（例：開発、設計、デザインなど）"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="detail">詳細</Label>
                  <Textarea
                    id="detail"
                    value={newProject.detail}
                    onChange={(e) => setNewProject({ ...newProject, detail: e.target.value })}
                    placeholder="プロジェクトの詳細を入力"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddProject} disabled={!newProject.name}>作成</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Project Details Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        {selectedProject && (
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold">{selectedProject.name}</DialogTitle>
                {selectedProject.tag && (
                  <Badge className="ml-2">{selectedProject.tag}</Badge>
                )}
              </div>
              <DialogDescription className="text-sm text-gray-500">
                作成日: {format(selectedProject.createdAt, "yyyy/MM/dd")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4 grid gap-6 overflow-auto">
              {selectedProject.detail && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">詳細</h3>
                  <p className="text-sm">{selectedProject.detail}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  プロジェクトメンバー
                </h3>
                <div className="flex flex-wrap gap-2">
                  {getProjectMembers(selectedProject.id).map((member) => (
                    <div key={member.id} className="flex items-center gap-2 p-2 border rounded-md">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${member.id}`} alt={member.name} />
                        <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="h-12 border-dashed">
                    <Plus className="h-4 w-4 mr-2" />
                    メンバーを追加
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  関連タスク
                </h3>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-4">
                    {getProjectTasks(selectedProject.id).map((task) => {
                      const taskMember = users.find(u => u.id === task.userId);
                      return (
                        <div key={task.id} className="flex items-start gap-3 p-3 border rounded-md bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-medium ${task.status === "done" ? "line-through text-gray-500" : ""}`}>
                                {task.title}
                              </h4>
                              {task.tag && (
                                <Badge variant="outline" className="text-xs">
                                  {task.tag}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {taskMember && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${taskMember.id}`} alt={taskMember.name} />
                                    <AvatarFallback>{taskMember.name.substring(0, 2)}</AvatarFallback>
                                  </Avatar>
                                  {taskMember.name}
                                </div>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {format(task.dueDate, "yyyy/MM/dd")}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant={task.status === "done" ? "secondary" : "default"} className="text-xs">
                            {task.status === "done" ? "完了" : "未完了"}
                          </Badge>
                        </div>
                      );
                    })}
                    {getProjectTasks(selectedProject.id).length === 0 && (
                      <div className="text-center py-8 text-gray-500">タスクはありません</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setSelectedProject(null)}>閉じる</Button>
              <Button>タスクを追加</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectsLoading ? (
          <div className="col-span-full text-center py-12">読み込み中...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            プロジェクトが見つかりません
          </div>
        ) : (
          filteredProjects.map((project) => {
            const members = getProjectMembers(project.id);
            const tasks = getProjectTasks(project.id);
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full border-blue-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedProject(project)}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {format(project.createdAt, "yyyy/MM/dd")}作成
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>編集</DropdownMenuItem>
                          <DropdownMenuItem>メンバー管理</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">削除</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.tag && (
                      <Badge variant="outline" className="mb-2 flex items-center w-fit gap-1">
                        <Tag className="h-3 w-3" />
                        {project.tag}
                      </Badge>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {project.detail || "詳細はありません"}
                    </p>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex -space-x-2">
                        {members.slice(0, 3).map((member, i) => (
                          <Avatar key={member.id} className="h-8 w-8 border-2 border-white">
                            <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${member.id}`} alt={member.name} />
                            <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 3 && (
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 border-2 border-white text-xs font-medium">
                            +{members.length - 3}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {tasks.filter(t => t.status === "done").length}/{tasks.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
} 