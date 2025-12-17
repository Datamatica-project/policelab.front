import React, { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Upload, X, FileImage, FileVideo, FileText, Check } from "lucide-react";
import { toast } from "sonner";

import UploadModal from "./modal/UploadModal";
import { uploadImage } from "@/api/uploadApi";
import { useAuthStore } from "@/store/authStore";
import { useFileCountStore } from "@/store/fileCountStore";

interface newFileItem {
  id: string;
  uploader: string;
  file: File;
  preview?: string;
  description: string;
  category: string;
  tags: string[];
  dangerLevel: string;
}

interface FileItem {
  contentType: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  originalFileName: string;
  processingQueued: boolean;
  storagePath: string;
  storageType: string;
  storageUrl: string;
  uploadedAt: string | null;
}

export function FileUpload() {
  const [files, setFiles] = useState<newFileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { email } = useAuthStore();
  const { incrementFileCount } = useFileCountStore(); // 업로드 시 뱃지 개수 증가

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (newFiles: File[]) => {
    const fileItems: newFileItem[] = newFiles.map((file) => {
      const fileItem: newFileItem = {
        uploader: (email as string) ? (email as string) : "user",
        id: Math.random().toString(36).substr(2, 9),
        file,
        description: "",
        category: "",
        tags: [],
        dangerLevel: "",
      };

      // 이미지 파일의 경우 미리보기 생성
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, preview: e.target?.result as string }
                : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      return fileItem;
    });

    setFiles((prev) => [...prev, ...fileItems]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileDetails = (
    id: string,
    field: string,
    value: string | string[]
  ) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const getFileIcon = (file: File) => {
    if (file.type?.startsWith("image/"))
      return <FileImage className="h-6 w-6 text-blue-600" />;

    return <FileText className="h-6 w-6 text-blue-600" />;
  };

  // 모든 필수 입력값 확인
  const isReadyToUpload =
    files.length > 0 &&
    files.every(
      (f) =>
        f.category &&
        f.tags.length > 0 &&
        f.dangerLevel &&
        f.description.trim().length > 0
    );

  // 업로드 버튼 로직
  const handleUpload = async () => {
    if (!isReadyToUpload) {
      toast.error("카테고리·태그·위험도·설명을 모두 입력해주세요.");
      return;
    }

    setIsUploading(true);

    try {
      // 실제 업로드 로직은 Supabase 연결 후 구현
      const response = await uploadImage(files);

      if (response && response.length > 0) {
        incrementFileCount(response.length);
      }

      toast.success(`${response.length}개 파일이 성공적으로 업로드되었습니다.`);

      // 업로드된 파일들을 저장하고 모달 열기
      setUploadedFiles([...response]);
      setFiles([]);
      setShowPreviewModal(true);
    } catch (error) {
      toast.error("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 파일 드래그 앤 드롭 영역 */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">파일 업로드</CardTitle>
          <CardDescription className="text-blue-600">
            현장 사진, 증거 자료 등을 업로드하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-blue-300 hover:border-blue-400 hover:bg-blue-25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <p className="text-blue-900 mb-2">
              파일을 여기로 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-blue-600 mb-4">JPG, PNG 형식 지원</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              파일 선택
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg, image/png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(Array.from(e.target.files));
                  e.target.value = "";
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 업로드된 파일 목록 */}
      {files.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">
              업로드 대기 파일 ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="border border-blue-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {fileItem.preview ? (
                      <img
                        src={fileItem.preview}
                        alt=""
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center">
                        {getFileIcon(fileItem.file)}
                      </div>
                    )}
                    <div>
                      <p className="text-blue-900">{fileItem.file.name}</p>
                      <p className="text-blue-600">
                        {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(fileItem.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-blue-900">카테고리</Label>
                    <Select
                      value={fileItem.category}
                      onValueChange={(value) =>
                        updateFileDetails(fileItem.id, "category", value)
                      }
                    >
                      <SelectTrigger className="border-blue-200">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evidence">증거 자료</SelectItem>
                        <SelectItem value="photo">현장 사진</SelectItem>
                        <SelectItem value="other">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-blue-900">태그 (쉼표로 구분)</Label>
                    <Input
                      placeholder="사건번호, 위치, 날짜 등"
                      className="border-blue-200"
                      onChange={(e) => {
                        const tags = e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean);
                        updateFileDetails(fileItem.id, "tags", tags);
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-blue-900">위험도 설정</Label>
                    <Select
                      value={fileItem.dangerLevel}
                      onValueChange={(value) =>
                        updateFileDetails(fileItem.id, "dangerLevel", value)
                      }
                    >
                      <SelectTrigger className="border-blue-200">
                        <SelectValue placeholder="위험도 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">낮음(S3 저장)</SelectItem>
                        <SelectItem value="medium">중간(NAS 저장)</SelectItem>
                        <SelectItem value="high">
                          높음(S3 + NAS 저장)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900">설명</Label>
                  <Textarea
                    placeholder="파일에 대한 상세 설명을 입력하세요"
                    className="border-blue-200"
                    value={fileItem.description}
                    onChange={(e) =>
                      updateFileDetails(
                        fileItem.id,
                        "description",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                전체 취소
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className={`bg-blue-600 hover:bg-blue-700 ${
                  !isReadyToUpload
                    ? "opacity-50 bg-gray-500 hover:bg-gray-700 cursor-default"
                    : ""
                }`}
              >
                {isUploading ? (
                  <>업로드 중...</>
                ) : (
                  <>
                    {!isReadyToUpload ? (
                      <X className="w-4 h-4 mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    업로드 ({files.length})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 처리완료된 이미지를 미리보기로 보여주는 모달 컴포넌트 */}
      {showPreviewModal && (
        <UploadModal
          showPreviewModal={showPreviewModal}
          setShowPreviewModal={setShowPreviewModal}
          uploadedFiles={uploadedFiles}
        />
      )}
    </div>
  );
}
