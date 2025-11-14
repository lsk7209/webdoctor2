/**
 * 이슈 목록 컴포넌트
 */

'use client';

import { useState, useEffect } from 'react';

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

interface IssuesListProps {
  siteId: string;
  onIssueClick?: (issue: Issue) => void;
  refreshTrigger?: number; // 새로고침 트리거
}

export default function IssuesList({ siteId, onIssueClick, refreshTrigger }: IssuesListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    severity: '' as '' | 'high' | 'medium' | 'low',
    status: '' as '' | 'open' | 'in_progress' | 'resolved' | 'ignored',
    issue_type: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
  });

  useEffect(() => {
    setPage(1); // 필터 변경 시 첫 페이지로 리셋
  }, [filters]);

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, filters, refreshTrigger, page]);

  const fetchIssues = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);
      if (filters.issue_type) params.append('issue_type', filters.issue_type);
      params.append('page', page.toString());
      params.append('limit', '50');

      const response = await fetch(`/api/sites/${siteId}/issues?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.data) {
        setIssues(data.data.issues || []);
        setStats(data.data.stats || stats);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1);
          setTotal(data.data.pagination.total || 0);
        }
      } else {
        setError(data.error || '이슈 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('이슈 목록을 불러오는 중 오류가 발생했습니다.');
      console.error('이슈 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);
      if (filters.issue_type) params.append('issue_type', filters.issue_type);
      params.append('format', format);

      const response = await fetch(`/api/sites/${siteId}/issues/export?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `issues-${siteId}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('이슈 내보내기 실패:', err);
      alert('이슈 내보내기에 실패했습니다.');
    }
  };

  const getSeverityColor = (severity: string) => {
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-50 text-red-700';
      case 'in_progress':
        return 'bg-yellow-50 text-yellow-700';
      case 'resolved':
        return 'bg-green-50 text-green-700';
      case 'ignored':
        return 'bg-gray-50 text-gray-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      missing_title: 'Title 누락',
      duplicate_title: '중복 Title',
      short_description: '짧은 Description',
      long_description: '긴 Description',
      missing_description: 'Description 누락',
      no_h1: 'H1 없음',
      multiple_h1: '여러 H1',
      broken_internal_link: '깨진 링크',
      no_canonical_on_parameterized: 'Canonical 누락',
      slow_page: '느린 페이지',
      low_seo_score: '낮은 SEO 점수',
      no_structured_data: '구조화 데이터 없음',
      poor_heading_structure: '헤딩 구조 문제',
      missing_open_graph: 'Open Graph 태그 없음',
    };
    return labels[type] || type;
  };

  // 사용 가능한 이슈 타입 목록 (고유값 추출)
  const availableIssueTypes = Array.from(
    new Set(issues.map((issue) => issue.issue_type))
  ).sort();

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">SEO 이슈</h2>
          <span className="text-sm text-gray-600">
            총 {total}개 {totalPages > 1 && `(페이지 ${page}/${totalPages})`}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            CSV 내보내기
          </button>
          <button
            onClick={() => handleExport('json')}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            JSON 내보내기
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={filters.severity}
          onChange={(e) =>
            setFilters({ ...filters, severity: e.target.value as any })
          }
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">모든 심각도</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value as any })
          }
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">모든 상태</option>
          <option value="open">Open</option>
          <option value="in_progress">진행 중</option>
          <option value="resolved">해결됨</option>
          <option value="ignored">무시됨</option>
        </select>

        <select
          value={filters.issue_type}
          onChange={(e) =>
            setFilters({ ...filters, issue_type: e.target.value })
          }
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">모든 이슈 타입</option>
          {availableIssueTypes.map((type) => (
            <option key={type} value={type}>
              {getIssueTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* 이슈 목록 */}
      {!loading && !error && issues.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-500">필터 조건에 맞는 이슈가 없습니다.</p>
        </div>
      ) : !loading && !error ? (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onIssueClick?.(issue)}
              className="cursor-pointer rounded-md border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${getSeverityColor(
                        issue.severity
                      )}`}
                    >
                      {issue.severity.toUpperCase()}
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(
                        issue.status
                      )}`}
                    >
                      {issue.status === 'open' && '열림'}
                      {issue.status === 'in_progress' && '진행 중'}
                      {issue.status === 'resolved' && '해결됨'}
                      {issue.status === 'ignored' && '무시됨'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getIssueTypeLabel(issue.issue_type)}
                    </span>
                  </div>
                  <h3 className="mb-1 font-medium text-gray-900">
                    {issue.summary}
                  </h3>
                  {issue.page_url && (
                    <p className="mb-2 text-sm text-gray-600">
                      {issue.page_url}
                    </p>
                  )}
                  {issue.affected_pages_count > 1 && (
                    <p className="text-xs text-gray-500">
                      {issue.affected_pages_count}개 페이지에 영향
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* 페이지네이션 */}
      {!loading && !error && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            {total}개 중 {Math.min((page - 1) * 50 + 1, total)}-{Math.min(page * 50, total)}개 표시
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

