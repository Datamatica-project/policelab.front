import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";

import { Search, X, Send, Shield } from "lucide-react";
import { toast } from "sonner";
import { getUserList, postSharedFiles } from "@/api/sharedApi";
import { useAuthStore } from "@/store/authStore";
import { useFileCountStore } from "@/store/fileCountStore";

interface FileMetadata {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  sharedWith: string[];
}

interface User {
  CreatedAt: string;
  email: string;
  ModifiedAt: string;
  name: string;
  roles: string[];
  status: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileMetadata;
}

// const mockUsers: User[] = [
//   {
//     id: "1",
//     name: "김수사관",
//     department: "강남서 수사과",
//     rank: "경위",
//     isOnline: true,
//   },
//   {
//     id: "2",
//     name: "박형사",
//     department: "강남서 수사과",
//     rank: "경사",
//     isOnline: true,
//   },
//   {
//     id: "3",
//     name: "이분석관",
//     department: "과학수사과",
//     rank: "경위",
//     isOnline: false,
//   },
//   {
//     id: "4",
//     name: "최팀장",
//     department: "강남서 수사과",
//     rank: "경감",
//     isOnline: true,
//   },
//   {
//     id: "5",
//     name: "정과학수사관",
//     department: "과학수사과",
//     rank: "경사",
//     isOnline: true,
//   },
//   {
//     id: "6",
//     name: "송검사",
//     department: "검찰청",
//     rank: "검사",
//     isOnline: false,
//   },
// ];

export function ShareDialog({ isOpen, onClose, file }: ShareDialogProps) {
  const { incrementSharedFileCount } = useFileCountStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [accessLevel, setAccessLevel] = useState("view");
  const [expiryDays, setExpiryDays] = useState("7");
  const { email } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await getUserList();
      setUsers(response.data);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserSelection = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.find((u) => u.email === user.email);
      if (isSelected) {
        return prev.filter((u) => u.email !== user.email);
      } else {
        return [...prev, user];
      }
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.email !== userId));
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error("공유할 사용자를 선택해주세요.");
      return;
    }

    try {
      const response = await postSharedFiles(
        selectedUsers.map((user) => user.email),
        email as string,
        file.id
      );
      if (response.message === "File shared successfully") {
        incrementSharedFileCount(1);

        toast.success(
          `${selectedUsers.length}명의 사용자와 파일이 공유되었습니다.`
        );
        onClose();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("공유 중 오류가 발생했습니다.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-blue-900 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            파일 공유
          </DialogTitle>
          <DialogDescription className="text-blue-600">
            {file.name}을(를) 다른 수사관과 안전하게 공유하세요
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* 현재 공유된 사용자 */}
          {file.sharedWith.length > 0 && (
            <div>
              <Label className="text-blue-900">현재 공유된 사용자</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {file.sharedWith.map((user, index) => (
                  <Badge key={index} className="bg-blue-100 text-blue-800">
                    {user}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 사용자 검색 */}
          <div className="space-y-2">
            <Label className="text-blue-900">사용자 검색</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
              <Input
                placeholder="이름 또는 부서로 검색..."
                className="pl-10 border-blue-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* 선택된 사용자 */}
          {selectedUsers.length > 0 && (
            <div>
              <Label className="text-blue-900">
                선택된 사용자 ({selectedUsers.length})
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.email}
                    className="bg-blue-600 text-white pr-1"
                  >
                    {user.name}
                    <button
                      onClick={() => removeSelectedUser(user.email)}
                      className="ml-2 hover:bg-blue-700 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 사용자 목록 */}
          <div className="space-y-2">
            <Label className="text-blue-900">사용자 목록</Label>
            <div className="border border-blue-200 rounded-lg max-h-48 overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.email}
                  className="flex items-center space-x-3 p-3 hover:bg-blue-50 border-b border-blue-100 last:border-b-0"
                >
                  <Checkbox
                    checked={selectedUsers.some((u) => u.email === user.email)}
                    onCheckedChange={() => toggleUserSelection(user)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-900">{user.name}</span>
                      <Badge
                        variant="outline"
                        className="text-xs border-blue-300 text-blue-700"
                      >
                        {user.roles.join(", ")}
                      </Badge>
                    </div>
                    <p className="text-blue-600">{user.email}</p>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-4 text-center text-blue-600">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 접근 권한 설정 */}
          {/* <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-blue-900">접근 권한</Label>
              <Select value={accessLevel} onValueChange={setAccessLevel}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">보기 전용</SelectItem>
                  <SelectItem value="download">다운로드 가능</SelectItem>
                  <SelectItem value="edit">편집 가능</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-blue-900">접근 기간</Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1일</SelectItem>
                  <SelectItem value="7">7일</SelectItem>
                  <SelectItem value="30">30일</SelectItem>
                  <SelectItem value="90">90일</SelectItem>
                  <SelectItem value="unlimited">무제한</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div> */}

          {/* 메시지 */}
          {/* <div className="space-y-2">
            <Label className="text-blue-900">메시지 (선택사항)</Label>
            <Textarea
              placeholder="공유에 대한 설명이나 주의사항을 입력하세요"
              className="border-blue-200"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div> */}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-blue-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            취소
          </Button>
          <Button
            onClick={handleShare}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={selectedUsers.length === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            공유하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
