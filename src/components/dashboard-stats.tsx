import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { FileImage, FileText, Upload } from "lucide-react";
import { getDashboardStats } from "@/api/dashboardApi";
import { useAuthStore, useLastUploadedAtStore } from "@/store/authStore";

// 상단 통계 카드 데이터
// fromYesterday: 어제 대비 전체 증가율 (어제기준 대비 오늘 업로드 수)
const dashboardStats = [
  { title: "오늘 업로드", value: 100, fromYesterday: 20.1 },
  { title: "현장사진", value: 70 },
  { title: "증거자료", value: 20 },
  { title: "기타", value: 10 },
];

export function DashboardStats() {
  const { email } = useAuthStore();
  const [categoryUploads, setCategoryUploads] = useState({
    evidence: 0,
    other: 0,
    photo: 0,
  });
  const [todayUploads, setTodayUploads] = useState(0);
  const [yesterdayUploadCount, setYesterdayUploadCount] = useState(0);
  const [categoryDistribution, setCategoryDistribution] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [weeklyUploads, setWeeklyUploads] = useState([]);
  const [hourlyUploadsToday, setHourlyUploadsToday] = useState([]);
  const { setLastUploadedAt } = useLastUploadedAtStore();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      const response = await getDashboardStats(email as string);

      setLastUploadedAt(response.lastUploadedAt);
      setCategoryUploads({
        evidence: response.categoryUploads.evidence,
        other: response.categoryUploads.other,
        photo: response.categoryUploads.photo,
      });
      setTodayUploads(response.todayUploadCount);
      setYesterdayUploadCount(response.yesterdayUploadCount);
      const mappedDistribution = response.categoryDistribution.map(
        (item: any) => ({
          name:
            item.category === "photo"
              ? "현장사진"
              : item.category === "evidence"
              ? "증거자료"
              : "기타",
          value: item.count,
          color:
            item.category === "photo"
              ? "#1e40af"
              : item.category === "evidence"
              ? "#60a5fa"
              : "#9ca3af",
        })
      );

      setCategoryDistribution(mappedDistribution);
      const weeklyDataDistribution = response.weeklyUploads.map(
        (item: any) => ({
          date: item.date.split("-")[1] + "/" + item.date.split("-")[2],
          photo: item.photo,
          evidence: item.evidence,
          other: item.other,
        })
      );
      setWeeklyUploads(weeklyDataDistribution);
      setHourlyUploadsToday(response.hourlyUploadsToday);
    };
    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-blue-900">
              {dashboardStats[0].title}
            </CardTitle>
            <Upload className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-blue-900">{todayUploads}</div>
            <p className="text-xs text-blue-600">
              {/* 어제에 비해서 얼마나 증가했나 표시하는 로직 */}
              {yesterdayUploadCount === 0
                ? todayUploads > 0
                  ? `+${todayUploads} from yesterday` // 숫자만 표시
                  : "0 from yesterday"
                : `+${(
                    ((todayUploads - yesterdayUploadCount) /
                      yesterdayUploadCount) *
                    100
                  ).toFixed(1)}% from yesterday`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-blue-900">
              {dashboardStats[1].title}
            </CardTitle>
            <FileImage className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-blue-900">{categoryUploads.photo}</div>
            <p className="text-xs text-blue-600">현장사진 업로드 수</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-blue-900">
              {dashboardStats[2].title}
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-blue-900">{categoryUploads.evidence}</div>
            <p className="text-xs text-blue-600">증거자료 업로드 수</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-blue-900">
              {dashboardStats[3].title}
            </CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-blue-900">{categoryUploads.other}</div>
            <p className="text-xs text-blue-600">기타 업로드 수</p>
          </CardContent>
        </Card>
      </div>

      {/* 차트들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 주간 파일 업로드 현황 */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">
              주간 파일 업로드 현황
            </CardTitle>
            <CardDescription className="text-blue-600">
              최근 7일간 파일 타입별 업로드 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyUploads}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="date" stroke="#1e40af" />
                <YAxis stroke="#1e40af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #1e40af",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="photo" name="현장사진" fill="#1e40af" />
                <Bar dataKey="evidence" name="증거자료" fill="#60a5fa" />
                <Bar dataKey="other" name="기타" fill="#9ca3af" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 파일 타입별 분포 */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">파일 타입별 분포</CardTitle>
            <CardDescription className="text-blue-600">
              전체 파일 중 타입별 비율
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 시간대별 업로드 현황 */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">시간대별 업로드 현황</CardTitle>
          <CardDescription className="text-blue-600">
            오늘 시간대별 파일 업로드 추이
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyUploadsToday}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="hour" stroke="#1e40af" />
              <YAxis stroke="#1e40af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #1e40af",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="uploads"
                stroke="#1e40af"
                strokeWidth={3}
                dot={{ fill: "#1e40af", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
