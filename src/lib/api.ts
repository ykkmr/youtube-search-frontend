const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface VideoSearchRequest {
  keyword: string;
  maxResults?: number;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
  publishedAfter?: string;
  publishedBefore?: string;
  videoDuration?: 'any' | 'short' | 'medium' | 'long';
  pageToken?: string;
  minViewCount?: number;
  maxViewCount?: number;
}

export interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
  subscriberCount?: number;
}

export interface VideoSearchResponse {
  videos: VideoInfo[];
  totalResults: number;
  nextPageToken?: string;
  prevPageToken?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText || `HTTP error! status: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          // JSON 파싱 실패 시 원본 텍스트 사용
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error(
          `서버에 연결할 수 없습니다. 백엔드 서버(${this.baseUrl})가 실행 중인지 확인해주세요.`
        );
      }
      throw error;
    }
  }

  async searchVideos(request: VideoSearchRequest): Promise<VideoSearchResponse> {
    return this.request<VideoSearchResponse>('/api/youtube/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async searchVideosGet(
    keyword: string,
    options?: {
      maxResults?: number;
      order?: string;
      publishedAfter?: string;
      publishedBefore?: string;
      videoDuration?: string;
      minViewCount?: number;
      maxViewCount?: number;
    }
  ): Promise<VideoSearchResponse> {
    const params = new URLSearchParams({ keyword });
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.request<VideoSearchResponse>(`/api/youtube/search?${params.toString()}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);


