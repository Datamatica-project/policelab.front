import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import {
  Download,
  Eye,
  FileImage,
  FileText,
  Search,
  Trash,
  X,
} from "lucide-react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Filter } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import PageNation from "./Custom/PageNation";
import { useFileCountStore } from "@/store/fileCountStore";
import { getFileList } from "@/api/uploadApi";
import { cancelShare } from "@/api/sharedApi";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

interface FileMetadata {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  size: string;
  uploadDate: string;
  uploader: string;
  category: string;
  tags: string[];
  description: string;
  url: string;
  thumbnail?: string;
  sharedWith: string[];
  downloadUrl: string;
}

export default function SharedFiles({
  sharedFiles,
  setSharedFiles,
  setRefreshKey,
}: {
  sharedFiles: any[];
  setSharedFiles: (files: any[]) => void;
  setRefreshKey: (key: React.SetStateAction<boolean>) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSearching, setIsSearching] = useState(false); // 검색/필터 모드 여부
  const { resetFileCount } = useFileCountStore(); // 파일 관리 탭 전환 시 뱃지 개수 초기화
  const [displayedFiles, setDisplayedFiles] = useState<any[]>([]);

  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const { email } = useAuthStore();

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <FileImage className="h-8 w-8 text-blue-600" />;
      default:
        return <FileText className="h-8 w-8 text-blue-600" />;
    }
  };

  const categoryOptions = {
    evidence: "증거 자료",
    photo: "현장 사진",
    other: "기타",
  };

  // 검색어나 카테고리 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(0);
    setIsSearching(searchTerm !== "" || selectedCategory !== "all");
  }, [searchTerm, selectedCategory]);

  // 검색/필터가 있을 때: 클라이언트에서 필터링 및 페이지네이션
  useEffect(() => {
    if (isSearching && sharedFiles.length > 0) {
      let filtered = [...sharedFiles];

      // 검색어 필터링
      if (searchTerm) {
        filtered = filtered.filter(
          (file) =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.tags?.some((tag: string) =>
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            ) ||
            file.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // 카테고리 필터링
      if (selectedCategory !== "all") {
        filtered = filtered.filter(
          (file) => file.category === selectedCategory
        );
      }

      // 클라이언트 페이지네이션 (페이지당 9개)
      const pageSize = 9;
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedFiles = filtered.slice(startIndex, endIndex);

      // 필터링된 결과 설정
      setDisplayedFiles(paginatedFiles);
      setTotalPages(Math.ceil(filtered.length / pageSize));
      setTotalElements(filtered.length);
    } else if (!isSearching) {
      // 검색/필터가 없을 때는 displayedFiles가 서버에서 이미 설정됨
      setDisplayedFiles(sharedFiles);
    }
  }, [sharedFiles, searchTerm, selectedCategory, currentPage, isSearching]);

  const handleCancelShare = async (fileId: string) => {
    const response = await cancelShare(fileId, email as string);

    if (response.message === "File unshared successfully") {
      setRefreshKey((prev) => !prev);
      toast.success("공유가 취소되었습니다.");
    } else {
      toast.error("파일 공유 취소중 문제가 발생하였습니다.");
    }
  };

  const handleDownload = async (file: FileMetadata) => {
    try {
      const response = await fetch(file.downloadUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("파일 다운로드 완료");
    } catch (error) {
      console.error(error);
      toast.error("파일 다운로드 실패");
    }
  };

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">파일 관리</CardTitle>
          <CardDescription className="text-blue-600">
            공유된 파일을 검색하고 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
              <Input
                placeholder="파일명, 태그, 설명으로 검색..."
                className="pl-10 border-blue-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48 border-blue-200">
                <Filter className="h-4 w-4 mr-2 text-blue-500" />
                <SelectValue placeholder="카테고리 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                <SelectItem value="evidence">증거 자료</SelectItem>
                <SelectItem value="photo">현장 사진</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 파일 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedFiles.map((file) => (
          <Card
            key={file.id}
            className="border-blue-200 hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* 파일 미리보기 */}
                <div className="aspect-video bg-blue-50 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {file.type === "image" && file.thumbnail ? (
                    <ImageWithFallback
                      src={file.thumbnail}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      {getFileIcon(file.type)}
                      <span className="text-blue-700 mt-2 uppercase">
                        {file.type}
                      </span>
                    </div>
                  )}
                </div>

                {/* 파일 정보 */}
                <div className="space-y-2">
                  <h3 className="text-blue-900 line-clamp-1">{file.name}</h3>
                  <div className="flex items-center justify-between text-blue-600">
                    <span>{file.size}</span>
                    <span>{file.uploadDate}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    {
                      categoryOptions[
                        file.category as keyof typeof categoryOptions
                      ]
                    }
                  </Badge>
                  <p className="text-blue-600 line-clamp-2">
                    {file.description}
                  </p>
                </div>

                {/* 태그 */}
                <div className="flex flex-wrap gap-1">
                  {file.tags.slice(0, 2).map((tag: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs border-blue-300 text-blue-700"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {file.tags.length > 2 && (
                    <Badge
                      variant="outline"
                      className="text-xs border-blue-300 text-blue-700"
                    >
                      +{file.tags.length - 2}
                    </Badge>
                  )}
                </div>

                {/* 공유 정보 */}
                <div className="text-blue-600">
                  <span>공유: {file.sharedWith.length}명</span>
                </div>

                {/* 액션 버튼 */}
                <div className="flex justify-between pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        보기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-blue-900">
                          {file.name}
                        </DialogTitle>
                        <DialogDescription className="text-blue-600">
                          업로드자: {file.uploader} | 업로드일:{" "}
                          {file.uploadDate}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 flex flex-col gap-4">
                        {file.type === "image" && file.thumbnail && (
                          <ImageWithFallback
                            src={file.thumbnail}
                            alt={file.name}
                            className="w-full rounded-lg"
                          />
                        )}
                        <div>
                          <h4 className="text-blue-900 mb-2">설명</h4>
                          <p className="text-blue-700">{file.description}</p>
                        </div>
                        <div>
                          <h4 className="text-blue-900 mb-2">태그</h4>
                          <div className="flex flex-wrap gap-2">
                            {file.tags.map((tag: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="border-blue-300 text-blue-700"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-blue-900 mb-2">공유된 사용자</h4>
                          <div className="flex flex-wrap gap-2">
                            {file.sharedWith.map(
                              (user: string, index: number) => (
                                <Badge
                                  key={index}
                                  className="bg-blue-100 text-blue-800"
                                >
                                  {user}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 ml-auto hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleCancelShare(file.id)}
                        >
                          <X className="h-4 w-4" />
                          공유 취소
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {displayedFiles.length === 0 && (
        <Card className="border-blue-200">
          <CardContent className="text-center py-8">
            <FileImage className="mx-auto h-12 w-12 text-blue-400 mb-4" />
            <p className="text-blue-600">검색 조건에 맞는 파일이 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 페이지 네이션 */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              className={
                currentPage === 0
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          <PageNation
            totalPages={totalPages || 1}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
              }
              className={
                currentPage === totalPages - 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
