/**
 * 이슈 상세 패널 컴포넌트
 */

'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { apiPatch } from '@/utils/api-client';

interface Issue {
  id: string;
  site_id: string;
  page_url: string | null;
  issue_type: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  summary: string;
  description: string | null;
  fix_hint: string | null;
  affected_pages_count: number;
  created_at: number;
  updated_at: number;
}

interface IssueDetailPanelProps {
  issue: Issue | null;
  onClose: () => void;
  onStatusChange?: (issueId: string, status: string) => void;
}

function IssueDetailPanel({
  issue,
  onClose,
  onStatusChange,
}: IssueDetailPanelProps) {
  const [updating, setUpdating] = useState(false);

  // React Hooks 규칙: 조건부 return 전에 모든 hooks 호출
  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getIssueTypeLabel = useCallback((type: string) => {
    const labels: Record<string, string> = {
      missing_title: 'Title 누락',
      duplicate_title: '중복 Title',
      short_description: '짧은 Description',
      long_description: '긴 Description',
      no_h1: 'H1 없음',
      multiple_h1: '여러 H1',
      broken_internal_link: '깨진 링크',
      no_canonical_on_parameterized: 'Canonical 누락',
      slow_page: '느린 페이지',
      no_structured_data: '구조화 데이터 없음',
    };
    return labels[type] || type;
  }, []);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (updating || !issue) return;

    const currentIssue = issue; // 클로저를 위한 로컬 변수
    setUpdating(true);

    // 표준화된 API 클라이언트 사용
    const result = await apiPatch<{ message: string }>(
      `/api/sites/${currentIssue.site_id}/issues/${currentIssue.id}`,
      { status: newStatus },
      { timeout: 30000, retries: 1 }
    );

    if (result.ok && !result.error) {
      onStatusChange?.(currentIssue.id, newStatus);
    } else {
      // 프로덕션에서는 구조화된 에러 로깅 사용 권장
      if (process.env.NODE_ENV === 'development') {
        console.error('이슈 상태 업데이트 실패:', result.error);
      }
    }

    setUpdating(false);
  }, [issue, onStatusChange, updating]);

  // 조건부 렌더링은 hooks 호출 후에 수행
  if (!issue) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* 패널 */}
        <div className="relative z-10 w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">이슈 상세</h2>
            <button
              onClick={onClose}
              aria-label="이슈 상세 패널 닫기"
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 내용 */}
          <div className="px-6 py-4">
            <div className="mb-4 flex items-center gap-2">
              <span
                className={`rounded px-2 py-1 text-xs font-medium ${getSeverityColor(
                  issue.severity
                )}`}
              >
                {issue.severity.toUpperCase()}
              </span>
              <span className="text-sm text-gray-600">
                {getIssueTypeLabel(issue.issue_type)}
              </span>
            </div>

            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {issue.summary}
            </h3>

            {issue.description && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  설명
                </h4>
                <p className="text-sm text-gray-600">{issue.description}</p>
              </div>
            )}

            {issue.fix_hint && (
              <div className="mb-4 rounded-md bg-blue-50 p-4">
                <h4 className="mb-2 text-sm font-medium text-blue-900">
                  해결 가이드
                </h4>
                <p className="text-sm text-blue-800">{issue.fix_hint}</p>
              </div>
            )}

            {issue.page_url && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  영향받는 페이지
                </h4>
                <a
                  href={issue.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {issue.page_url}
                </a>
              </div>
            )}

            {issue.affected_pages_count > 1 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  총 {issue.affected_pages_count}개 페이지에 영향
                </p>
              </div>
            )}

            {/* 상태 변경 버튼 */}
            <div className="mt-6 flex gap-2 border-t border-gray-200 pt-4">
              <select
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                aria-label="이슈 상태 변경"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="open">열림</option>
                <option value="in_progress">진행 중</option>
                <option value="resolved">해결됨</option>
                <option value="ignored">무시됨</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 성능 최적화: React.memo로 불필요한 리렌더링 방지
export default memo(IssueDetailPanel);

