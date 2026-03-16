import { Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { useAuthStore } from "@/store/authStore";
import { getSharedFiles } from "@/api/sharedApi";
import SharedFiles from "./SharedFiles";

export default function SharedGallery() {
  const { email } = useAuthStore();
  const [isempty, setIsempty] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(false);

  useEffect(() => {
    const fetchSharedFiles = async () => {
      const response = await getSharedFiles(email as string);
      setIsempty(response.empty);
      setSharedFiles(response.content);
    };
    fetchSharedFiles();
  }, [refreshKey]);
  return (
    <>
      {(
        <SharedFiles
          sharedFiles={sharedFiles}
          setSharedFiles={setSharedFiles}
          setRefreshKey={setRefreshKey}
        />
      )}
      {/* {isempty ? (
        <Card className="border-blue-200">
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-blue-900 mb-2">공유 관리</h3>
            <p className="text-blue-600 mb-4">
              Supabase 연결 후 실시간 공유 관리 기능이 활성화됩니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SharedFiles
          sharedFiles={sharedFiles}
          setSharedFiles={setSharedFiles}
          setRefreshKey={setRefreshKey}
        />
      )} */}
    </>
  );
}
