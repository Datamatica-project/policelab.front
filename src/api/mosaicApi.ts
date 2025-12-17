import { MosaicApi } from "./index";

export const PostMosaic = async (
  image: File,
  boxes: Array<Array<number>>
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", image);
  formData.append("boxes", JSON.stringify(boxes));
  const response = await MosaicApi.post<Blob>("/blur_boxes", formData, {
    responseType: "blob",
  });
  return response.data;
};
