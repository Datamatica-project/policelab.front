import { ImageApi } from "./index";

interface MetadataList {
  storageType: string;
  uploader: string;
  description: string;
  categoryName: string;
  tags: string[];
}

interface FileItem {
  id: string;
  file: File;
  preview?: string;
  uploader: string;
  description: string;
  category: string;
  tags: string[];
  dangerLevel: string;
}

interface FileItems {
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

export const uploadImage = async (files: FileItem[]) => {
  let metadataList: MetadataList[] = [];

  files.forEach((file) => {
    metadataList.push({
      storageType: file.dangerLevel === "high" ? "NAS" : "S3",
      uploader: file.uploader,
      description: file.description,
      categoryName: file.category,
      tags: file.tags,
    });
  });

  const metadataJsonString = JSON.stringify(metadataList);

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file.file);
  });
  formData.append("metadata", metadataJsonString);
  try {
    const response = await ImageApi.post("/api/files/upload", formData);

    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const zipFiles = async (
  fileMetadata: { fileId: string; boxes?: Array<Array<number>> }[],
  fileList: File[]
) => {
  const metadata = Object.values(fileMetadata);
  const formData = new FormData();
  const metadataJsonString = JSON.stringify(metadata);

  fileList.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("metadata", metadataJsonString);

  const response = await ImageApi.post("/api/files/replace", formData);
  return response.data;
};

export const getFileList = async (email: string, page: number = 0) => {
  const response = await ImageApi.get(
    `/api/files/owned?user=${email}&page=${page}&size=9`
  );
  return response.data;
};

export const deleteFile = async (fileId: string) => {
  try {
    const response = await ImageApi.delete(`/api/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};
