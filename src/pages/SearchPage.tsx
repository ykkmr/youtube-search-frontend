import { useState } from 'react';
import { apiClient, type VideoInfo, type VideoSearchRequest } from '../lib/api';
import './SearchPage.css';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [prevPageToken, setPrevPageToken] = useState<string | undefined>();
  const [currentPageToken, setCurrentPageToken] = useState<string | undefined>();
  const [pageHistory, setPageHistory] = useState<string[]>([]); // 페이지 토큰 히스토리
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  
  // 필터 상태
  const [order, setOrder] = useState<'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount'>('relevance');
  const [maxResults, setMaxResults] = useState(25);
  const [videoDuration, setVideoDuration] = useState<'any' | 'shorts' | 'short' | 'medium' | 'long'>('any');
  const [minViewCount, setMinViewCount] = useState<string>('');
  const [maxViewCount, setMaxViewCount] = useState<string>('');

  const performSearch = async (pageToken?: string, isNextPage: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const request: VideoSearchRequest = {
        keyword: keyword.trim(),
        maxResults,
        order,
        videoDuration: videoDuration !== 'any' ? (videoDuration === 'shorts' ? 'short' : videoDuration) : undefined,
        minViewCount: minViewCount ? parseInt(minViewCount) : undefined,
        maxViewCount: maxViewCount ? parseInt(maxViewCount) : undefined,
        pageToken,
      };

      const response = await apiClient.searchVideos(request);
      setVideos(response.videos);
      setTotalResults(response.totalResults);
      setNextPageToken(response.nextPageToken);
      setPrevPageToken(response.prevPageToken);
      
      // 페이지 히스토리 관리
      if (!pageToken) {
        // 첫 페이지
        setPageHistory([]);
        setCurrentPageNumber(1);
        setCurrentPageToken(undefined);
      } else if (isNextPage) {
        // 다음 페이지로 이동 - 현재 페이지 토큰을 히스토리에 저장
        if (currentPageToken) {
          setPageHistory(prev => [...prev, currentPageToken]);
        }
        setCurrentPageToken(pageToken);
        setCurrentPageNumber(prev => prev + 1);
      } else {
        // 이전 페이지로 이동 - 히스토리에서 마지막 토큰 제거
        const newHistory = pageHistory.slice(0, -1);
        setPageHistory(newHistory);
        setCurrentPageToken(newHistory.length > 0 ? newHistory[newHistory.length - 1] : undefined);
        setCurrentPageNumber(prev => Math.max(1, prev - 1));
      }
    } catch (err: any) {
      setError(err.message || '검색에 실패했습니다.');
      setVideos([]);
      setTotalResults(0);
      setNextPageToken(undefined);
      setPrevPageToken(undefined);
      setCurrentPageToken(undefined);
      setPageHistory([]);
      setCurrentPageNumber(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setCurrentPageToken(undefined);
    setPageHistory([]);
    setCurrentPageNumber(1);
    await performSearch();
  };

  const handleNextPage = async () => {
    if (nextPageToken) {
      await performSearch(nextPageToken, true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = async () => {
    if (pageHistory.length > 0) {
      // 히스토리에서 이전 페이지 토큰 가져오기
      const prevToken = pageHistory[pageHistory.length - 1];
      await performSearch(prevToken, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentPageNumber > 1) {
      // 첫 페이지로 돌아가기
      await performSearch(undefined, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const calculateTotalPages = () => {
    if (totalResults === 0 || maxResults === 0) return 0;
    return Math.ceil(totalResults / maxResults);
  };

  const calculateCurrentRange = () => {
    const start = (currentPageNumber - 1) * maxResults + 1;
    const end = Math.min(currentPageNumber * maxResults, totalResults);
    return { start, end };
  };

  const formatNumber = (num?: number) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return null;
    
    // ISO 8601 형식 (PT1H2M30S)을 파싱
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>YouTube 검색</h1>
        <p className="subtitle">원하는 영상을 빠르고 정확하게 찾아보세요</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색할 키워드를 입력하세요..."
            className="search-input"
            required
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>정렬 기준</label>
            <select 
              value={order} 
              onChange={(e) => {
                setOrder(e.target.value as any);
                setCurrentPageToken(undefined);
                setNextPageToken(undefined);
                setPrevPageToken(undefined);
                setPageHistory([]);
                setCurrentPageNumber(1);
              }}
            >
              <option value="relevance">관련도순</option>
              <option value="date">최신순</option>
              <option value="viewCount">조회수순</option>
              <option value="rating">평점순</option>
              <option value="title">제목순</option>
            </select>
          </div>

          <div className="filter-group">
            <label>결과 수</label>
            <select 
              value={maxResults} 
              onChange={(e) => {
                setMaxResults(parseInt(e.target.value));
                setCurrentPageToken(undefined);
                setNextPageToken(undefined);
                setPrevPageToken(undefined);
                setPageHistory([]);
                setCurrentPageNumber(1);
              }}
            >
              <option value={10}>10개</option>
              <option value={25}>25개</option>
              <option value={50}>50개</option>
            </select>
          </div>

          <div className="filter-group">
            <label>영상 길이</label>
            <select 
              value={videoDuration} 
              onChange={(e) => {
                setVideoDuration(e.target.value as any);
                setCurrentPageToken(undefined);
                setNextPageToken(undefined);
                setPrevPageToken(undefined);
                setPageHistory([]);
                setCurrentPageNumber(1);
              }}
            >
              <option value="any">전체</option>
              <option value="shorts">1분 미만 (Shorts)</option>
              <option value="short">4분 미만</option>
              <option value="medium">4-20분</option>
              <option value="long">20분 이상</option>
            </select>
          </div>

          <div className="filter-group">
            <label>최소 조회수</label>
            <input
              type="number"
              value={minViewCount}
              onChange={(e) => setMinViewCount(e.target.value)}
              placeholder="예: 1000"
            />
          </div>

          <div className="filter-group">
            <label>최대 조회수</label>
            <input
              type="number"
              value={maxViewCount}
              onChange={(e) => setMaxViewCount(e.target.value)}
              placeholder="예: 1000000"
            />
          </div>
        </div>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {totalResults > 0 && (
        <div className="results-info">
          총 <strong>{totalResults.toLocaleString()}</strong>개의 결과를 찾았습니다.
          {videos.length > 0 && (
            <span className="results-range">
              {' '}({calculateCurrentRange().start.toLocaleString()} - {calculateCurrentRange().end.toLocaleString()}번째 결과 표시 중)
            </span>
          )}
        </div>
      )}

      <div className="videos-grid">
        {videos.map((video) => (
          <div key={video.videoId} className="video-card">
            <a
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="video-link"
            >
              <div className="video-thumbnail">
                <img src={video.thumbnailUrl} alt={video.title} />
                {formatDuration(video.duration) && (
                  <span className="video-duration">{formatDuration(video.duration)}</span>
                )}
              </div>
              <div className="video-info">
                <h3 className="video-title">{video.title}</h3>
                <p className="video-channel">{video.channelTitle}</p>
                <div className="video-meta">
                  {video.viewCount && (
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      {formatNumber(video.viewCount)}
                    </span>
                  )}
                  {video.likeCount && (
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      {formatNumber(video.likeCount)}
                    </span>
                  )}
                  {video.subscriberCount && (
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {formatNumber(video.subscriberCount)}
                    </span>
                  )}
                </div>
                <p className="video-date">{formatDate(video.publishedAt)}</p>
              </div>
            </a>
          </div>
        ))}
      </div>

      {videos.length === 0 && !loading && !error && (
        <div className="empty-state">
          <p>검색어를 입력하고 검색을 시작하세요</p>
        </div>
      )}

      {(nextPageToken || currentPageNumber > 1) && (
        <div className="pagination">
          <button
            onClick={handlePrevPage}
            disabled={currentPageNumber === 1 || loading}
            className="pagination-button prev"
          >
            이전
          </button>
          
          <div className="pagination-info">
            <span className="page-number">
              {currentPageNumber}
            </span>
            {totalResults > 0 && (
              <span className="page-range">
                {calculateCurrentRange().start.toLocaleString()} - {calculateCurrentRange().end.toLocaleString()} / {totalResults.toLocaleString()}
              </span>
            )}
            {calculateTotalPages() > 0 && (
              <span className="total-pages">
                총 {calculateTotalPages()}페이지
              </span>
            )}
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={!nextPageToken || loading}
            className="pagination-button next"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}


