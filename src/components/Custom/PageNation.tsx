import {
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "../ui/pagination";

interface PageNationProps {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export default function PageNation({
  totalPages,
  currentPage,
  setCurrentPage,
}: PageNationProps) {
  const maxVisible = 7; // 최대 표시할 페이지 수
  const pages: (number | string)[] = [];

  if (totalPages <= maxVisible) {
    // 페이지가 적으면 모두 표시
    for (let i = 0; i < totalPages; i++) {
      pages.push(i);
    }
  } else {
    // 현재 페이지 기준으로 앞뒤 2페이지씩 표시
    const start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);

    // 첫 페이지
    if (start > 0) {
      pages.push(0);
      if (start > 1) {
        pages.push("ellipsis-start");
      }
    }

    // 중간 페이지들
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // 마지막 페이지
    if (end < totalPages - 1) {
      if (end < totalPages - 2) {
        pages.push("ellipsis-end");
      }
      pages.push(totalPages - 1);
    }
  }

  return (
    <>
      {pages.map((page, idx) => {
        if (page === "ellipsis-start" || page === "ellipsis-end") {
          return (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
        const pageNum = page as number;
        return (
          <PaginationItem key={pageNum}>
            <PaginationLink
              onClick={() => setCurrentPage(pageNum)}
              isActive={currentPage === pageNum}
              className="cursor-pointer"
            >
              {pageNum + 1}
            </PaginationLink>
          </PaginationItem>
        );
      })}
    </>
  );
}
