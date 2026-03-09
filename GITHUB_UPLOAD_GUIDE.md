# GitHub 업로드 가이드 (초보자용)

이 문서는 `C:\MyProject2026\israelkh` 폴더의 코드를 GitHub에 올리는 방법을 쉽게 설명합니다.

---

## 1. 처음 한 번만 하는 설정

### 1) GitHub에서 새 저장소 만들기
- GitHub 로그인
- `New repository` 클릭
- 저장소 이름 입력 (예: `israelkh`)
- `Create repository` 클릭

권장:
- 초보자는 처음에 `README`, `.gitignore` 자동 생성 체크를 끄는 것이 충돌이 적습니다.

### 2) PowerShell에서 프로젝트 폴더로 이동
```powershell
cd C:\MyProject2026\israelkh
```

### 3) Git 초기화 + 첫 커밋
```powershell
git init
git add .
git commit -m "first commit"
```

### 4) GitHub 저장소 연결 + 업로드(push)
```powershell
git branch -M main
git remote add origin https://github.com/israelkh17-jpg/israelkh.git
git push -u origin main
```

---

## 2. 그다음부터는 이렇게 반복

코드를 수정한 뒤 아래 3줄만 실행하면 됩니다.

```powershell
cd C:\MyProject2026\israelkh
git add .

git push
```

---

## 3. 자주 쓰는 확인 명령어

### 현재 폴더 확인
```powershell
Get-Location
```

### 연결된 GitHub 저장소 주소 확인
```powershell
git remote -v
```

### 현재 브랜치 확인
```powershell
git branch --show-current
```

---

## 4. 저장소 주소를 바꿔야 할 때

이미 Git이 연결된 폴더인데, 원격 저장소 주소만 바꾸고 싶다면:

```powershell
cd C:\MyProject2026\israelkh
git remote set-url origin https://github.com/israelkh17-jpg/israelkh.git
git push -u origin main
```

---

## 5. 문제 발생 시 빠른 체크

- `rejected` 에러: 원격이 더 앞서 있음 → `git pull` 후 다시 `git push`
- `Permission denied` 에러: GitHub 로그인/권한 문제일 가능성 큼
- 파일이 안 보임: GitHub에서 `main` 브랜치인지 확인 후 새로고침

