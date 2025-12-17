import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Archive,
  ArrowRight,
  Check,
  FileImage,
  FileText,
  Pencil,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { PostMosaic } from "@/api/mosaicApi";
import { toast } from "sonner";
import KonvaBoundingBoxLayer from "../KonvaBoundingBoxLayer";
import { zipFiles } from "@/api/uploadApi";

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
  category?: string;
  tags?: string[];
}
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

interface UploadModalProps {
  showPreviewModal: boolean;
  setShowPreviewModal: (show: boolean) => void;
  uploadedFiles: FileItem[];
}

export default function UploadModal({
  showPreviewModal,
  setShowPreviewModal,
  uploadedFiles,
}: UploadModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [mosaicBoxes, setMosaicBoxes] = useState<Array<Array<number>>>([]);
  const [api, setApi] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultUrls, setResultUrls] = useState<Record<number, string>>({});
  const [imageMeta, setImageMeta] = useState<
    { renderW: number; renderH: number; naturalW: number; naturalH: number }[]
  >([]);
  const [boxesCollection, setBoxesCollection] = useState<
    { fileId: string; boxes?: Array<Array<number>> }[]
  >([]);
  const [fileMetadata, setFileMetadata] = useState<
    { fileId: string; boxes?: Array<Array<number>> }[]
  >([]);
  const [downloadedFiles, setDownloadedFiles] = useState<Record<number, File>>(
    {}
  );
  const [isReadyToUpload, setIsReadyToUpload] = useState(false);
  const zipSize = useRef<Record<number, number>>({});

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith("image/"))
      return <FileImage className="h-6 w-6 text-blue-600" />;

    return <FileText className="h-6 w-6 text-blue-600" />;
  };

  const resetUrl = (response: Blob) => {
    // 화면 표시용 Object URL 저장
    setResultUrls((prev) => {
      const next = { ...prev };
      if (next[currentIndex]) {
        URL.revokeObjectURL(next[currentIndex]);
      }
      next[currentIndex] = URL.createObjectURL(response);
      return next;
    });

    // 모자이크 처리된 파일을 downloadedFiles에 저장 (수동 모자이크 처리된 파일로 대체)
    const fileItem = uploadedFiles[currentIndex];
    const fileName = fileItem?.fileName || `image_${currentIndex}.jpg`;
    const mosaicFile = new File([response], fileName, {
      type: response.type || "image/jpeg",
    });

    setDownloadedFiles((prev) => {
      const next = { ...prev };
      next[currentIndex] = mosaicFile;
      return next;
    });
  };

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect(); // 초기값 세팅
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // 수정 취소 시 박스 좌표 초기화
  useEffect(() => {
    setIsEditing(false);
  }, [currentIndex]);

  useEffect(() => {
    let fileMetadata: { fileId: string; boxes?: Array<Array<number>> }[] = [];

    uploadedFiles.forEach((file) => {
      fileMetadata.push({ fileId: file.fileId, boxes: [] });
    });
    setFileMetadata(fileMetadata);
  }, []);

  useEffect(() => {
    // 비식별화 처리 된 이미지 파일들을 받아서 1차 보관
    const downloadFiles = async () => {
      const files: Record<number, File> = {};

      await Promise.all(
        uploadedFiles.map(async (fileItem, index) => {
          if (!fileItem.storageUrl) return;

          try {
            const response = await fetch(fileItem.storageUrl);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            const fileName = fileItem.fileName || `image_${index}.jpg`;
            const contentType =
              blob.type || fileItem.contentType || "image/jpeg";

            files[index] = new File([blob], fileName, { type: contentType });
          } catch (error) {
            console.error(
              `파일 ${index} (${fileItem.fileName}) 다운로드 실패:`,
              error
            );
            // 에러 발생 시 빈 파일 생성 (선택사항)
            files[index] = new File(
              [],
              fileItem.fileName || `image_${index}.jpg`,
              {
                type: fileItem.contentType || "image/jpeg",
              }
            );
          }
        })
      );

      setDownloadedFiles(files);
    };

    if (uploadedFiles.length > 0) {
      downloadFiles();
    }
  }, [uploadedFiles]);

  const handleMosaic = async () => {
    const fileItem = uploadedFiles[currentIndex];
    const imageUrl = fileItem?.storageUrl as string; // 현재 선택된 파일
    if (!imageUrl) return;
    let imageFile: File;
    let fileMetadata: { fileId: string; boxes?: Array<Array<number>> }[] = [];

    uploadedFiles.forEach((file) => {
      fileMetadata.push({ fileId: file.fileId, boxes: [] });
    });

    const meta = imageMeta[currentIndex]; // 현재 선택된 이미지의 메타 데이터
    const stageW = meta?.renderW ?? 1; // 현재 선택된 이미지의 렌더링 너비
    const stageH = meta?.renderH ?? 1; // 현재 선택된 이미지의 렌더링 높이
    const naturalW = meta?.naturalW ?? stageW; // 현재 선택된 이미지의 원본 너비
    const naturalH = meta?.naturalH ?? stageH; // 현재 선택된 이미지의 원본 높이

    const scaleX = naturalW / stageW; // 가로 비율 계산
    const scaleY = naturalH / stageH; // 세로 비율 계산

    const scaledBoxes = mosaicBoxes.map(([x, y, w, h]) => [
      // 박스 좌표 비율 계산
      x * scaleX,
      y * scaleY,
      w * scaleX,
      h * scaleY,
    ]);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const fileName = fileItem.fileName || "image.jpg";
      imageFile = new File([blob], fileName, {
        type: blob.type || "image/jpeg",
      });
    } catch (error) {
      console.error("이미지 다운로드 실패:", error);
      toast.error("이미지를 불러오는데 실패했습니다.");
      return;
    }

    try {
      // 모자이크 버튼을 누르면 현재 보고 있는 이미지의 파일을 토대로 모자이크 적용
      const response = await PostMosaic(imageFile, scaledBoxes);
      // 기존 URL 정리 후 새 결과 저장
      // 객체에 현재 인덱스와 새로운 URL을 저장

      resetUrl(response);

      //   각 currentIndex에 해당하는 scaledBoxes를 boxesCollection에 추가
      // 업로드 된 파일중 스케일 박스가 없더라도 boxesCollection에 id와 함께 빈 배열로 추가

      setFileMetadata((prev) => {
        const next = { ...prev };
        next[currentIndex].boxes = scaledBoxes;
        return next;
      });

      setIsEditing(false);
      toast.success("모자이크 적용이 완료되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("모자이크 적용에 실패했습니다.");
    }
  };

  const handleImageLoad = (
    idx: number,
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const el = e.currentTarget;
    const clientW = el.clientWidth || el.naturalWidth;
    const clientH = el.clientHeight || el.naturalHeight;

    setImageMeta((prev) => {
      const next = [...prev];
      next[idx] = {
        renderW: clientW,
        renderH: clientH,
        naturalW: el.naturalWidth,
        naturalH: el.naturalHeight,
      };
      return next;
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    toast.success("이미지를 드래그하여 모자이크를 적용해 주세요.");
  };

  const handleConfirm = () => {
    setShowPreviewModal(false);
    toast.success("업로드가 완료되었습니다.");
  };

  const handleZip = async () => {
    const files = Object.values(downloadedFiles); // File[]

    try {
      const response = await zipFiles(fileMetadata, files);

      if (Array.isArray(response)) {
        response.forEach((item, index) => {
          if (item.fileSize) {
            zipSize.current[index] = item.fileSize;
          }
        });
      }

      toast.success("파일 압축이 완료되었습니다.");
      setIsReadyToUpload(true);
    } catch (error) {
      console.error("파일 압축 실패:", error);
      toast.error("파일 압축에 실패했습니다.");
    }
  };

  return (
    <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
      <DialogContent className="max-w-5xl w-full overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <FileImage className="h-6 w-6 text-blue-600" />
            업로드 완료된 파일 미리보기
          </DialogTitle>
          <DialogDescription className="text-blue-700 mt-2 text-base">
            <span className="font-semibold text-blue-900">
              {uploadedFiles.length}개
            </span>{" "}
            파일이 성공적으로 업로드되었습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <Carousel
            className="w-full mx-auto"
            opts={{ watchDrag: !isEditing }}
            setApi={setApi}
          >
            <CarouselContent>
              {uploadedFiles.map((fileItem, index) => (
                <CarouselItem key={index}>
                  <div
                    key={fileItem.fileId}
                    className="border-2 border-blue-200 rounded-xl overflow-hidden w-full bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {fileItem.storageUrl ? (
                      <div className="w-full h-96 aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden group">
                        <ImageWithFallback
                          onLoad={(e: any) => handleImageLoad(index, e)}
                          src={resultUrls[index] ?? fileItem.storageUrl}
                          alt={fileItem.fileName}
                          className="max-h-full max-w-full w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-96 aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                        <div className="text-center">
                          {getFileIcon(fileItem.contentType)}
                          <p className="text-blue-600 text-sm mt-2">
                            이미지를 불러올 수 없습니다
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="p-5 space-y-3 bg-white">
                      <div className="flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <p className="text-blue-900 text-lg font-bold truncate">
                          {fileItem.fileName}
                        </p>
                      </div>

                      {/* 용량 압축 정보 */}
                      {isReadyToUpload && (
                        <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                          <div className="flex flex-col min-w-[80px]">
                            <span className="text-xs text-gray-600 mb-1 font-medium">
                              압축 전
                            </span>
                            <span className="text-base text-gray-700 font-bold">
                              {(fileItem.fileSize / 1024).toFixed(2)} KB
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-blue-600">
                            <ArrowRight className="h-5 w-5" />
                          </div>

                          <div className="flex flex-col min-w-[80px]">
                            <span className="text-xs text-blue-700 mb-1 font-medium">
                              압축 후
                            </span>
                            <span className="text-base text-blue-900 font-bold">
                              {(zipSize?.current[index] / 1024).toFixed(2)} KB
                            </span>
                          </div>

                          <div className="ml-auto flex items-center">
                            <span className="text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full font-bold shadow-md">
                              {(
                                ((fileItem.fileSize / 1024 -
                                  zipSize.current[index] / 1024) /
                                  (fileItem.fileSize / 1024)) *
                                100
                              ).toFixed(1)}
                              % 절약
                            </span>
                          </div>
                        </div>
                      )}

                      {fileItem?.category && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">
                            카테고리:
                          </span>
                          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                            {fileItem.category}
                          </span>
                        </div>
                      )}
                      {fileItem?.tags && fileItem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {fileItem?.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1.5 rounded-full font-medium border border-blue-200 shadow-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {isEditing && (
              <KonvaBoundingBoxLayer
                width={imageMeta[currentIndex]?.renderW ?? 670}
                height={imageMeta[currentIndex]?.renderH ?? 320}
                onSelect={(box: Array<Array<number>>) => setMosaicBoxes(box)}
              />
            )}
            <CarouselPrevious className="left-2 bg-white/90 hover:bg-white shadow-lg border border-blue-200" />
            <CarouselNext className="right-2 bg-white/90 hover:bg-white shadow-lg border border-blue-200" />
          </Carousel>
        </div>
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-blue-100 flex justify-end gap-3">
          <Button
            onClick={() => handleMosaic()}
            className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 ${
              isReadyToUpload ? "hidden opacity-0" : ""
            }`}
            disabled={!isEditing}
          >
            <Pencil className="w-4 h-4 mr-2" />
            모자이크
          </Button>
          {isEditing ? (
            <Button
              onClick={() => setIsEditing(false)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Pencil className="w-4 h-4 mr-2" />
              취소
            </Button>
          ) : (
            <Button
              onClick={() => handleEdit()}
              className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 ${
                isReadyToUpload ? "hidden opacity-0" : ""
              }`}
            >
              <Pencil className="w-4 h-4 mr-2" />
              수정
            </Button>
          )}
          {isReadyToUpload ? (
            <Button
              onClick={() => handleConfirm()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 px-6"
              disabled={isEditing}
            >
              <Check className="w-4 h-4 mr-2" />
              확인
            </Button>
          ) : (
            <Button
              onClick={() => handleZip()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 px-6"
              disabled={isEditing}
            >
              <Archive className="w-4 h-4 mr-2" />
              압축
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
