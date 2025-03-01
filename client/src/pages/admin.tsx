import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  Users, 
  FileSpreadsheet, 
  RefreshCw, 
  Calendar, 
  CheckSquare, 
  Folder, 
  UserPlus,
  Search,
  MoreHorizontal
} from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type User, type Event, type Task } from "@shared/schema";
import { toast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Mock data for development
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
  {
    id: 4,
    googleSub: "google-sub-4",
    sheetName: "山田",
    name: "山田 花子",
    email: "yamada@example.com",
    role: "member",
    createdAt: new Date("2023-05-04"),
    updatedAt: new Date("2023-05-04")
  },
  {
    id: 5,
    googleSub: "google-sub-5",
    sheetName: "高橋",
    name: "高橋 次郎",
    email: "takahashi@example.com",
    role: "member",
    createdAt: new Date("2023-05-05"),
    updatedAt: new Date("2023-05-05")
  },
];

// Mock import history
const mockImportHistory = [
  {
    id: 1,
    timestamp: new Date("2023-07-01T00:00:05"),
    status: "success",
    type: "automatic",
    eventsCount: 45,
    details: "Daily automatic import completed successfully"
  },
  {
    id: 2,
    timestamp: new Date("2023-06-30T15:23:12"),
    status: "success",
    type: "manual",
    eventsCount: 23,
    details: "Manual import by admin user completed successfully"
  },
  {
    id: 3,
    timestamp: new Date("2023-06-30T00:00:05"),
    status: "success",
    type: "automatic",
    eventsCount: 45,
    details: "Daily automatic import completed successfully"
  },
  {
    id: 4,
    timestamp: new Date("2023-06-29T12:15:45"),
    status: "error",
    type: "manual",
    eventsCount: 0,
    details: "Failed to connect to Google Sheets API. Check credentials."
  },
  {
    id: 5,
    timestamp: new Date("2023-06-29T00:00:04"),
    status: "success",
    type: "automatic",
    eventsCount: 45,
    details: "Daily automatic import completed successfully"
  },
];

// Stats
const mockStats = {
  users: mockUsers.length,
  events: 125,
  tasks: 52,
  projects: 8
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    sheetName: "",
    role: "member"
  });
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // In a real app, replace with actual API calls
  const { data: users = mockUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: false, // Disable for mock data
  });

  const queryClient = useQueryClient();

  const handleSpreadsheetImport = async () => {
    // Google Sheetsからのインポート処理
    try {
      setIsImporting(true);
      const response = await fetch('/api/admin/import-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('インポートに失敗しました');
      }
      
      const data = await response.json();
      console.log("Imported from spreadsheet:", data);
      
      // 関連するクエリを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      
      toast({
        title: "インポート成功",
        description: `${data.count || 0}件のデータをインポートしました。`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "インポートエラー",
        description: error instanceof Error ? error.message : "インポート中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUserRoleToggle = (userId: number, isAdmin: boolean) => {
    // In a real app, make an API call to update user role
    console.log(`User ${userId} role changed to ${isAdmin ? 'admin' : 'member'}`);
  };

  const handleAddUser = () => {
    // In a real app, make an API call to add user
    console.log('Adding new user:', newUser);
    setIsAddUserOpen(false);
    setNewUser({
      name: "",
      email: "",
      sheetName: "",
      role: "member"
    });
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.sheetName.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h2>
          <p className="text-gray-500">システム設定、スプレッドシートのインポート、ユーザー管理</p>
        </div>
      </motion.div>

      <Tabs defaultValue="dashboard" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
          <TabsTrigger value="users">ユーザー管理</TabsTrigger>
          <TabsTrigger value="import">データインポート</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">ユーザー数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{mockStats.users}</p>
                    <p className="text-xs text-gray-500">チームメンバー</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-indigo-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">イベント数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                    <Calendar className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{mockStats.events}</p>
                    <p className="text-xs text-gray-500">スケジュール登録件数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">タスク数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                    <CheckSquare className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{mockStats.tasks}</p>
                    <p className="text-xs text-gray-500">タスク登録件数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">プロジェクト数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                    <Folder className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{mockStats.projects}</p>
                    <p className="text-xs text-gray-500">プロジェクト件数</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>最近のインポート履歴</CardTitle>
              <CardDescription>スプレッドシートからのインポート履歴</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日時</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead className="text-right">イベント数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockImportHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{format(item.timestamp, "yyyy/MM/dd")}</div>
                        <div className="text-xs text-gray-500">{format(item.timestamp, "HH:mm:ss")}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={item.type === "automatic" ? "border-blue-200 text-blue-700" : "border-indigo-200 text-indigo-700"}>
                          {item.type === "automatic" ? "自動" : "手動"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "success" ? "success" : "destructive"} className="bg-opacity-10">
                          {item.status === "success" ? "成功" : "エラー"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{item.eventsCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" size="sm">全ての履歴を表示</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="ユーザーを検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4"
              />
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 whitespace-nowrap">
                  <UserPlus className="h-4 w-4" />
                  ユーザーを追加
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>新規ユーザー追加</DialogTitle>
                  <DialogDescription>
                    ユーザー情報を入力して、追加ボタンを押してください。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">ユーザー名 *</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="例：田中 太郎"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">メールアドレス *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="例：tanaka@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sheetName">シート名 *</Label>
                    <Input
                      id="sheetName"
                      value={newUser.sheetName}
                      onChange={(e) => setNewUser({ ...newUser, sheetName: e.target.value })}
                      placeholder="例：田中（スプレッドシート上の名前）"
                    />
                    <p className="text-xs text-gray-500">スプレッドシート上で使われている名前・識別子を入力</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isAdmin">管理者権限</Label>
                    <Switch
                      id="isAdmin"
                      checked={newUser.role === "admin"}
                      onCheckedChange={(checked) => setNewUser({ ...newUser, role: checked ? "admin" : "member" })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddUser}>追加</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>ユーザー一覧</CardTitle>
              <CardDescription>全てのユーザーとその権限</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ユーザー</TableHead>
                    <TableHead>シート名</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead>権限</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">読み込み中...</TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">該当するユーザーはいません</TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${user.id}`} alt={user.name} />
                              <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{user.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.sheetName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role === "admin" ? "管理者" : "メンバー"}
                            </Badge>
                            <Switch
                              size="sm"
                              checked={user.role === "admin"}
                              onCheckedChange={(checked) => handleUserRoleToggle(user.id, checked)}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>編集</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">削除</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Settings */}
        <TabsContent value="import" className="space-y-6">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>スプレッドシートからのインポート</CardTitle>
              <CardDescription>Google Sheetsからのデータインポートを管理</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">スプレッドシート連携状況</h3>
                    <p className="text-sm text-gray-500">最終インポート: {format(mockImportHistory[0].timestamp, "yyyy/MM/dd HH:mm")}</p>
                  </div>
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    連携中
                  </Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-gray-500">スプレッドシートID</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" readOnly />
                      <Button variant="outline" size="icon" className="shrink-0">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V2.25C4 2.66421 4.33579 3 4.75 3H10.25C10.6642 3 11 2.66421 11 2.25V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM2 4.5C2 4.22386 2.22386 4 2.5 4H12.5C12.7761 4 13 4.22386 13 4.5V12.5C13 12.7761 12.7761 13 12.5 13H2.5C2.22386 13 2 12.7761 2 12.5V4.5ZM2.5 3C1.67157 3 1 3.67157 1 4.5V12.5C1 13.3284 1.67157 14 2.5 14H12.5C13.3284 14 14 13.3284 14 12.5V4.5C14 3.67157 13.3284 3 12.5 3H2.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">シート名</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value="チームスケジュール" readOnly />
                      <Button variant="outline" size="icon" className="shrink-0">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V2.25C4 2.66421 4.33579 3 4.75 3H10.25C10.6642 3 11 2.66421 11 2.25V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM2 4.5C2 4.22386 2.22386 4 2.5 4H12.5C12.7761 4 13 4.22386 13 4.5V12.5C13 12.7761 12.7761 13 12.5 13H2.5C2.22386 13 2 12.7761 2 12.5V4.5ZM2.5 3C1.67157 3 1 3.67157 1 4.5V12.5C1 13.3284 1.67157 14 2.5 14H12.5C13.3284 14 14 13.3284 14 12.5V4.5C14 3.67157 13.3284 3 12.5 3H2.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">自動インポート</h3>
                    <p className="text-sm text-gray-500">毎日0時に自動的にインポートします</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="border-t pt-3">
                  <Button className="gap-2 w-full sm:w-auto" disabled={isImporting} onClick={handleSpreadsheetImport}>
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        インポート中...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4" />
                        今すぐインポート
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle>最近のインポート履歴</CardTitle>
              <CardDescription>直近のインポート処理の結果</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日時</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>詳細</TableHead>
                    <TableHead className="text-right">イベント数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockImportHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{format(item.timestamp, "yyyy/MM/dd")}</div>
                        <div className="text-xs text-gray-500">{format(item.timestamp, "HH:mm:ss")}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={item.type === "automatic" ? "border-blue-200 text-blue-700" : "border-indigo-200 text-indigo-700"}>
                          {item.type === "automatic" ? "自動" : "手動"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "success" ? "success" : "destructive"} className="bg-opacity-10">
                          {item.status === "success" ? "成功" : "エラー"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.details}</TableCell>
                      <TableCell className="text-right">{item.eventsCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 