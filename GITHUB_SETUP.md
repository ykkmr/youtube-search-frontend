# GitHub 저장소 설정 가이드

## 1. GitHub에서 새 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 우측 상단의 "+" 버튼 클릭 → "New repository" 선택
3. 저장소 이름 입력 (예: `youtube-search-frontend`)
4. Public 또는 Private 선택
5. "Initialize this repository with a README" 체크 해제 (이미 로컬에 파일이 있으므로)
6. "Create repository" 클릭

## 2. 원격 저장소 연결 및 푸시

```bash
cd /Users/ileuleu/IdeaProjects/youtube-search-frontend

# 원격 저장소 추가 (YOUR_USERNAME과 REPO_NAME을 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/youtube-search-frontend.git

# 또는 SSH 사용 시
git remote add origin git@github.com:YOUR_USERNAME/youtube-search-frontend.git

# 메인 브랜치를 main으로 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

